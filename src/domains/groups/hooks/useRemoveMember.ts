/**
 * Remove member from group (leader only).
 */

import { useRemoveMemberMutation } from "../queries";

export function useRemoveMember() {
  return useRemoveMemberMutation();
}
