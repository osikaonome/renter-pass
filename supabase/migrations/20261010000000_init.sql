-- RenterPass initial schema.
-- Every table has row-level security enabled. Public (landlord-facing) access never
-- touches these tables directly: it goes through server routes using the service
-- role, with explicit checks in application code.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  email text not null,
  first_name text not null default '',
  last_name text not null default '',
  photo_path text,
  headline text not null default '',
  intro text not null default '',
  occupation text not null default '',
  employer text,
  employment_type text check (
    employment_type in ('full_time', 'part_time', 'contract', 'self_employed', 'student', 'other')
  ),
  move_in_date date,
  budget_min integer check (budget_min >= 0),
  budget_max integer check (budget_max >= 0),
  pets text,
  smoker boolean,
  household_size integer check (household_size between 1 and 12),
  rental_history jsonb not null default '[]'::jsonb,
  "references" jsonb not null default '[]'::jsonb,
  notification_prefs jsonb not null default '{
    "document_request": {"email": true, "push": true},
    "household_invite": {"email": true, "push": true},
    "link_viewed": {"email_digest": false, "push": false}
  }'::jsonb,
  default_access_hours integer not null default 72 check (default_access_hours between 1 and 720),
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budget_range check (budget_min is null or budget_max is null or budget_min <= budget_max)
);

create function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create an empty profile for every new auth user.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, email) values (new.id, coalesce(new.email, ''));
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- The profile id of the signed-in user. Security definer so policies on other
-- tables can call it without recursing through profiles' own policies.
create function public.current_profile_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.profiles where user_id = auth.uid()
$$;

-- ---------------------------------------------------------------------------
-- Documents
-- ---------------------------------------------------------------------------

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  category text not null check (
    category in ('employment_letter', 'landlord_reference', 'id', 'payslip', 'other')
  ),
  label text not null check (char_length(label) between 1 and 80),
  storage_path text not null unique,
  mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png', 'image/webp')),
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 10485760),
  sensitive_flags text[] not null default '{}',
  uploaded_at timestamptz not null default now()
);

create index documents_profile_id_idx on public.documents (profile_id);

-- ---------------------------------------------------------------------------
-- Households
-- ---------------------------------------------------------------------------

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  owner_profile_id uuid not null references public.profiles (id) on delete cascade,
  move_in_date date,
  combined_budget integer check (combined_budget >= 0),
  summary text check (char_length(summary) <= 1000),
  created_at timestamptz not null default now()
);

create table public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  status text not null default 'invited' check (status in ('invited', 'accepted', 'left')),
  invited_email text not null,
  invite_token_hash text unique,
  invited_at timestamptz not null default now(),
  joined_at timestamptz,
  unique (household_id, profile_id)
);

create index household_members_profile_idx on public.household_members (profile_id);

create function public.is_household_member(hid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.household_members
    where household_id = hid
      and profile_id = public.current_profile_id()
      and status = 'accepted'
  )
$$;

-- Household members may see each other's public profile fields only. Profiles RLS
-- stays "own row only"; this function exposes the safe column subset.
create function public.household_member_profiles(hid uuid)
returns table (
  profile_id uuid,
  first_name text,
  last_name text,
  headline text,
  occupation text,
  role text
)
language sql stable security definer set search_path = public as $$
  select p.id, p.first_name, p.last_name, p.headline, p.occupation, m.role
  from public.household_members m
  join public.profiles p on p.id = m.profile_id
  where m.household_id = hid
    and m.status = 'accepted'
    and public.is_household_member(hid)
$$;

-- ---------------------------------------------------------------------------
-- Share links and views
-- ---------------------------------------------------------------------------

create table public.share_links (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (char_length(slug) >= 12),
  owner_profile_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null default 'solo' check (kind in ('solo', 'household')),
  household_id uuid references public.households (id) on delete set null,
  label text not null check (char_length(label) between 1 and 80),
  listing_url text,
  listing_text text check (char_length(listing_text) <= 8000),
  message text check (char_length(message) <= 2000),
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint household_link_has_household check (kind = 'solo' or household_id is not null or revoked_at is not null)
);

create index share_links_owner_idx on public.share_links (owner_profile_id);

-- No IP address, user agent or other personal data about viewers.
create table public.link_views (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.share_links (id) on delete cascade,
  viewed_at timestamptz not null default now()
);

create index link_views_link_idx on public.link_views (link_id, viewed_at desc);

-- ---------------------------------------------------------------------------
-- Document requests and grants
-- ---------------------------------------------------------------------------

