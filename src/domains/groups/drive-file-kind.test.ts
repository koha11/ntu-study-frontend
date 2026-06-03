import { describe, it, expect } from "vitest";
import { getDriveFileKindLabel } from "./drive-file-kind";

describe("getDriveFileKindLabel", () => {
  it("maps common MIME types to extension labels", () => {
    expect(
      getDriveFileKindLabel("application/pdf", "ignored.pdf"),
    ).toBe(".pdf");
    expect(
      getDriveFileKindLabel(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "x.docx",
      ),
    ).toBe(".docx");
    expect(
      getDriveFileKindLabel(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "s.xlsx",
      ),
    ).toBe(".xlsx");
    expect(getDriveFileKindLabel("image/png", "p.png")).toBe(".png");
    expect(getDriveFileKindLabel("video/mp4", "v.mp4")).toBe(".mp4");
  });

  it("labels Google Workspace native types", () => {
    expect(
      getDriveFileKindLabel("application/vnd.google-apps.document", "Untitled"),
    ).toBe("Google Doc");
    expect(
      getDriveFileKindLabel(
        "application/vnd.google-apps.spreadsheet",
        "Sheet",
      ),
    ).toBe("Google Sheet");
  });

  it("falls back to filename extension when MIME is unknown", () => {
    expect(getDriveFileKindLabel("application/octet-stream", "data.xyz")).toBe(
      ".xyz",
    );
  });

  it("returns MIME tail when no file extension and MIME unknown", () => {
    const result = getDriveFileKindLabel("application/octet-stream", "noextension");
    expect(result).toBe("octet-stream");
  });

  it("truncates long MIME tail to 16 chars with ellipsis", () => {
    const result = getDriveFileKindLabel("application/very-long-unknown-type-for-test", "file");
    expect(result).toMatch(/…$/);
    expect(result.length).toBeLessThanOrEqual(15);
  });

  it("uses filename extension when MIME is fully unknown", () => {
    expect(getDriveFileKindLabel("unknown/type", "archive.tar")).toBe(".tar");
  });

  it("returns MIME when filename has no extension and MIME has no slash", () => {
    const result = getDriveFileKindLabel("binarydata", "noext");
    expect(result).toBe("binarydata");
  });
});
