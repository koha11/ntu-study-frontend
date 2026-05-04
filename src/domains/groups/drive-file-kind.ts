/**
 * Short label for Drive rows (extension-style or Google product name).
 */
export function getDriveFileKindLabel(mimeType: string, fileName: string): string {
  const mt = mimeType.trim().toLowerCase();

  const google: Record<string, string> = {
    "application/vnd.google-apps.document": "Google Doc",
    "application/vnd.google-apps.spreadsheet": "Google Sheet",
    "application/vnd.google-apps.presentation": "Google Slides",
    "application/vnd.google-apps.form": "Google Form",
    "application/vnd.google-apps.drawing": "Google Drawing",
    "application/vnd.google-apps.folder": "Folder",
  };
  if (google[mt]) {
    return google[mt];
  }

  const extFromMime: Record<string, string> = {
    "application/pdf": ".pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      ".docx",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      ".xlsx",
    "application/vnd.ms-excel": ".xls",
    "text/plain": ".txt",
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
  };

  if (extFromMime[mt]) {
    return extFromMime[mt];
  }

  const dot = fileName.lastIndexOf(".");
  if (dot >= 0 && dot < fileName.length - 1) {
    const ext = fileName.slice(dot + 1).toLowerCase();
    if (/^[a-z0-9]{1,8}$/i.test(ext)) {
      return `.${ext}`;
    }
  }

  const tail = mt.includes("/") ? (mt.split("/").pop() ?? "file") : mt;
  return tail.length > 16 ? `${tail.slice(0, 14)}…` : tail;
}