-- One-time codes for requester email verification. Service role only.
create table public.requester_verifications (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.share_links (id) on delete cascade,
  requester_name text not null,
  requester_email text not null,
  code_hash text not null,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  verified_at timestamptz,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.access_requests (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.share_links (id) on delete cascade,
  requester_name text not null check (char_length(requester_name) between 1 and 100),
  requester_email text not null,
  email_verified_at timestamptz not null,
  requester_message text check (char_length(requester_message) <= 500),
  status text not null default 'pending' check (
    status in ('pending', 'approved', 'partially_approved', 'declined')
  ),
  -- Hash of the secret the requester receives by email to open approved documents.
  access_token_hash text not null unique,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create index access_requests_link_idx on public.access_requests (link_id);

-- One row per requested document. In a household, each row belongs to the member
-- who owns that document, and only they can decide it.
create table public.access_request_documents (
  request_id uuid not null references public.access_requests (id) on delete cascade,
  document_id uuid not null references public.documents (id) on delete cascade,
  owner_profile_id uuid not null references public.profiles (id) on delete cascade,
  decision text not null default 'pending' check (decision in ('pending', 'approved', 'declined')),
  decided_at timestamptz,
  primary key (request_id, document_id)
);

create index access_request_documents_owner_idx on public.access_request_documents (owner_profile_id);

create table public.access_grants (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.access_requests (id) on delete cascade,
  document_id uuid not null references public.documents (id) on delete cascade,
  approved_by_profile_id uuid not null references public.profiles (id) on delete cascade,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  view_count integer not null default 0,
  last_viewed_at timestamptz,
  expiry_notified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (request_id, document_id)
);

create index access_grants_approver_idx on public.access_grants (approved_by_profile_id);

-- Keep access_requests.status in sync with per-document decisions.
create function public.refresh_access_request_status() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  total integer;
  approved integer;
  declined integer;
begin
  select count(*),
         count(*) filter (where decision = 'approved'),
         count(*) filter (where decision = 'declined')
    into total, approved, declined
    from public.access_request_documents
   where request_id = new.request_id;

  update public.access_requests
     set status = case
           when approved + declined < total then 'pending'
           when approved = total then 'approved'
           when declined = total then 'declined'
           else 'partially_approved'
         end,
         decided_at = case when approved + declined = total then now() else null end
   where id = new.request_id;
  return new;
end;
$$;

create trigger access_request_documents_status
  after update of decision on public.access_request_documents
  for each row execute function public.refresh_access_request_status();

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_profile_idx on public.notifications (profile_id, created_at desc);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.share_links enable row level security;
alter table public.link_views enable row level security;
alter table public.requester_verifications enable row level security;
alter table public.access_requests enable row level security;
alter table public.access_request_documents enable row level security;
alter table public.access_grants enable row level security;
alter table public.notifications enable row level security;
alter table public.push_subscriptions enable row level security;

-- Profiles: own row only. Created by trigger, deleted with the auth user.
create policy "profiles: read own" on public.profiles
  for select to authenticated using (user_id = auth.uid());
-- photo_path must point inside the user's own storage folder: the server signs
-- it with the service role for public pages, so it must never reference
-- someone else's file.
create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (photo_path is null or split_part(photo_path, '/', 1) = auth.uid()::text)
  );

-- Documents: owner only. Never readable by other household members.
-- storage_path must be inside the owner's folder, for the same reason as photos.
create policy "documents: owner all" on public.documents
  for all to authenticated
  using (profile_id = public.current_profile_id())
  with check (
    profile_id = public.current_profile_id()
    and split_part(storage_path, '/', 1) = auth.uid()::text
  );

-- Households
create policy "households: members read" on public.households
  for select to authenticated
  using (owner_profile_id = public.current_profile_id() or public.is_household_member(id));
create policy "households: create as owner" on public.households
  for insert to authenticated with check (owner_profile_id = public.current_profile_id());
create policy "households: owner update" on public.households
  for update to authenticated
  using (owner_profile_id = public.current_profile_id())
  with check (owner_profile_id = public.current_profile_id());
create policy "households: owner delete" on public.households
  for delete to authenticated using (owner_profile_id = public.current_profile_id());

-- Household members: members see the roster; the owner invites; a member can only
-- change their own row (to leave). Accepting an invite is done server-side after
-- checking the invite token.
create policy "household_members: members read" on public.household_members
  for select to authenticated
  using (public.is_household_member(household_id) or profile_id = public.current_profile_id());
-- The owner may add only (a) open invites, which the invitee must accept
-- themselves, or (b) their own owner row when creating the household. Nobody can
-- be added to a household without their consent.
create policy "household_members: owner invites" on public.household_members
  for insert to authenticated
  with check (
    exists (
      select 1 from public.households h
      where h.id = household_id and h.owner_profile_id = public.current_profile_id()
    )
    and (
      (status = 'invited' and profile_id is null and role = 'member')
      or (status = 'accepted' and profile_id = public.current_profile_id() and role = 'owner')
    )
  );
create policy "household_members: self leave" on public.household_members
  for update to authenticated
  using (profile_id = public.current_profile_id())
  with check (profile_id = public.current_profile_id() and status = 'left');
create policy "household_members: owner removes invites" on public.household_members
  for delete to authenticated
  using (
    status = 'invited' and exists (
      select 1 from public.households h
      where h.id = household_id and h.owner_profile_id = public.current_profile_id()
    )
  );

-- Share links: owner only.
create policy "share_links: owner all" on public.share_links
  for all to authenticated
  using (owner_profile_id = public.current_profile_id())
  with check (
    owner_profile_id = public.current_profile_id()
    and (household_id is null or public.is_household_member(household_id))
  );

-- Household members can see (not change) links made for their household, so
-- they know which listing a request for their documents came from.
create policy "share_links: household members read" on public.share_links
  for select to authenticated
  using (household_id is not null and public.is_household_member(household_id));

-- Link views: the link owner can read counts. Inserted by the server only.
create policy "link_views: owner read" on public.link_views
  for select to authenticated
  using (exists (
    select 1 from public.share_links l
    where l.id = link_id and l.owner_profile_id = public.current_profile_id()
  ));

-- requester_verifications: no policies, service role only.

-- Access requests: visible to the link owner and to anyone whose documents were
-- requested (household members). Created by the server only.
create policy "access_requests: involved read" on public.access_requests
  for select to authenticated
  using (
    exists (
      select 1 from public.share_links l
      where l.id = link_id and l.owner_profile_id = public.current_profile_id()
    )
    or exists (
      select 1 from public.access_request_documents d
      where d.request_id = access_requests.id and d.owner_profile_id = public.current_profile_id()
    )
  );

create policy "access_request_documents: owner read" on public.access_request_documents
  for select to authenticated using (owner_profile_id = public.current_profile_id());
create policy "access_request_documents: owner decides" on public.access_request_documents
  for update to authenticated
  using (owner_profile_id = public.current_profile_id())
  with check (owner_profile_id = public.current_profile_id());

-- Access grants: only the document owner can create one, and only for a document
-- that was actually requested in that request.
create policy "access_grants: owner read" on public.access_grants
  for select to authenticated using (approved_by_profile_id = public.current_profile_id());
create policy "access_grants: owner creates" on public.access_grants
  for insert to authenticated
  with check (
    approved_by_profile_id = public.current_profile_id()
    and exists (
      select 1 from public.documents d
      where d.id = document_id and d.profile_id = public.current_profile_id()
    )
    and exists (
      select 1 from public.access_request_documents r
      where r.request_id = access_grants.request_id
        and r.document_id = access_grants.document_id
        and r.owner_profile_id = public.current_profile_id()
    )
  );
create policy "access_grants: owner revokes" on public.access_grants
  for update to authenticated
  using (approved_by_profile_id = public.current_profile_id())
  with check (approved_by_profile_id = public.current_profile_id());

-- Notifications and push subscriptions: own only.
create policy "notifications: own read" on public.notifications
  for select to authenticated using (profile_id = public.current_profile_id());
create policy "notifications: own mark read" on public.notifications
  for update to authenticated
  using (profile_id = public.current_profile_id())
  with check (profile_id = public.current_profile_id());
create policy "push_subscriptions: own all" on public.push_subscriptions
  for all to authenticated
  using (profile_id = public.current_profile_id())
  with check (profile_id = public.current_profile_id());

-- Column-level hardening: authenticated users cannot rewrite who owns a row or
-- forge grant bookkeeping, even on rows they can update.
revoke update on public.profiles from authenticated;
grant update (
  first_name, last_name, photo_path, headline, intro, occupation, employer,
  employment_type, move_in_date, budget_min, budget_max, pets, smoker,
  household_size, rental_history, "references", notification_prefs,
  default_access_hours, last_active_at
) on public.profiles to authenticated;

revoke update on public.access_request_documents from authenticated;
grant update (decision, decided_at) on public.access_request_documents to authenticated;

revoke update on public.access_grants from authenticated;
grant update (revoked_at) on public.access_grants to authenticated;

revoke update on public.household_members from authenticated;
grant update (status) on public.household_members to authenticated;

revoke update on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: private buckets, objects stored under "<auth uid>/..."
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('documents', 'documents', false, 10485760,
    array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  ('photos', 'photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "storage: owner read" on storage.objects
  for select to authenticated
  using (bucket_id in ('documents', 'photos') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "storage: owner insert" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('documents', 'photos') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "storage: owner update" on storage.objects
  for update to authenticated
  using (bucket_id in ('documents', 'photos') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "storage: owner delete" on storage.objects
  for delete to authenticated
  using (bucket_id in ('documents', 'photos') and (storage.foldername(name))[1] = auth.uid()::text);
