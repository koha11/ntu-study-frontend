/**
 * useGroupsList Hook
 *
 * Fetches all groups with optional filtering.
 *
 * Usage:
 * const { data: groups, isLoading } = useGroupsList();
 */

import { useQuery } from "@tanstack/react-query";
import { groupsListQueryOptions } from "../queries";

export function useGroupsList(filters?: { role?: string; status?: string }) {
  return useQuery(groupsListQueryOptions(filters));
}
