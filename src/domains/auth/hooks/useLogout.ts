/**
 * useLogout Hook
 */

import { useLogoutMutation } from "../queries";

export function useLogout() {
  return useLogoutMutation();
}
