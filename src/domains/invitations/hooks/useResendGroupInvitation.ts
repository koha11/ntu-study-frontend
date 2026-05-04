/**
 * Resend a pending or expired group invitation (leader only).
 */

import { useResendGroupInvitationMutation } from "../queries";

export function useResendGroupInvitation() {
  return useResendGroupInvitationMutation();
}
