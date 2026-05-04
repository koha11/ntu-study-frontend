/**
 * useTasksList Hook
 *
 * Fetches all tasks with optional filtering.
 * Handles loading, error, and data states automatically.
 *
 * Usage:
 * const { data: tasks, isLoading, error } = useTasksList();
 */

import { useQuery } from "@tanstack/react-query";
import { tasksListQueryOptions } from "../queries";

export function useTasksList(filters?: {
  status?: string;
  groupId?: string;
  assignedInGroups?: boolean;
}) {
  return useQuery(tasksListQueryOptions(filters));
}
