/**
 * useFlashcardsList Hook
 */

import { useQuery } from "@tanstack/react-query";
import { flashcardsListQueryOptions } from "../queries";

export function useFlashcardsList(filters?: { subject?: string; groupId?: string }) {
  return useQuery(flashcardsListQueryOptions(filters));
}
