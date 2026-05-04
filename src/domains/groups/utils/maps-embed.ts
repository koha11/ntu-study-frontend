/**
 * Derives a Google Maps embed URL from a standard Maps link (best-effort).
 */
export function toGoogleMapsEmbedSrc(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    if (!u.hostname.includes("google.")) {
      return null;
    }
    if (u.pathname.includes("/maps/embed")) {
      return trimmed;
    }
    const q = u.searchParams.get("q") ?? u.searchParams.get("query");
    if (q) {
      return `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
    }
    return `https://www.google.com/maps?output=embed&q=${encodeURIComponent(trimmed)}`;
  } catch {
    return null;
  }
}
