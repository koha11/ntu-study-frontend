import { useQuery } from "@tanstack/react-query";
import { canvaPreviewQueryOptions } from "../queries";

export function useCanvaPreview(groupId: string) {
  return useQuery(canvaPreviewQueryOptions(groupId));
}
