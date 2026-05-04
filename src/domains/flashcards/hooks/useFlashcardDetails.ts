/**
 * useFlashcardDetails Hook
 */

import { useQuery } from "@tanstack/react-query";
import { flashcardDetailQueryOptions } from "../queries";

export function useFlashcardDetails(id: string) {
  return useQuery(flashcardDetailQueryOptions(id));
}
