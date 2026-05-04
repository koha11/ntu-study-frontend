/**
 * useGroupMembers — GET /groups/:id/members
 */

import { useQuery } from "@tanstack/react-query";
import { groupMembersQueryOptions } from "../queries";

export function useGroupMembers(groupId: string) {
  return useQuery(groupMembersQueryOptions(groupId));
}
