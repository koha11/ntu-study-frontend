/**
 * Invite a user by email (leader only).
 */

import { useInviteMemberMutation } from "../queries";

export function useInviteMember() {
  return useInviteMemberMutation();
}
