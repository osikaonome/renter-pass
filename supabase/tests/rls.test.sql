-- RLS policy tests. Run with: supabase test db
-- Each block impersonates a user by setting the JWT claims the policies read.
begin;
create extension if not exists pgtap with schema extensions;
select plan(19);

-- Fixtures (as superuser) -----------------------------------------------------
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'alice@example.com'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@example.com'),
  ('00000000-0000-0000-0000-00000000000c', 'carol@example.com');

-- Profiles are created by trigger.
select is((select count(*)::int from public.profiles), 3, 'a profile is created for each new user');

create temp table ids as
select
  (select id from public.profiles where email = 'alice@example.com') as alice,
  (select id from public.profiles where email = 'bob@example.com') as bob,
  (select id from public.profiles where email = 'carol@example.com') as carol;
grant select on ids to authenticated;

insert into public.documents (id, profile_id, category, label, storage_path, mime_type, size_bytes)
select '10000000-0000-0000-0000-000000000001', alice, 'payslip', 'Alice payslip', '00000000-0000-0000-0000-00000000000a/a.pdf', 'application/pdf', 100 from ids;
insert into public.documents (id, profile_id, category, label, storage_path, mime_type, size_bytes)
select '10000000-0000-0000-0000-000000000002', bob, 'payslip', 'Bob payslip', '00000000-0000-0000-0000-00000000000b/b.pdf', 'application/pdf', 100 from ids;

-- Alice and Bob share a household; Carol is a stranger.
insert into public.households (id, name, owner_profile_id)
select '20000000-0000-0000-0000-000000000001', 'A & B', alice from ids;
insert into public.household_members (household_id, profile_id, role, status, invited_email)
select '20000000-0000-0000-0000-000000000001', alice, 'owner', 'accepted', 'alice@example.com' from ids
union all
select '20000000-0000-0000-0000-000000000001', bob, 'member', 'accepted', 'bob@example.com' from ids;

insert into public.share_links (id, slug, owner_profile_id, kind, household_id, label)
select '30000000-0000-0000-0000-000000000001', 'abcdefghijkmnp', alice, 'household', '20000000-0000-0000-0000-000000000001', 'Rathmines' from ids;

insert into public.access_requests (id, link_id, requester_name, requester_email, email_verified_at, access_token_hash)
values ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Landlord', 'll@example.com', now(), 'hash');
insert into public.access_request_documents (request_id, document_id, owner_profile_id)
select '40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', alice from ids
union all
select '40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', bob from ids;

-- As Alice --------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';

select is((select count(*)::int from public.profiles), 1, 'a renter sees only their own profile row');
select is((select count(*)::int from public.documents), 1, 'a renter sees only their own documents');
select is(
  (select count(*)::int from public.documents where id = '10000000-0000-0000-0000-000000000002'), 0,
  'household members cannot see each other''s documents'
);
select is(
  (select count(*)::int from public.household_member_profiles('20000000-0000-0000-0000-000000000001')), 2,
  'household members can see each other''s public profile fields'
);

-- Alice can grant her own document...
select lives_ok(
  $$insert into public.access_grants (request_id, document_id, approved_by_profile_id, expires_at)
    select '40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', alice, now() + interval '72 hours' from ids$$,
  'a document owner can grant access to their own requested document'
);
-- ...but not Bob's, even though the request came through her link.
select throws_ok(
  $$insert into public.access_grants (request_id, document_id, approved_by_profile_id, expires_at)
    select '40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', alice, now() + interval '72 hours' from ids$$,
  '42501', null,
  'no member can grant access to another member''s document'
);
select throws_ok(
  $$update public.profiles set user_id = '00000000-0000-0000-0000-00000000000c'$$,
  '42501', null,
  'a renter cannot change who owns their profile'
);
-- Alice cannot decide Bob's document (row invisible, so nothing updates).
update public.access_request_documents set decision = 'approved'
  where document_id = '10000000-0000-0000-0000-000000000002';
select is(
  (select count(*)::int from public.access_request_documents), 1,
  'a member sees only their own rows in a request'
);
select throws_ok(
  $$update public.household_members set status = 'accepted' where profile_id = (select alice from ids)$$,
  '42501', null,
  'members can only change their own membership to "left"'
);

select throws_ok(
  $$insert into public.household_members (household_id, profile_id, role, status, invited_email)
    select '20000000-0000-0000-0000-000000000001', carol, 'member', 'accepted', 'carol@example.com' from ids$$,
  '42501', null,
  'an owner cannot add someone to a household without their consent'
);
select throws_ok(
  $$update public.profiles set photo_path = '00000000-0000-0000-0000-00000000000b/photo-x.jpg'$$,
  '42501', null,
  'a renter cannot point their photo at another user''s file'
);
select throws_ok(
  $$insert into public.documents (profile_id, category, label, storage_path, mime_type, size_bytes)
    select alice, 'other', 'x', '00000000-0000-0000-0000-00000000000b/stolen.pdf', 'application/pdf', 1 from ids$$,
  '42501', null,
  'a renter cannot register another user''s stored file as their document'
);

-- As Bob ----------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';

select is(
  (select decision from public.access_request_documents where document_id = '10000000-0000-0000-0000-000000000002'), 'pending',
  'Alice''s attempt to decide Bob''s document had no effect'
);
select is((select count(*)::int from public.share_links), 1, 'household members can see household links');
select is((select count(*)::int from public.access_grants), 0, 'members cannot see grants made by others');

-- As Carol (stranger) ---------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}';

select is((select count(*)::int from public.share_links), 0, 'strangers cannot see links');
select is((select count(*)::int from public.access_requests), 0, 'strangers cannot see requests');
select is((select count(*)::int from public.requester_verifications), 0, 'verification codes are never readable by users');

select * from finish();
rollback;
