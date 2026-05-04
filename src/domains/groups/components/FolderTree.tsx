"use client";

import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Eye,
  File,
  Folder,
  FolderOpen,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DriveAsset } from "../drive-api";
import { formatDriveAssetModifiedSummary } from "../drive-asset-meta";
import { getDriveFileKindLabel } from "../drive-file-kind";

function DriveAssetMetaSummary({
  assetId,
  modifiedTime,
  lastModifiedBy,
  className,
}: {
  assetId: string;
  modifiedTime?: string;
  lastModifiedBy?: string;
  className?: string;
}) {
  const summary = formatDriveAssetModifiedSummary(modifiedTime, lastModifiedBy);
  if (summary == null) {
    return null;
  }
  return (
    <div
      className={cn(
        "text-xs leading-snug text-muted-foreground",
        className,
      )}
      data-testid={`drive-asset-meta-${assetId}`}
    >
      {summary}
    </div>
  );
}

export interface FolderTreeProps {
  items: DriveAsset[];
  onExpandFolder: (folderId: string) => void;
  childrenMap: Record<string, DriveAsset[]>;
  loadingFolderIds: Set<string>;
  depth?: number;
  selectedFolderId?: string | null;
  onFolderSelect?: (folderId: string, folderName: string) => void;
  onPreviewFile?: (item: DriveAsset) => void;
}

export function FolderTree({
  items,
  onExpandFolder,
  childrenMap,
  loadingFolderIds,
  depth = 0,
  selectedFolderId,
  onFolderSelect,
  onPreviewFile,
}: FolderTreeProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <ul
      className={cn("space-y-0.5", depth > 0 && "mt-1 border-l border-border pl-3")}
      role="list"
    >
      {items.map((item) =>
        item.type === "folder" ? (
          <FolderRow
            key={item.id}
            item={item}
            depth={depth}
            onExpandFolder={onExpandFolder}
            childrenMap={childrenMap}
            loadingFolderIds={loadingFolderIds}
            selectedFolderId={selectedFolderId}
            onFolderSelect={onFolderSelect}
            onPreviewFile={onPreviewFile}
          />
        ) : (
          <FileRow
            key={item.id}
            item={item}
            depth={depth}
            onPreviewFile={onPreviewFile}
          />
        ),
      )}
    </ul>
  );
}

function FileRow({
  item,
  depth,
  onPreviewFile,
}: {
  item: DriveAsset;
  depth: number;
  onPreviewFile?: (item: DriveAsset) => void;
}) {
  const label = getDriveFileKindLabel(item.mimeType, item.name);

  return (
    <li
      className={cn(
        "flex items-start gap-2 rounded-md py-1 pr-2 text-sm",
        depth > 0 && "pl-1",
      )}
    >
      <File
        className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="min-w-0 flex-1 truncate">{item.name}</span>
          <Badge variant="outline" className="shrink-0 font-normal tabular-nums">
            {label}
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 gap-1 px-2 text-xs"
            onClick={() => onPreviewFile?.(item)}
            data-testid={`drive-preview-trigger-${item.id}`}
          >
            <Eye className="h-3.5 w-3.5" aria-hidden />
            Preview
          </Button>
          {item.webViewLink ? (
            <a
              href={item.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 text-muted-foreground hover:text-primary"
              aria-label={`Open ${item.name} in Drive`}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
        </div>
        <DriveAssetMetaSummary
          assetId={item.id}
          modifiedTime={item.modifiedTime}
          lastModifiedBy={item.lastModifiedBy}
        />
      </div>
    </li>
  );
}

function FolderRow({
  item,
  depth,
  onExpandFolder,
  childrenMap,
  loadingFolderIds,
  selectedFolderId,
  onFolderSelect,
  onPreviewFile,
}: {
  item: DriveAsset;
  depth: number;
  onExpandFolder: (folderId: string) => void;
  childrenMap: Record<string, DriveAsset[]>;
  loadingFolderIds: Set<string>;
  selectedFolderId?: string | null;
  onFolderSelect?: (folderId: string, folderName: string) => void;
  onPreviewFile?: (item: DriveAsset) => void;
}) {
  const childItems = childrenMap[item.id] ?? [];
  const loading = loadingFolderIds.has(item.id);
  const selected =
    selectedFolderId != null &&
    selectedFolderId !== "" &&
    item.id === selectedFolderId;

  return (
    <li className={cn(depth > 0 && "pl-1")}>
      <Collapsible
        className="group"
        onOpenChange={(open) => {
          if (open) {
            onExpandFolder(item.id);
          }
        }}
      >
        <div
          className={cn(
            "flex w-full flex-col gap-0.5 rounded-md py-1 pr-2 text-sm",
            depth > 0 && "pl-1",
          )}
        >
          <div className="flex w-full items-center gap-1">
            <CollapsibleTrigger
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted/60 focus-visible:ring-1 focus-visible:ring-ring",
              )}
              aria-label={`Expand folder ${item.name}`}
            >
              <ChevronRight className="h-3.5 w-3.5 group-data-[state=open]:hidden" />
              <ChevronDown className="hidden h-3.5 w-3.5 group-data-[state=open]:block" />
            </CollapsibleTrigger>
            <button
              type="button"
              data-testid={`drive-folder-select-${item.id}`}
              data-selected={selected ? "true" : "false"}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-2 rounded-md py-0.5 pr-2 text-left text-sm outline-none hover:bg-muted/60 focus-visible:ring-1 focus-visible:ring-ring",
                selected && "bg-muted/80 ring-1 ring-border",
              )}
              onClick={() => onFolderSelect?.(item.id, item.name)}
            >
              <Folder className="h-4 w-4 shrink-0 text-muted-foreground group-data-[state=open]:hidden" />
              <FolderOpen className="hidden h-4 w-4 shrink-0 text-muted-foreground group-data-[state=open]:block" />
              <span className="min-w-0 flex-1 truncate font-medium">{item.name}</span>
            </button>
            {item.webViewLink ? (
              <a
                href={item.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 text-muted-foreground hover:text-primary"
                aria-label={`Open ${item.name} folder in Drive`}
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </div>
          <DriveAssetMetaSummary
            className="pl-9"
            assetId={item.id}
            modifiedTime={item.modifiedTime}
            lastModifiedBy={item.lastModifiedBy}
          />
        </div>
        <CollapsibleContent>
          {loading ? (
            <div
              className="py-2 pl-9 text-xs text-muted-foreground"
              data-testid="drive-folder-loading"
            >
              Loading…
            </div>
          ) : childItems.length > 0 ? (
            <FolderTree
              items={childItems}
              onExpandFolder={onExpandFolder}
              childrenMap={childrenMap}
              loadingFolderIds={loadingFolderIds}
              depth={depth + 1}
              selectedFolderId={selectedFolderId}
              onFolderSelect={onFolderSelect}
              onPreviewFile={onPreviewFile}
            />
          ) : (
            <p className="py-1 pl-9 text-xs text-muted-foreground">Empty folder</p>
          )}
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}
