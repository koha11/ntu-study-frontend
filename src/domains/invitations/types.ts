import type { GroupInvitation } from "@/domains/groups/types";

export type { GroupInvitation };

export interface InvitationGroupSnippet {
  id: string;
  name: string;
}

export interface InvitationInValidate {
  id: string;
  group_id: string;
  email?: string | null;
  token: string;
  status: string;
  expires_at: string;
  created_at: string;
  updated_at?: string;
  group?: InvitationGroupSnippet;
}

export interface InvitationValidateResult {
  valid: boolean;
  reason?: string;
  invitation?: InvitationInValidate;
}

export interface AcceptInvitationResponse {
  user: {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string | null;
    role?: string;
    created_at?: string;
    updated_at?: string;
  };
  access_token: string;
  refresh_token: string;
}
