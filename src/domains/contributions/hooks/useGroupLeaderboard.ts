/**
 * useGroupLeaderboard Hook
 */

import { useQuery } from "@tanstack/react-query";
import { groupLeaderboardQueryOptions } from "../queries";

export function useGroupLeaderboard(
  groupId: string,
  period: "week" | "month" | "all-time" = "week",
) {
  return useQuery(groupLeaderboardQueryOptions(groupId, period));
}
