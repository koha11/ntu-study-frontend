/**
 * useDeleteFlashcardSet Hook
 */

import { useDeleteFlashcardSetMutation } from "../queries";

export function useDeleteFlashcardSet() {
  return useDeleteFlashcardSetMutation();
}
