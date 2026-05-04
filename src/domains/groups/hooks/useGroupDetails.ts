/**
 * useGroupDetails Hook
 *
 * Fetches a single group by ID.
 *
 * Usage:
 * const { data: group } = useGroupDetails('group-123');
 */

import { useQuery } from "@tanstack/react-query";
import { groupDetailQueryOptions } from "../queries";

export function useGroupDetails(id: string) {
  return useQuery(groupDetailQueryOptions(id));
}
