"use client";

import * as React from "react";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ExternalLink, Folder, FolderPlus, Upload } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { getAccessToken } from "@/domains/auth/token-storage";
import {
  createGroupFolder,
  fetchGroupAssets,
  uploadToGroupFolder,
  type DriveAsset,
} from "../drive-api";
import { FolderTree } from "./FolderTree";
import { DriveActivityPanel } from "./DriveActivityPanel";
import { DriveFilePreviewDialog } from "./DriveFilePreviewDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface DriveTabProps {
  groupId: string;
  /** When missing, Drive assets are not fetched and a "no folder" message is shown. */
  driveFolderId?: string | null;
  groupLocked?: boolean;
}

function readAccessToken(): string | null {
  return getAccessToken();
}

/** Folders discovered from the loaded tree (root + expanded subtrees). */
function collectFolderOptions(
  rootFolderId: string,
  rootItems: DriveAsset[] | undefined,
  childrenMap: Record<string, DriveAsset[]>,
  rootLabel: string,
): { id: string; label: string }[] {
  const options: { id: string; label: string }[] = [
    { id: rootFolderId, label: rootLabel },
  ];
  const seen = new Set<string>([rootFolderId]);

  function walk(nodes: DriveAsset[] | undefined, pathPrefix: string) {
    if (!nodes) return;
    for (const node of nodes) {
      if (node.type !== "folder") continue;
      const label = pathPrefix ? `${pathPrefix} / ${node.name}` : node.name;
      if (!seen.has(node.id)) {
        seen.add(node.id);
        options.push({ id: node.id, label });
      }
      walk(childrenMap[node.id], label);
    }
  }

  walk(rootItems, "");
  return options;
}

