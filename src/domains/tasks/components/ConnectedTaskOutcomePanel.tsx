import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { TaskOutcomePanel } from "./TaskOutcomePanel";
import {
  outcomeLinksQueryOptions,
  outcomeFilesQueryOptions,
  useAddOutcomeLinkMutation,
  useRemoveOutcomeLinkMutation,
  useUploadOutcomeFileMutation,
  useDeleteOutcomeFileMutation,
} from "../queries";
import type { AddOutcomeLinkInput } from "../types";

interface ConnectedTaskOutcomePanelProps {
  taskId: string;
  assigneeId?: string;
  currentUserId?: string;
  driveFolderId?: string;
}

export function ConnectedTaskOutcomePanel({
  taskId,
  assigneeId,
  currentUserId,
  driveFolderId,
}: ConnectedTaskOutcomePanelProps) {
  const { data: links = [], isLoading: isLoadingLinks } = useQuery(
    outcomeLinksQueryOptions(taskId),
  );
  const { data: files = [], isLoading: isLoadingFiles } = useQuery(
    outcomeFilesQueryOptions(taskId),
  );

  const { mutate: addLink } = useAddOutcomeLinkMutation();
  const { mutate: removeLink } = useRemoveOutcomeLinkMutation();
  const { mutate: uploadFile } = useUploadOutcomeFileMutation();
  const { mutate: deleteFile } = useDeleteOutcomeFileMutation();

  function handleAddLink(input: AddOutcomeLinkInput) {
    addLink(
      { taskId, input },
      { onError: (err) => toast.error(err.message) },
    );
  }

  function handleRemoveLink(linkId: string) {
    removeLink(
      { taskId, linkId },
      { onError: (err) => toast.error(err.message) },
    );
  }

  function handleUploadFile(file: File) {
    uploadFile(
      { taskId, file },
      { onError: (err) => toast.error(err.message) },
    );
  }

  function handleDeleteFile(fileId: string) {
    deleteFile(
      { taskId, fileId },
      { onError: (err) => toast.error(err.message) },
    );
  }

  return (
    <TaskOutcomePanel
      taskId={taskId}
      assigneeId={assigneeId}
      currentUserId={currentUserId}
      driveFolderId={driveFolderId}
      links={links}
      files={files}
      isLoadingLinks={isLoadingLinks}
      isLoadingFiles={isLoadingFiles}
      onAddLink={handleAddLink}
      onRemoveLink={handleRemoveLink}
      onUploadFile={handleUploadFile}
      onDeleteFile={handleDeleteFile}
    />
  );
}
