import { HttpError, normalizeApiBase } from "@/domains/auth/auth-api";

export type DriveAssetType = "file" | "folder";

export interface DriveAsset {
  id: string;
  name: string;
  type: DriveAssetType;
  mimeType: string;
  webViewLink?: string;
  /** ISO 8601 from Google Drive `modifiedTime` */
  modifiedTime?: string;
  /** Display name (or email) of last modifier */
  lastModifiedBy?: string;
}

function getApiBase(): string {
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  if (!apiBase?.trim()) {
    throw new Error("VITE_API_BASE_URL is not set");
  }
  return normalizeApiBase(apiBase);
}

function bearerHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

async function handleJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new HttpError(res.status, text || res.statusText);
  }
  return res.json() as Promise<T>;
}

/**
 * List Drive assets for a group's linked folder (or a subfolder when folderId is set).
 */
export async function fetchGroupAssets(
  groupId: string,
  token: string,
  folderId?: string,
): Promise<DriveAsset[]> {
  const base = `${getApiBase()}/drive/groups/${groupId}/assets`;
  const url =
    folderId != null && folderId !== ""
      ? `${base}?${new URLSearchParams({ folderId }).toString()}`
      : base;

  const res = await fetch(url, {
    method: "GET",
    headers: bearerHeaders(token),
  });
  return handleJson<DriveAsset[]>(res);
}

export interface DriveFolderMutationResult {
  id: string;
  name: string;
  webViewLink?: string;
}

/** Mirrors backend Drive Activity rows for the group folder tree. */
export interface DriveActivityEntry {
  occurredAt: string;
  actorLabel: string;
  actorDisplayName?: string;
  actorPhotoUrl?: string;
  fileName: string;
  fileId?: string;
  action: string;
}

export interface GroupDriveActivityResponse {
  items: DriveActivityEntry[];
  nextPageToken?: string;
}

/**
 * List Drive Activity for the group's linked folder and descendants.
 */
export async function fetchGroupDriveActivity(
  groupId: string,
  token: string,
  options?: { pageToken?: string; pageSize?: number },
): Promise<GroupDriveActivityResponse> {
  const params = new URLSearchParams();
  if (options?.pageToken != null && options.pageToken !== "") {
    params.set("pageToken", options.pageToken);
  }
  if (options?.pageSize != null) {
    params.set("pageSize", String(options.pageSize));
  }
  const qs = params.toString();
  const url = `${getApiBase()}/drive/groups/${groupId}/activity${qs ? `?${qs}` : ""}`;

  const res = await fetch(url, {
    method: "GET",
    headers: bearerHeaders(token),
  });
  return handleJson<GroupDriveActivityResponse>(res);
}

/**
 * Create a folder inside the group's Drive tree (defaults to group root).
 */
export async function createGroupFolder(
  groupId: string,
  token: string,
  body: { name: string; parentFolderId?: string },
): Promise<DriveFolderMutationResult> {
  const url = `${getApiBase()}/drive/groups/${groupId}/folders`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...bearerHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return handleJson<DriveFolderMutationResult>(res);
}

/**
 * Upload a file into a folder (defaults to group root).
 */
export async function uploadToGroupFolder(
  groupId: string,
  token: string,
  file: File,
  parentFolderId?: string,
): Promise<DriveFolderMutationResult> {
  const url = `${getApiBase()}/drive/groups/${groupId}/uploads`;
  const form = new FormData();
  form.append("file", file);
  if (parentFolderId != null && parentFolderId !== "") {
    form.append("parentFolderId", parentFolderId);
  }
  const res = await fetch(url, {
    method: "POST",
    headers: bearerHeaders(token),
    body: form,
  });
  return handleJson<DriveFolderMutationResult>(res);
}

/**
 * Download bytes for in-app preview (Google Workspace types are exported server-side).
 */
export async function fetchGroupDriveFileBlob(
  groupId: string,
  token: string,
  fileId: string,
): Promise<{ blob: Blob; contentType: string | null }> {
  const url = `${getApiBase()}/drive/groups/${groupId}/files/${encodeURIComponent(fileId)}/content`;
  const res = await fetch(url, {
    method: "GET",
    headers: bearerHeaders(token),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new HttpError(res.status, text || res.statusText);
  }
  const blob = await res.blob();
  return { blob, contentType: res.headers.get("Content-Type") };
}