export function DriveTab({ groupId, driveFolderId, groupLocked = false }: DriveTabProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const hasFolder = Boolean(driveFolderId?.trim());
  const rootFolderId = driveFolderId?.trim() ?? "";
  const driveFolderUrl =
    driveFolderId?.trim() &&
    `https://drive.google.com/drive/folders/${driveFolderId.trim()}`;

  const [expandedFolders, setExpandedFolders] = React.useState<string[]>([]);
  const [selectedFolderId, setSelectedFolderId] = React.useState<string | null>(
    null,
  );
  const [selectedFolderName, setSelectedFolderName] = React.useState("");
  const [previewAsset, setPreviewAsset] = React.useState<DriveAsset | null>(
    null,
  );
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [newFolderOpen, setNewFolderOpen] = React.useState(false);
  const [newFolderName, setNewFolderName] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (rootFolderId) {
      setSelectedFolderId(rootFolderId);
      setSelectedFolderName(t("groups.drive.groupFolder"));
    }
  }, [rootFolderId, t]);

  const token = readAccessToken();
  const canQuery = Boolean(groupId && hasFolder && token);

  const rootQuery = useQuery({
    queryKey: ["drive-assets", groupId, "root"],
    queryFn: () => fetchGroupAssets(groupId, token!),
    enabled: canQuery,
  });

  const folderQueries = useQueries({
    queries: expandedFolders.map((folderId) => ({
      queryKey: ["drive-assets", groupId, folderId],
      queryFn: () => fetchGroupAssets(groupId, token!, folderId),
      enabled: canQuery,
    })),
  });

  const childrenMap = React.useMemo(() => {
    const map: Record<string, DriveAsset[]> = {};
    expandedFolders.forEach((folderId, i) => {
      const data = folderQueries[i]?.data;
      if (data) {
        map[folderId] = data;
      }
    });
    return map;
  }, [expandedFolders, folderQueries]);

  const loadingFolderIds = React.useMemo(() => {
    const s = new Set<string>();
    expandedFolders.forEach((folderId, i) => {
      if (folderQueries[i]?.isFetching) {
        s.add(folderId);
      }
    });
    return s;
  }, [expandedFolders, folderQueries]);

  const folderOptions = React.useMemo(
    () => collectFolderOptions(rootFolderId, rootQuery.data, childrenMap, t("groups.drive.groupFolder")),
    [rootFolderId, rootQuery.data, childrenMap, t],
  );

  const folderSelectOptions = React.useMemo(() => {
    if (
      selectedFolderId &&
      !folderOptions.some((o) => o.id === selectedFolderId)
    ) {
      return [
        ...folderOptions,
        {
          id: selectedFolderId,
          label: selectedFolderName.trim() || selectedFolderId,
        },
      ];
    }
    return folderOptions;
  }, [folderOptions, selectedFolderId, selectedFolderName]);

  const onExpandFolder = React.useCallback((folderId: string) => {
    setExpandedFolders((prev) =>
      prev.includes(folderId) ? prev : [...prev, folderId],
    );
  }, []);

  const invalidateDriveQueries = React.useCallback(() => {
    queryClient.invalidateQueries({
      predicate: (q) =>
        Array.isArray(q.queryKey) &&
        q.queryKey[0] === "drive-assets" &&
        q.queryKey[1] === groupId,
    });
    queryClient.invalidateQueries({ queryKey: ["drive-activity", groupId] });
  }, [queryClient, groupId]);

  const createFolderMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("Missing token");
      const name = newFolderName.trim();
      if (!name) throw new Error("Name required");
      return createGroupFolder(groupId, token, {
        name,
        parentFolderId: selectedFolderId ?? undefined,
      });
    },
    onSuccess: () => {
      toast.success(t("groups.drive.folderCreated"));
      setNewFolderOpen(false);
      setNewFolderName("");
      invalidateDriveQueries();
    },
    onError: () => {
      toast.error(t("groups.drive.folderCreateError"));
    },
  });

  const handleFolderSelect = React.useCallback(
    (folderId: string, folderName: string) => {
      setSelectedFolderId(folderId);
      setSelectedFolderName(folderName);
    },
    [],
  );

  const handleFolderDropdownChange = React.useCallback(
    (value: string) => {
      const opt = folderSelectOptions.find((o) => o.id === value);
      setSelectedFolderId(value);
      setSelectedFolderName(
        opt?.label ?? (value === rootFolderId ? t("groups.drive.groupFolder") : value),
      );
    },
    [folderSelectOptions, rootFolderId, t],
  );

  const handlePreviewFile = React.useCallback((item: DriveAsset) => {
    setPreviewAsset(item);
    setPreviewOpen(true);
  }, []);

  const handleUploadInputChange = React.useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files?.length || !token) return;
      try {
        let n = 0;
        for (const file of Array.from(files)) {
          await uploadToGroupFolder(
            groupId,
            token,
            file,
            selectedFolderId ?? undefined,
          );
          n += 1;
        }
        toast.success(n === 1 ? t("groups.drive.uploadComplete") : t("groups.drive.uploadedN", { count: n }));
        invalidateDriveQueries();
      } catch {
        toast.error(t("groups.drive.uploadError"));
      } finally {
        e.target.value = "";
      }
    },
    [groupId, token, selectedFolderId, invalidateDriveQueries, t],
  );

  if (!hasFolder) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start gap-3">
          <Folder className="mt-0.5 h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="font-semibold">{t("groups.drive.title")}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("groups.drive.desc")}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{t("groups.drive.noFolder")}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start gap-3">
          <Folder className="mt-0.5 h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="font-semibold">{t("groups.drive.title")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t("groups.drive.signInAgain")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start gap-3">
        <Folder className="mt-0.5 h-5 w-5 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">{t("groups.drive.title")}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("groups.drive.desc")}
          </p>
          {driveFolderUrl ? (
            <a
              href={driveFolderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              {t("groups.drive.openInDrive")} <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}

          <div className="mt-4 grid grid-cols-1 gap-6 border-t border-border pt-4 lg:grid-cols-10 lg:gap-6">
            <div className="min-w-0 lg:col-span-6">
            <div className="mb-4 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div
                className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3"
                data-testid="drive-upload-target"
              >
                <span className="shrink-0 text-xs text-muted-foreground">
                  {t("groups.drive.uploadIn")}
                </span>
                <Select
                  value={selectedFolderId ?? rootFolderId}
                  onValueChange={handleFolderDropdownChange}
                  disabled={groupLocked}
                >
                  <SelectTrigger
                    data-testid="drive-folder-dropdown"
                    className="h-9 w-full max-w-md"
                    aria-label={t("groups.drive.folderForUpload")}
                  >
                    <SelectValue placeholder={t("groups.drive.selectFolder")} />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {folderSelectOptions.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="gap-1"
                  data-testid="drive-new-folder-trigger"
                  disabled={groupLocked}
                  onClick={() => setNewFolderOpen(true)}
                >
                  <FolderPlus className="h-4 w-4" aria-hidden />
                  {t("groups.drive.newFolder")}
                </Button>
                <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t("groups.drive.newFolder")}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-2 py-2">
                      <Label htmlFor="drive-new-folder-name">{t("groups.drive.newFolderName")}</Label>
                      <Input
                        id="drive-new-folder-name"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder={t("groups.drive.newFolderPlaceholder")}
                        data-testid="drive-new-folder-name"
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setNewFolderOpen(false)}
                      >
                        {t("groups.drive.cancel")}
                      </Button>
                      <Button
                        type="button"
                        data-testid="drive-new-folder-submit"
                        disabled={
                          createFolderMutation.isPending ||
                          !newFolderName.trim()
                        }
                        onClick={() => createFolderMutation.mutate()}
                      >
                        {t("groups.drive.create")}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="gap-1"
                  data-testid="drive-upload-trigger"
                  disabled={rootQuery.isPending || groupLocked}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" aria-hidden />
                  {t("groups.drive.upload")}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  data-testid="drive-upload-input"
                  onChange={handleUploadInputChange}
                />
              </div>
            </div>

            {groupLocked && (
              <p className="mb-3 text-xs text-muted-foreground">{t("groups.drive.lockedHint")}</p>
            )}
            {rootQuery.isPending ? (
              <p className="text-sm text-muted-foreground" data-testid="drive-tab-loading">
                {t("groups.drive.loading")}
              </p>
            ) : rootQuery.isError ? (
              <p className="text-sm text-destructive" data-testid="drive-tab-error">
                {t("groups.drive.couldNotLoad")}
              </p>
            ) : (rootQuery.data?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground" data-testid="drive-tab-empty">
                {t("groups.drive.empty")}
              </p>
            ) : (
              <FolderTree
                items={rootQuery.data ?? []}
                onExpandFolder={onExpandFolder}
                childrenMap={childrenMap}
                loadingFolderIds={loadingFolderIds}
                selectedFolderId={selectedFolderId}
                onFolderSelect={handleFolderSelect}
                onPreviewFile={handlePreviewFile}
              />
            )}
            </div>

            <div className="min-w-0 lg:col-span-4">
              <DriveActivityPanel groupId={groupId} accessToken={token} />
            </div>
          </div>
        </div>
      </div>

      <DriveFilePreviewDialog
        open={previewOpen}
        onOpenChange={(open) => {
          setPreviewOpen(open);
          if (!open) {
            setPreviewAsset(null);
          }
        }}
        asset={previewAsset}
        groupId={groupId}
        accessToken={token}
      />
    </div>
  );
}
