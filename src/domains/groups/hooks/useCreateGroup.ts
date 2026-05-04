/**
 * useCreateGroup Hook
 *
 * Creates a new group.
 *
 * Usage:
 * const { mutate: createGroup } = useCreateGroup();
 * createGroup({ name: 'Study Group', description: '...', tags: [] });
 */

import { useCreateGroupMutation } from "../queries";

export function useCreateGroup() {
  return useCreateGroupMutation();
}
