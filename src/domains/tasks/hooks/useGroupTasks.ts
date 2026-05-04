import { useQuery } from "@tanstack/react-query";
import { tasksListQueryOptions } from "../queries";

/** Group Kanban: GET /tasks?groupId= — shares cache key with taskKeys.list({ groupId }) */
export function useGroupTasks(groupId: string) {
  return useQuery({
    ...tasksListQueryOptions({ groupId }),
    enabled: Boolean(groupId),
  });
}
