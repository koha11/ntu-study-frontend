import { useQuery } from "@tanstack/react-query";
import { evaluationRoundsQueryOptions } from "../queries";

export function useGroupEvaluationRounds(groupId: string) {
  return useQuery({
    ...evaluationRoundsQueryOptions(groupId),
    enabled: Boolean(groupId),
  });
}
