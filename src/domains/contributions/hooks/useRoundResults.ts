import { useQuery } from "@tanstack/react-query";
import { roundResultsQueryOptions } from "../queries";

export function useRoundResults(
  groupId: string,
  roundStartedAt: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    ...roundResultsQueryOptions(groupId, roundStartedAt),
    enabled: Boolean(groupId && roundStartedAt) && (options?.enabled ?? true),
  });
}
