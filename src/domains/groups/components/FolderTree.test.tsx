import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { FolderTree } from "./FolderTree";
import type { DriveAsset } from "../drive-api";

const pdf: DriveAsset = {
  id: "f1",
  name: "notes.pdf",
  type: "file",
  mimeType: "application/pdf",
  webViewLink: "https://drive.google.com/file/d/f1/view",
};

const pdfWithMeta: DriveAsset = {
  ...pdf,
  modifiedTime: "2026-05-01T12:00:00.000Z",
  lastModifiedBy: "Alice Lee",
};

const folder: DriveAsset = {
  id: "d1",
  name: "Docs",
  type: "folder",
  mimeType: "application/vnd.google-apps.folder",
};

const folderWithMeta: DriveAsset = {
  ...folder,
  modifiedTime: "2026-04-15T08:30:00.000Z",
  lastModifiedBy: "Bob Chen",
};

describe("FolderTree", () => {
  it("renders folder and file names", () => {
    render(
      <FolderTree
        items={[folder, pdf]}
        onExpandFolder={vi.fn()}
        childrenMap={{}}
        loadingFolderIds={new Set()}
      />,
    );

    expect(screen.getByText("Docs")).toBeInTheDocument();
    expect(screen.getByText("notes.pdf")).toBeInTheDocument();
  });

  it("calls onExpandFolder when folder row is expanded", () => {
    const onExpandFolder = vi.fn();
    render(
      <FolderTree
        items={[folder]}
        onExpandFolder={onExpandFolder}
        childrenMap={{}}
        loadingFolderIds={new Set()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Expand folder Docs/i }),
    );

    expect(onExpandFolder).toHaveBeenCalledTimes(1);
    expect(onExpandFolder).toHaveBeenCalledWith("d1");
  });

  it("renders nested files when childrenMap has entries", () => {
    render(
      <FolderTree
        items={[folder]}
        onExpandFolder={vi.fn()}
        childrenMap={{ d1: [pdf] }}
        loadingFolderIds={new Set()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Expand folder Docs/i }),
    );

    expect(screen.getByText("notes.pdf")).toBeInTheDocument();
  });

  it("shows loading state inside expanded folder when loadingFolderIds includes folder", () => {
    const { rerender } = render(
      <FolderTree
        items={[folder]}
        onExpandFolder={vi.fn()}
        childrenMap={{}}
        loadingFolderIds={new Set()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Expand folder Docs/i }),
    );

    rerender(
      <FolderTree
        items={[folder]}
        onExpandFolder={vi.fn()}
        childrenMap={{}}
        loadingFolderIds={new Set(["d1"])}
      />,
    );

    expect(screen.getByTestId("drive-folder-loading")).toBeInTheDocument();
  });

  it("shows last modified time and user on files when provided", () => {
    render(
      <FolderTree
        items={[pdfWithMeta]}
        onExpandFolder={vi.fn()}
        childrenMap={{}}
        loadingFolderIds={new Set()}
      />,
    );

    const meta = screen.getByTestId("drive-asset-meta-f1");
    expect(meta).toHaveTextContent("Alice Lee");
    expect(meta.textContent).toMatch(/May 1, 2026/);
    expect(meta.textContent).toMatch(/·/);
  });

  it("shows last modified time and user on folders when provided", () => {
    render(
      <FolderTree
        items={[folderWithMeta]}
        onExpandFolder={vi.fn()}
        childrenMap={{}}
        loadingFolderIds={new Set()}
      />,
    );

    const meta = screen.getByTestId("drive-asset-meta-d1");
    expect(meta).toHaveTextContent("Bob Chen");
    expect(meta.textContent).toMatch(/Apr 15, 2026/);
  });

  it("does not render a meta row when neither time nor user is set", () => {
    render(
      <FolderTree
        items={[pdf]}
        onExpandFolder={vi.fn()}
        childrenMap={{}}
        loadingFolderIds={new Set()}
      />,
    );

    expect(screen.queryByTestId("drive-asset-meta-f1")).not.toBeInTheDocument();
  });
});
