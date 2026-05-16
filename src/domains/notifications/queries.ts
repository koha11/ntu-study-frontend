/**
 * Notifications Domain - TanStack Query Configuration
 */

import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationKeys } from "@/shared/adapters/query-keys";
import { getAccessToken } from "@/domains/auth/token-storage";
import {
  fetchNotifications,
  patchAllNotificationsRead,
  patchNotificationRead,
  type NotificationListItem,
} from "./notifications-api";

function requireAccessToken(): string {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Not authenticated");
  }
  return token;
}

/**
 * Query: GET /notifications
 */
export const notificationsListQueryOptions = (filters?: { unreadOnly?: boolean }) =>
  queryOptions({
    queryKey: notificationKeys.list(filters),
    queryFn: async () => {
      const token = requireAccessToken();
      return fetchNotifications(token, { unreadOnly: filters?.unreadOnly });
    },
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 10,
    refetchInterval: 60_000,
  });

/**
 * Mutation: PATCH /notifications/:id/read
 */
export const useMarkNotificationAsReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const token = requireAccessToken();
      return patchNotificationRead(token, notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
    },
  });
};

/**
 * Mutation: PATCH /notifications/read-all
 */
export const useMarkAllNotificationsAsReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const token = requireAccessToken();
      return patchAllNotificationsRead(token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
    },
  });
};

export type { NotificationListItem };
