const BYTES_PER_GB = 1024 ** 3;

/** Width percentage for the quota bar (0–100). */
export function driveQuotaPercent(
  used: string | null,
  total: string | null,
): number {
  if (used == null || total == null) return 0;
  try {
    const u = BigInt(used);
    const t = BigInt(total);
    if (t === 0n) return 0;
    const pct = Number((u * 100n) / t);
    return Math.min(100, Math.round(pct * 100) / 100);
  } catch {
    return 0;
  }
}

export function formatDriveQuotaUsageLine(
  used: string | null,
  total: string | null,
): string {
  if (used == null || total == null) return "—";
  const u = Number(used);
  const t = Number(total);
  if (!Number.isFinite(u) || !Number.isFinite(t)) return "—";
  const usedGb = (u / BYTES_PER_GB).toFixed(1);
  const totalGb = (t / BYTES_PER_GB).toFixed(1);
  return `${usedGb} / ${totalGb} GB used`;
}

/** When Google/org policies hide total quota; user sets cap in settings separately. */
export function formatDriveUsedOnlyLine(used: string | null): string {
  if (used == null || used === "") return "—";
  const u = Number(used);
  if (!Number.isFinite(u)) return "—";
  const usedGb = (u / BYTES_PER_GB).toFixed(1);
  return `${usedGb} GB used (set limit in Settings)`;
}
