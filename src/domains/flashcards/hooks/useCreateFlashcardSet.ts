/**
 * useCreateFlashcardSet Hook
 */

import { useCreateFlashcardSetMutation } from "../queries";

export function useCreateFlashcardSet() {
  return useCreateFlashcardSetMutation();
}
