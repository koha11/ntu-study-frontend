import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@/test/test-utils";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DriveTab } from "./DriveTab";
import {
  createGroupFolder,
  fetchGroupAssets,
  fetchGroupDriveActivity,
  uploadToGroupFolder,
} from "../drive-api";
import { HttpError } from "@/domains/auth/auth-api";

vi.mock("../drive-api", () => ({
  fetchGroupAssets: vi.fn(),
  fetchGroupDriveActivity: vi.fn(),
  createGroupFolder: vi.fn(),
  uploadToGroupFolder: vi.fn(),
  fetchGroupDriveFileBlob: vi.fn(),
}));

const mockedFetch = vi.mocked(fetchGroupAssets);
const mockedActivity = vi.mocked(fetchGroupDriveActivity);
const mockedCreateFolder = vi.mocked(createGroupFolder);
const mockedUpload = vi.mocked(uploadToGroupFolder);

function renderDriveTab(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("DriveTab", () => {
  beforeEach(() => {
    mockedFetch.mockReset();
    mockedActivity.mockReset();
    mockedActivity.mockResolvedValue({ items: [] });
    mockedCreateFolder.mockReset();
    mockedUpload.mockReset();
    vi.mocked(localStorage.getItem).mockReturnValue("test-jwt");
  });

  it("shows no folder message when driveFolderId is missing", () => {
    renderDriveTab(<DriveTab groupId="g1" driveFolderId={null} />);

    expect(screen.getByText(/No folder linked yet/i)).toBeInTheDocument();
    expect(mockedFetch).not.toHaveBeenCalled();
  });

  it("shows loading then tree when root fetch succeeds", async () => {
    mockedFetch.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve([
                {
                  id: "d1",
                  name: "Docs",
                  type: "folder",
                  mimeType: "application/vnd.google-apps.folder",
                },
                {
                  id: "f1",
                  name: "notes.txt",
                  type: "file",
                  mimeType: "text/plain",
                },
              ]),
            20,
          ),
        ),
    );

    renderDriveTab(<DriveTab groupId="g1" driveFolderId="root-id" />);

    expect(screen.getByTestId("drive-tab-loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Docs")).toBeInTheDocument();
    });
    expect(screen.getByText("notes.txt")).toBeInTheDocument();
    expect(screen.getByText(".txt")).toBeInTheDocument();
    expect(mockedFetch).toHaveBeenCalledWith("g1", "test-jwt");
    expect(mockedActivity).toHaveBeenCalledWith("g1", "test-jwt", {
      pageToken: undefined,
      pageSize: 25,
    });
  });

  it("shows upload target label for group folder by default", async () => {
    mockedFetch.mockResolvedValue([
      {
        id: "d1",
        name: "Docs",
        type: "folder",
        mimeType: "application/vnd.google-apps.folder",
      },
    ]);

    renderDriveTab(<DriveTab groupId="g1" driveFolderId="root-id" />);

    await waitFor(() => {
      expect(screen.getByTestId("drive-upload-target")).toHaveTextContent(
        "Group folder",
      );
    });
  });

  it("updates upload target when a folder row is selected", async () => {
    mockedFetch.mockResolvedValue([
      {
        id: "d1",
        name: "Docs",
        type: "folder",
        mimeType: "application/vnd.google-apps.folder",
      },
    ]);

    renderDriveTab(<DriveTab groupId="g1" driveFolderId="root-id" />);

    await waitFor(() => screen.getByTestId("drive-folder-select-d1"));

    fireEvent.click(screen.getByTestId("drive-folder-select-d1"));

    expect(screen.getByTestId("drive-upload-target")).toHaveTextContent("Docs");
    expect(screen.getByTestId("drive-folder-select-d1")).toHaveAttribute(
      "data-selected",
      "true",
    );
  });

  it("creates folder with parentFolderId of selected folder", async () => {
    mockedFetch.mockResolvedValue([
      {
        id: "d1",
        name: "Docs",
        type: "folder",
        mimeType: "application/vnd.google-apps.folder",
      },
    ]);
    mockedCreateFolder.mockResolvedValue({
      id: "n1",
      name: "Inner",
    });

    renderDriveTab(<DriveTab groupId="g1" driveFolderId="root-id" />);

    await waitFor(() => screen.getByTestId("drive-folder-select-d1"));
    fireEvent.click(screen.getByTestId("drive-folder-select-d1"));

    fireEvent.click(screen.getByTestId("drive-new-folder-trigger"));
    fireEvent.change(screen.getByTestId("drive-new-folder-name"), {
      target: { value: "Inner" },
    });
    fireEvent.click(screen.getByTestId("drive-new-folder-submit"));

    await waitFor(() => {
      expect(mockedCreateFolder).toHaveBeenCalledWith("g1", "test-jwt", {
        name: "Inner",
        parentFolderId: "d1",
      });
    });
  });

  it("uploads file using selected folder as parent", async () => {
    mockedFetch.mockResolvedValue([
      {
        id: "d1",
        name: "Docs",
        type: "folder",
        mimeType: "application/vnd.google-apps.folder",
      },
    ]);
    mockedUpload.mockResolvedValue({ id: "up", name: "a.txt" });

    renderDriveTab(<DriveTab groupId="g1" driveFolderId="root-id" />);

    await waitFor(() => screen.getByTestId("drive-folder-select-d1"));
    fireEvent.click(screen.getByTestId("drive-folder-select-d1"));

    const file = new File(["x"], "a.txt", { type: "text/plain" });
    fireEvent.change(screen.getByTestId("drive-upload-input"), {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(mockedUpload).toHaveBeenCalledWith("g1", "test-jwt", file, "d1");
    });
  });

  it("shows error when root fetch fails", async () => {
    mockedFetch.mockRejectedValue(new HttpError(500, "Server error"));

    renderDriveTab(<DriveTab groupId="g1" driveFolderId="root-id" />);

    await waitFor(() => {
      expect(screen.getByTestId("drive-tab-error")).toBeInTheDocument();
    });
  });

  it("shows empty message when folder has no items", async () => {
    mockedFetch.mockResolvedValue([]);

    renderDriveTab(<DriveTab groupId="g1" driveFolderId="root-id" />);

    await waitFor(() => {
      expect(screen.getByTestId("drive-tab-empty")).toBeInTheDocument();
    });
  });

  it("prompts sign-in when there is no access token", () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);

    renderDriveTab(<DriveTab groupId="g1" driveFolderId="root-id" />);

    expect(screen.getByText(/Sign in again/i)).toBeInTheDocument();
    expect(mockedFetch).not.toHaveBeenCalled();
    expect(mockedActivity).not.toHaveBeenCalled();
  });

  it("shows activity panel empty state when API returns no rows", async () => {
    mockedFetch.mockResolvedValue([
      {
        id: "d1",
        name: "Docs",
        type: "folder",
        mimeType: "application/vnd.google-apps.folder",
      },
    ]);

    renderDriveTab(<DriveTab groupId="g1" driveFolderId="root-id" />);

    await waitFor(() => {
      expect(screen.getByTestId("drive-activity-empty")).toBeInTheDocument();
    });
  });

  it("shows activity error when activity request fails", async () => {
    mockedFetch.mockResolvedValue([
      {
        id: "d1",
        name: "Docs",
        type: "folder",
        mimeType: "application/vnd.google-apps.folder",
      },
    ]);
    mockedActivity.mockRejectedValue(new Error("activity failed"));

    renderDriveTab(<DriveTab groupId="g1" driveFolderId="root-id" />);

    await waitFor(() => screen.getByTestId("drive-activity-error"));
  });
});
