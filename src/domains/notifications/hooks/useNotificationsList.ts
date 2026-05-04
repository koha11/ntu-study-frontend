/**
 * useNotificationsList Hook
 */

import { useQuery } from "@tanstack/react-query";
import { notificationsListQueryOptions } from "../queries";

export function useNotificationsList(filters?: { unreadOnly?: boolean }) {
  return useQuery(notificationsListQueryOptions(filters));
}
