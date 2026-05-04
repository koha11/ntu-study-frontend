/**
 * useMarkNotificationAsRead Hook
 */

import { useMarkNotificationAsReadMutation } from "../queries";

export function useMarkNotificationAsRead() {
  return useMarkNotificationAsReadMutation();
}
