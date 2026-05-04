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
});
