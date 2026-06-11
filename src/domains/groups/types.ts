/**
 * Groups Domain Types — aligned with backend API (snake_case JSON).
 */

/** Group status from backend enum */
export type GroupStatusApi = "active" | "locked";

/**
 * List item from GET /groups
 */
export interface GroupSummary {
  id: string;
  name: string;
  description?: string;
  member_count: number;
  leader_id: string;
  created_at: string;
}

/**
 * Full group from GET /groups/:id, POST /groups, PATCH /groups/:id
 */
export interface GroupDetail {
  id: string;
  name: string;
  description?: string | null;
  tags: string[];
  status: GroupStatusApi | string;
  leader_id: string;
  drive_folder_id?: string | null;
  /** Temporary view URL from Canva API (embed); expires (~30d); design id kept for refresh */
  canva_file_url?: string | null;
  canva_design_id?: string | null;
  /** YYYY-MM-DD from API */
  report_date?: string | null;
  doc_file_url?: string | null;
  meet_link?: string | null;
  /** Google Calendar ID for shared group calendar */
  google_calendar_id?: string | null;
  /** ISO timestamp when the group was locked; null when active */
  locked_at?: string | null;
  created_at: string;
  updated_at?: string;
}

/**
 * Member row from GET /groups/:id/members
 */
export interface MemberRow {
  user_id: string;
  full_name: string;
  /** Member email (from API); used to hide resend for people already in the group. */
  email?: string;
  role: "leader" | "member";
  is_active: boolean;
  joined_at: string;
}

/**
 * Invitation from POST /groups/:id/members/invite
 */
export interface GroupInvitation {
  id: string;
  group_id: string;
  invited_by_id?: string;
  email?: string | null;
  token: string;
  status?: string;
  expires_at: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Membership from PATCH .../toggle
 */
export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** POST /groups body */
export interface CreateGroupInput {
  name: string;
  description?: string;
  tags?: string[];
  /** YYYY-MM-DD — deliverable / report due date */
  report_date?: string;
  /** Emails to invite immediately after group creation (optional). */
  initial_member_emails?: string[];
}

/** POST /groups response — extends GroupDetail with best-effort invite results */
export interface CreateGroupResult extends GroupDetail {
  failed_invitations: { email: string; reason: string }[];
}

/** POST /groups/:id/calendar/meet-event */
export interface CreateGroupMeetEventInput {
  start: string;
  end?: string;
}

export interface CreateGroupMeetEventResult {
  event_id: string;
  meet_link: string;
  html_link: string;
  start: string;
  end: string;
}

/** GET /groups/:id/calendar/events */
export interface GroupCalendarEventRow {
  id: string;
  summary: string;
  start: { dateTime?: string | null; date?: string | null };
  end: { dateTime?: string | null; date?: string | null };
  html_link: string;
  location?: string | null;
  meet_link?: string | null;
}

/** POST /groups/:id/calendar/events */
export interface CreateGroupCalendarEventInput {
  start: string;
  end: string;
  summary?: string;
  mode: "offline" | "online";
  place_name?: string;
  address_detail?: string;
  maps_url?: string | null;
  online_option?: "group_meet_link" | "one_time_meet";
}

export interface CreateGroupCalendarEventResult {
  event_id: string;
  html_link: string;
  start: string;
  end: string;
  meet_link: string | null;
}

/** PATCH /groups/:id body */
export interface UpdateGroupInput {
  name?: string;
  description?: string;
  tags?: string[];
  meet_link?: string | null;
  report_date?: string | null;
  canva_file_url?: string | null;
  doc_file_url?: string | null;
  google_calendar_id?: string | null;
}
