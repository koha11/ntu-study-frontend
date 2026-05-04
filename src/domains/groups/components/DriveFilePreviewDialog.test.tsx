import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import { DriveFilePreviewDialog } from "./DriveFilePreviewDialog";
import { fetchGroupDriveFileBlob } from "../drive-api";

vi.mock("../drive-api", () => ({
  fetchGroupDriveFileBlob: vi.fn(),
}));

const mockedBlob = vi.mocked(fetchGroupDriveFileBlob);

describe("DriveFilePreviewDialog", () => {
  beforeEach(() => {
    mockedBlob.mockReset();
  });

  it("shows PDF iframe when content is application/pdf", async () => {
    mockedBlob.mockResolvedValue({
      blob: new Blob(["%PDF-1.4"], { type: "application/pdf" }),
      contentType: "application/pdf",
    });

    render(
      <DriveFilePreviewDialog
        open
        onOpenChange={() => {}}
        asset={{
          id: "f1",
          name: "Doc.pdf",
          type: "file",
          mimeType: "application/pdf",
        }}
        groupId="g1"
        accessToken="tok"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("drive-preview-pdf")).toBeInTheDocument();
    });
  });

  it("shows unsupported message for plain text files", async () => {
    mockedBlob.mockResolvedValue({
      blob: new Blob(["hello"], { type: "text/plain" }),
      contentType: "text/plain; charset=utf-8",
    });

    render(
      <DriveFilePreviewDialog
        open
        onOpenChange={() => {}}
        asset={{
          id: "f1",
          name: "notes.txt",
          type: "file",
          mimeType: "text/plain",
        }}
        groupId="g1"
        accessToken="tok"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("drive-preview-unsupported")).toBeInTheDocument();
    });
  });
});
