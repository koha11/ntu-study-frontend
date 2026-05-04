/**
 * useContributionSummary Hook
 */

import { useQuery } from "@tanstack/react-query";
import { contributionSummaryQueryOptions } from "../queries";

export function useContributionSummary(userId: string, groupId: string) {
  return useQuery(contributionSummaryQueryOptions(userId, groupId));
}
