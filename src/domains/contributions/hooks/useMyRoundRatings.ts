import { useQuery } from "@tanstack/react-query";
import { myRoundRatingsQueryOptions } from "../queries";

export function useMyRoundRatings(
  groupId: string,
  roundStartedAt: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    ...myRoundRatingsQueryOptions(groupId, roundStartedAt),
    enabled: Boolean(groupId && roundStartedAt) && (options?.enabled ?? true),
  });
}
