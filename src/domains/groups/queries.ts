/**
 * Groups Domain - TanStack Query Configuration
 */

import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { groupKeys, invitationKeys } from "@/shared/adapters/query-keys";
import { getAccessToken } from "@/domains/auth/token-storage";
import {
  fetchUserGroups,
  fetchGroupDetails,
  createGroup,
  updateGroup,
  fetchGroupMembers,
  inviteMember,
  toggleMemberStatus,
  removeMember,
  createGroupMeetEvent,
  fetchGroupCalendarEvents,
  createGroupCalendarEvent,
  fetchCanvaPreview,
  lockGroup,
  unlockGroup,
} from "./groups-api";
import type {
  CreateGroupCalendarEventInput,
  CreateGroupInput,
  CreateGroupResult,
  CreateGroupMeetEventInput,
  GroupCalendarEventRow,
  UpdateGroupInput,
} from "./types";

function requireAccessToken(): string {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Not authenticated");
  }
  return token;
}

/**
 * Query: Current user's groups (GET /groups)
 */
export const groupsListQueryOptions = (filters?: { role?: string; status?: string }) =>
  queryOptions({
    queryKey: groupKeys.list(filters),
    queryFn: async () => {
      const token = requireAccessToken();
      return fetchUserGroups(token);
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

/**
 * Query: Single group (GET /groups/:id)
 */
export const groupDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: groupKeys.detail(id),
    queryFn: async () => {
      const token = requireAccessToken();
      return fetchGroupDetails(id, token);
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    enabled: Boolean(id),
  });

/**
 * Query: Group members (GET /groups/:id/members)
 */
export const groupMembersQueryOptions = (groupId: string) =>
  queryOptions({
    queryKey: groupKeys.members(groupId),
    queryFn: async () => {
      const token = requireAccessToken();
      return fetchGroupMembers(groupId, token);
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 30,
    enabled: Boolean(groupId),
  });

/**
 * Mutation: Create group
 */
export const useCreateGroupMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateGroupInput): Promise<CreateGroupResult> => {
      const token = requireAccessToken();
      return createGroup(input, token);
    },
    onSuccess: (data: CreateGroupResult) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      queryClient.setQueryData(groupKeys.detail(data.id), data);
    },
  });
};

/**
 * Mutation: Update group
 */
export const useUpdateGroupMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; data: UpdateGroupInput }) => {
      const token = requireAccessToken();
      return updateGroup(params.id, params.data, token);
    },
    onSuccess: (updatedGroup) => {
      queryClient.setQueryData(groupKeys.detail(updatedGroup.id), updatedGroup);
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
};

/**
 * Mutation: Invite member (POST /groups/:id/members/invite)
 */
export const useInviteMemberMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { groupId: string; email: string }) => {
      const token = requireAccessToken();
      return inviteMember(params.groupId, params.email, token);
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.members(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invitationKeys.groupPending(groupId) });
    },
  });
};

/**
 * Mutation: Toggle member active status
 */
export const useToggleMemberStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { groupId: string; userId: string }) => {
      const token = requireAccessToken();
      return toggleMemberStatus(params.groupId, params.userId, token);
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.members(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
};

/**
 * Mutation: Remove member from group
 */
export const useRemoveMemberMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { groupId: string; userId: string }) => {
      const token = requireAccessToken();
      return removeMember(params.groupId, params.userId, token);
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.members(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
};

/**
 * Query: Canva design preview (thumbnail + edit URL) for a group
 */
export const canvaPreviewQueryOptions = (groupId: string) =>
  queryOptions({
    queryKey: [...groupKeys.detail(groupId), "canva-preview"] as const,
    queryFn: async () => {
      const token = requireAccessToken();
      return fetchCanvaPreview(groupId, token);
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 15,
    enabled: Boolean(groupId),
  });

/**
 * Mutation: Create Calendar event with Meet + invites (POST .../calendar/meet-event)
 */
export const useCreateGroupMeetEventMutation = () =>
  useMutation({
    mutationFn: async (params: {
      groupId: string;
      input: CreateGroupMeetEventInput;
    }) => {
      const token = requireAccessToken();
      return createGroupMeetEvent(params.groupId, params.input, token);
    },
  });

/**
 * Query: Group shared calendar events (GET .../calendar/events)
 */
export const groupCalendarEventsQueryOptions = (
  groupId: string,
  range: { timeMin: string; timeMax: string } | null,
) =>
  queryOptions({
    queryKey: [...groupKeys.detail(groupId), "calendar", range] as const,
    queryFn: async (): Promise<GroupCalendarEventRow[]> => {
      if (!range) {
        return [];
      }
      const token = requireAccessToken();
      return fetchGroupCalendarEvents(groupId, range.timeMin, range.timeMax, token);
    },
    enabled: Boolean(groupId && range),
    staleTime: 30_000,
  });

/**
 * Mutation: Lock group (POST /groups/:id/lock)
 */
export const useLockGroupMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string) => {
      const token = requireAccessToken();
      return lockGroup(groupId, token);
    },
    onSuccess: (updatedGroup) => {
      queryClient.setQueryData(groupKeys.detail(updatedGroup.id), updatedGroup);
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
};

/**
 * Mutation: Unlock group (POST /groups/:id/unlock)
 */
export const useUnlockGroupMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { groupId: string; reason: string }) => {
      const token = requireAccessToken();
      return unlockGroup(params.groupId, params.reason, token);
    },
    onSuccess: (updatedGroup) => {
      queryClient.setQueryData(groupKeys.detail(updatedGroup.id), updatedGroup);
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
};

/**
 * Mutation: Create event on shared group calendar (POST .../calendar/events)
 */
export const useCreateGroupCalendarEventMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      groupId: string;
      input: CreateGroupCalendarEventInput;
    }) => {
      const token = requireAccessToken();
      return createGroupCalendarEvent(params.groupId, params.input, token);
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
      queryClient.invalidateQueries({ queryKey: [...groupKeys.detail(groupId), "calendar"] });
    },
  });
};
