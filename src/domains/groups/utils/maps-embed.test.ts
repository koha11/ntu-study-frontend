import { describe, it, expect } from "vitest";
import { toGoogleMapsEmbedSrc } from "./maps-embed";

describe("toGoogleMapsEmbedSrc", () => {
  it("returns null for empty string", () => {
    expect(toGoogleMapsEmbedSrc("")).toBeNull();
  });

  it("returns null for whitespace-only string", () => {
    expect(toGoogleMapsEmbedSrc("   ")).toBeNull();
  });

  it("returns null for non-Google URLs", () => {
    expect(toGoogleMapsEmbedSrc("https://www.openstreetmap.org")).toBeNull();
  });

  it("returns null for invalid URLs", () => {
    expect(toGoogleMapsEmbedSrc("not-a-url")).toBeNull();
  });

  it("returns the URL unchanged when it already has /maps/embed", () => {
    const embedUrl = "https://www.google.com/maps/embed?pb=!1m18!...";
    expect(toGoogleMapsEmbedSrc(embedUrl)).toBe(embedUrl);
  });

  it("converts a Google Maps URL with 'q' param to embed URL", () => {
    const src = "https://www.google.com/maps?q=Hanoi+Vietnam";
    const result = toGoogleMapsEmbedSrc(src);
    // URLSearchParams decodes '+' as space, so encodeURIComponent gives %20
    expect(result).toBe(
      "https://www.google.com/maps?q=Hanoi%20Vietnam&output=embed",
    );
  });

  it("converts a Google Maps URL with 'query' param to embed URL", () => {
    const src = "https://www.google.com/maps?query=Tokyo";
    const result = toGoogleMapsEmbedSrc(src);
    expect(result).toBe(
      "https://www.google.com/maps?q=Tokyo&output=embed",
    );
  });

  it("falls back to encoding the full URL when no q/query param", () => {
    const src = "https://maps.google.com/some/path";
    const result = toGoogleMapsEmbedSrc(src);
    expect(result).toContain("output=embed");
    expect(result).toContain(encodeURIComponent(src));
  });

  it("handles google.com.vn domains", () => {
    const src = "https://www.google.com.vn/maps?q=Ho+Chi+Minh";
    const result = toGoogleMapsEmbedSrc(src);
    expect(result).not.toBeNull();
    expect(result).toContain("output=embed");
  });
});
