import { describe, it, expect } from "vitest";
import { formatDriveAssetModifiedSummary } from "./drive-asset-meta";

describe("formatDriveAssetModifiedSummary", () => {
  it("returns null when both inputs are empty", () => {
    expect(formatDriveAssetModifiedSummary(undefined, undefined)).toBeNull();
    expect(formatDriveAssetModifiedSummary("", "")).toBeNull();
  });

  it("joins UTC time and user with middle dot", () => {
    const s = formatDriveAssetModifiedSummary(
      "2026-05-01T12:00:00.000Z",
      "Alice Lee",
    );
    expect(s).toContain("Alice Lee");
    expect(s).toContain("·");
    expect(s).toMatch(/May 1, 2026/);
  });

  it("supports user-only when no valid date", () => {
    expect(formatDriveAssetModifiedSummary(undefined, "Only User")).toBe(
      "Only User",
    );
  });
});
