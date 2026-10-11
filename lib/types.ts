// Row shapes as returned by Supabase (snake_case). Kept in one place so server
// code and TanStack Query hooks agree on what the API returns.

export type EmploymentType = "full_time" | "part_time" | "contract" | "self_employed" | "student" | "other";

export type RentalHistoryEntry = {
  address: string;
  from: string; // YYYY-MM
  to?: string; // YYYY-MM, empty while current
  landlordName?: string;
};

export type Reference = {
  name: string;
  relationship: string;
  // Contact details are never shown on the public profile.
  email?: string;
  phone?: string;
};

export type NotificationPrefs = {
  document_request: { email: boolean; push: boolean };
  household_invite: { email: boolean; push: boolean };
  link_viewed: { email_digest: boolean; push: boolean };
};

export type Profile = {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  photo_path: string | null;
  headline: string;
  intro: string;
  occupation: string;
  employer: string | null;
  employment_type: EmploymentType | null;
  move_in_date: string | null;
  budget_min: number | null;
  budget_max: number | null;
  pets: string | null;
  smoker: boolean | null;
  household_size: number | null;
  rental_history: RentalHistoryEntry[];
  references: Reference[];
  notification_prefs: NotificationPrefs;
  default_access_hours: number;
  created_at: string;
  updated_at: string;
};

export type DocumentCategory = "employment_letter" | "landlord_reference" | "id" | "payslip" | "other";

export type DocumentRow = {
  id: string;
  profile_id: string;
  category: DocumentCategory;
  label: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  sensitive_flags: string[];
  uploaded_at: string;
};

export type Household = {
  id: string;
  name: string;
  owner_profile_id: string;
  move_in_date: string | null;
  combined_budget: number | null;
  summary: string | null;
  created_at: string;
};

export type HouseholdMember = {
  id: string;
  household_id: string;
  profile_id: string | null;
  role: "owner" | "member";
  status: "invited" | "accepted" | "left";
  invited_email: string;
  invited_at: string;
  joined_at: string | null;
};

export type ShareLink = {
  id: string;
  slug: string;
  owner_profile_id: string;
  kind: "solo" | "household";
  household_id: string | null;
  label: string;
  listing_url: string | null;
  listing_text: string | null;
  message: string | null;
  created_at: string;
  revoked_at: string | null;
};

export type AccessRequestStatus = "pending" | "approved" | "partially_approved" | "declined";

export type AccessRequest = {
  id: string;
  link_id: string;
  requester_name: string;
  requester_email: string;
  email_verified_at: string;
  requester_message: string | null;
  status: AccessRequestStatus;
  created_at: string;
  decided_at: string | null;
};

export type AccessRequestDocument = {
  request_id: string;
  document_id: string;
  owner_profile_id: string;
  decision: "pending" | "approved" | "declined";
  decided_at: string | null;
};

export type AccessGrant = {
  id: string;
  request_id: string;
  document_id: string;
  approved_by_profile_id: string;
  expires_at: string;
  revoked_at: string | null;
  view_count: number;
  last_viewed_at: string | null;
  created_at: string;
};

export type NotificationType =
  | "document_request"
  | "link_viewed"
  | "access_expiring"
  | "household_invite"
  | "household_joined";

export type NotificationRow = {
  id: string;
  profile_id: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};
