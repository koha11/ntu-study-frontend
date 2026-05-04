/**
 * useRegister Hook
 */

import { useRegisterMutation } from "../queries";

export function useRegister() {
  return useRegisterMutation();
}
