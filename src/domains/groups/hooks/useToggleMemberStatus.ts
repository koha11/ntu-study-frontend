/**
 * Toggle member active/inactive (leader only).
 */

import { useToggleMemberStatusMutation } from "../queries";

export function useToggleMemberStatus() {
  return useToggleMemberStatusMutation();
}
