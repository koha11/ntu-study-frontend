import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { render } from "@/test/test-utils";
import { TaskOutcomePanel } from "./TaskOutcomePanel";
import type { TaskOutcomeLink, OutcomeFile } from "../types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts?.count !== undefined ? `${key}:${opts.count}` : key,
  }),
}));

const LINK: TaskOutcomeLink = {
  id: "lnk1",
  taskId: "t1",
  url: "https://docs.google.com/d/abc",
  label: "Draft doc",
  createdById: "u1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const FILE: OutcomeFile = {
  id: "f1",
  name: "report.pdf",
  mimeType: "application/pdf",
  webViewLink: "https://drive.google.com/f1",
};

const defaultProps = {
  taskId: "t1",
  assigneeId: "u1",
  currentUserId: "u1",
  driveFolderId: "folder-123",
  links: [] as TaskOutcomeLink[],
  files: [] as OutcomeFile[],
  isLoadingLinks: false,
  isLoadingFiles: false,
  onAddLink: vi.fn(),
  onRemoveLink: vi.fn(),
  onUploadFile: vi.fn(),
  onDeleteFile: vi.fn(),
};

describe("TaskOutcomePanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders links and files section headings", () => {
    render(<TaskOutcomePanel {...defaultProps} />);
    expect(screen.getByText("tasks.outcome.linksSection")).toBeInTheDocument();
    expect(screen.getByText("tasks.outcome.filesSection")).toBeInTheDocument();
  });

  it("hides files section when driveFolderId is absent", () => {
    render(<TaskOutcomePanel {...defaultProps} driveFolderId={undefined} />);
    expect(screen.getByText("tasks.outcome.linksSection")).toBeInTheDocument();
    expect(screen.queryByText("tasks.outcome.filesSection")).not.toBeInTheDocument();
  });

  it("renders list of links", () => {
    render(<TaskOutcomePanel {...defaultProps} links={[LINK]} />);
    expect(screen.getByText("Draft doc")).toBeInTheDocument();
  });

  it("falls back to url when label is absent", () => {
    const noLabel = { ...LINK, label: undefined };
    render(<TaskOutcomePanel {...defaultProps} links={[noLabel]} />);
    expect(screen.getByText("https://docs.google.com/d/abc")).toBeInTheDocument();
  });

  it("shows add link form for assignee", () => {
    render(<TaskOutcomePanel {...defaultProps} />);
    expect(screen.getByPlaceholderText("tasks.outcome.urlPlaceholder")).toBeInTheDocument();
  });

  it("hides add link form for non-assignee", () => {
    render(<TaskOutcomePanel {...defaultProps} currentUserId="other-user" />);
    expect(screen.queryByPlaceholderText("tasks.outcome.urlPlaceholder")).not.toBeInTheDocument();
  });

  it("calls onAddLink with url and label when form submitted", async () => {
    const onAddLink = vi.fn();
    render(<TaskOutcomePanel {...defaultProps} onAddLink={onAddLink} />);

    const urlInput = screen.getByPlaceholderText("tasks.outcome.urlPlaceholder");
    const labelInput = screen.getByPlaceholderText("tasks.outcome.labelPlaceholder");
    fireEvent.change(urlInput, { target: { value: "https://example.com" } });
    fireEvent.change(labelInput, { target: { value: "My link" } });
    fireEvent.click(screen.getByText("tasks.outcome.addLink"));

    await waitFor(() => {
      expect(onAddLink).toHaveBeenCalledWith({ url: "https://example.com", label: "My link" });
    });
  });

  it("calls onAddLink with only url when label is empty", async () => {
    const onAddLink = vi.fn();
    render(<TaskOutcomePanel {...defaultProps} onAddLink={onAddLink} />);

    const urlInput = screen.getByPlaceholderText("tasks.outcome.urlPlaceholder");
    fireEvent.change(urlInput, { target: { value: "https://example.com" } });
    fireEvent.click(screen.getByText("tasks.outcome.addLink"));

    await waitFor(() => {
      expect(onAddLink).toHaveBeenCalledWith({ url: "https://example.com" });
    });
  });

  it("does not call onAddLink when url is empty", async () => {
    const onAddLink = vi.fn();
    render(<TaskOutcomePanel {...defaultProps} onAddLink={onAddLink} />);
    fireEvent.click(screen.getByText("tasks.outcome.addLink"));
    expect(onAddLink).not.toHaveBeenCalled();
  });

  it("calls onRemoveLink when delete button clicked", async () => {
    const onRemoveLink = vi.fn();
    render(<TaskOutcomePanel {...defaultProps} links={[LINK]} onRemoveLink={onRemoveLink} />);
    const deleteBtn = screen.getByLabelText("tasks.outcome.deleteLink");
    fireEvent.click(deleteBtn);
    await waitFor(() => {
      expect(onRemoveLink).toHaveBeenCalledWith("lnk1");
    });
  });

  it("hides link delete button for non-assignee", () => {
    render(
      <TaskOutcomePanel {...defaultProps} links={[LINK]} currentUserId="other-user" />,
    );
    expect(screen.queryByLabelText("tasks.outcome.deleteLink")).not.toBeInTheDocument();
  });

  it("renders list of Drive files", () => {
    render(<TaskOutcomePanel {...defaultProps} files={[FILE]} />);
    expect(screen.getByText("report.pdf")).toBeInTheDocument();
  });

  it("renders open-in-drive link for files with webViewLink", () => {
    render(<TaskOutcomePanel {...defaultProps} files={[FILE]} />);
    const link = screen.getByRole("link", { name: /tasks\.outcome\.openInDrive/ });
    expect(link).toHaveAttribute("href", "https://drive.google.com/f1");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("calls onDeleteFile when file delete button clicked", async () => {
    const onDeleteFile = vi.fn();
    render(
      <TaskOutcomePanel {...defaultProps} files={[FILE]} onDeleteFile={onDeleteFile} />,
    );
    fireEvent.click(screen.getByLabelText("tasks.outcome.deleteFile"));
    await waitFor(() => {
      expect(onDeleteFile).toHaveBeenCalledWith("f1");
    });
  });

  it("hides file delete button for non-assignee", () => {
    render(
      <TaskOutcomePanel {...defaultProps} files={[FILE]} currentUserId="other-user" />,
    );
    expect(screen.queryByLabelText("tasks.outcome.deleteFile")).not.toBeInTheDocument();
  });

  it("shows upload button for assignee when drive folder exists", () => {
    render(<TaskOutcomePanel {...defaultProps} />);
    expect(screen.getByText("tasks.outcome.uploadFile")).toBeInTheDocument();
  });

  it("hides upload button for non-assignee", () => {
    render(<TaskOutcomePanel {...defaultProps} currentUserId="other-user" />);
    expect(screen.queryByText("tasks.outcome.uploadFile")).not.toBeInTheDocument();
  });

  it("calls onUploadFile when file input changes", async () => {
    const onUploadFile = vi.fn();
    render(<TaskOutcomePanel {...defaultProps} onUploadFile={onUploadFile} />);

    const fileInput = screen.getByTestId("outcome-file-input");
    const file = new File(["content"], "test.pdf", { type: "application/pdf" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(onUploadFile).toHaveBeenCalledWith(file);
    });
  });

  it("shows loading state for links", () => {
    render(<TaskOutcomePanel {...defaultProps} isLoadingLinks={true} />);
    expect(screen.getByText("tasks.outcome.loadingLinks")).toBeInTheDocument();
  });

  it("shows loading state for files", () => {
    render(<TaskOutcomePanel {...defaultProps} isLoadingFiles={true} />);
    expect(screen.getByText("tasks.outcome.loadingFiles")).toBeInTheDocument();
  });

  it("shows empty state for links", () => {
    render(<TaskOutcomePanel {...defaultProps} links={[]} isLoadingLinks={false} />);
    expect(screen.getByText("tasks.outcome.noLinks")).toBeInTheDocument();
  });

  it("shows empty state for files", () => {
    render(<TaskOutcomePanel {...defaultProps} files={[]} isLoadingFiles={false} />);
    expect(screen.getByText("tasks.outcome.noFiles")).toBeInTheDocument();
  });
});
