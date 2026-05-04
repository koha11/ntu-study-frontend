/**
 * useLogin Hook
 */

import { useLoginMutation } from "../queries";

export function useLogin() {
  return useLoginMutation();
}
