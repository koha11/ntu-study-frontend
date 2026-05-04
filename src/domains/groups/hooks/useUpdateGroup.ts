/**
 * useUpdateGroup Hook
 *
 * Updates a group.
 *
 * Usage:
 * const { mutate: updateGroup } = useUpdateGroup();
 * updateGroup({ id: 'group-123', data: { name: 'New name' } });
 */

import { useUpdateGroupMutation } from "../queries";

export function useUpdateGroup() {
  return useUpdateGroupMutation();
}
