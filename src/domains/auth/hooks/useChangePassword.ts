/**
 * useChangePassword Hook
 */

import { useChangePasswordMutation } from "../queries";

export function useChangePassword() {
  return useChangePasswordMutation();
}
