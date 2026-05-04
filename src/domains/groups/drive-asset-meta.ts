/**
 * Drive listing metadata shown in the folder tree (times in UTC for consistency).
 */
export function formatDriveAssetModifiedSummary(
  modifiedTime?: string,
  lastModifiedBy?: string,
): string | null {
  const parts: string[] = [];
  const iso = modifiedTime?.trim();
  if (iso) {
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) {
      parts.push(
        new Intl.DateTimeFormat("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "UTC",
        }).format(d),
      );
    }
  }
  const who = lastModifiedBy?.trim();
  if (who) {
    parts.push(who);
  }
  if (parts.length === 0) {
    return null;
  }
  return parts.join(" · ");
}
