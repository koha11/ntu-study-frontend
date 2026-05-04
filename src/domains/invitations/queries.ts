import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { invitationKeys, groupKeys } from "@/shared/adapters/query-keys";
import { getAccessToken } from "@/domains/auth/token-storage";
import {
  validateInvitationToken,
  acceptInvitation,
  fetchGroupInvitations,
  resendGroupInvitation,
} from "./invitations-api";

function requireAccessToken(): string {
  const token = getAccessToken();
  if (!token) throw new Error("Not authenticated");
  return token;
}

export const invitationValidateQueryOptions = (token: string) =>
  queryOptions({
    queryKey: invitationKeys.validate(token),
    queryFn: () => validateInvitationToken(token),
    enabled: Boolean(token),
    retry: false,
    staleTime: 0,
  });

export const groupInvitationsQueryOptions = (groupId: string) =>
  queryOptions({
    queryKey: invitationKeys.groupPending(groupId),
    queryFn: async () => {
      const access = requireAccessToken();
      return fetchGroupInvitations(groupId, access);
    },
    enabled: Boolean(groupId),
    staleTime: 1000 * 60,
  });

export const useAcceptInvitationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { token: string; full_name?: string }) =>
      acceptInvitation(params.token, params.full_name ? { full_name: params.full_name } : {}),
    onSuccess: (_, { token }) => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.validate(token) });
      queryClient.invalidateQueries({ queryKey: invitationKeys.all });
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
  });
};

export const useResendGroupInvitationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { groupId: string; invitationId: string }) => {
      const token = requireAccessToken();
      return resendGroupInvitation(params.groupId, params.invitationId, token);
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.groupPending(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.members(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
};
