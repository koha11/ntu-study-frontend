import { useQuery } from "@tanstack/react-query";
import { groupInvitationsQueryOptions } from "../queries";

export function useGroupInvitations(groupId: string, enabled = true) {
  return useQuery({
    ...groupInvitationsQueryOptions(groupId),
    enabled: Boolean(groupId) && enabled,
  });
}
