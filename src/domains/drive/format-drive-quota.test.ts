import { describe, it, expect } from "vitest";
import {
  driveQuotaPercent,
  formatDriveQuotaUsageLine,
  formatDriveUsedOnlyLine,
} from "./format-drive-quota";

describe("format-drive-quota", () => {
  describe("driveQuotaPercent", () => {
    it("returns 0 when inputs are null", () => {
      expect(driveQuotaPercent(null, null)).toBe(0);
      expect(driveQuotaPercent("1", null)).toBe(0);
    });

    it("returns capped percentage from byte strings", () => {
      expect(driveQuotaPercent("500", "1000")).toBe(50);
      expect(driveQuotaPercent("1000", "1000")).toBe(100);
    });

    it("caps at 100 when usage exceeds total", () => {
      expect(driveQuotaPercent("2000", "1000")).toBe(100);
    });
  });

  describe("formatDriveQuotaUsageLine", () => {
    it("returns em dash when data is missing", () => {
      expect(formatDriveQuotaUsageLine(null, null)).toBe("—");
    });

    it("formats GB with one decimal", () => {
      const gb = 1024 ** 3;
      const used = Math.round(12.4 * gb);
      const total = 16 * gb;
      expect(formatDriveQuotaUsageLine(String(used), String(total))).toBe(
        "12.4 / 16.0 GB used",
      );
    });
  });

  describe("formatDriveUsedOnlyLine", () => {
    it("formats used GB with settings hint", () => {
      const gb = 1024 ** 3;
      const used = Math.round(5 * gb);
      expect(formatDriveUsedOnlyLine(String(used))).toBe(
        "5.0 GB used (set limit in Settings)",
      );
    });
  });
});
