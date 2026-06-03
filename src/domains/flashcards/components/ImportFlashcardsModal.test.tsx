import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { ImportFlashcardsModal } from "./ImportFlashcardsModal";

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  onAppend: vi.fn(),
};

describe("ImportFlashcardsModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders dialog when open", () => {
    render(<ImportFlashcardsModal {...defaultProps} />);
    expect(screen.getByText("Import your data")).toBeInTheDocument();
  });

  it("does not render dialog content when closed", () => {
    render(<ImportFlashcardsModal {...defaultProps} open={false} />);
    expect(screen.queryByText("Import your data")).not.toBeInTheDocument();
  });

  it("shows empty preview initially", () => {
    render(<ImportFlashcardsModal {...defaultProps} />);
    expect(screen.getByText("Preview 0 cards")).toBeInTheDocument();
    expect(screen.getByText("Nothing to preview yet.")).toBeInTheDocument();
  });

  it("shows parsed preview when text is pasted with tab delimiter", () => {
    render(<ImportFlashcardsModal {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/Word 1/);
    fireEvent.change(textarea, { target: { value: "Hello\tWorld\nFoo\tBar" } });

    expect(screen.getByText("Preview 2 cards")).toBeInTheDocument();
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("Foo")).toBeInTheDocument();
  });

  it("Import button is disabled when no preview cards", () => {
    render(<ImportFlashcardsModal {...defaultProps} />);
    const importBtn = screen.getByRole("button", { name: "Import" });
    expect(importBtn).toBeDisabled();
  });

  it("Import button is enabled when preview has cards", () => {
    render(<ImportFlashcardsModal {...defaultProps} />);
    const textarea = screen.getByPlaceholderText(/Word 1/);
    fireEvent.change(textarea, { target: { value: "Term\tDef" } });
    expect(screen.getByRole("button", { name: "Import" })).not.toBeDisabled();
  });

  it("calls onAppend and closes dialog on import", () => {
    render(<ImportFlashcardsModal {...defaultProps} />);
    const textarea = screen.getByPlaceholderText(/Word 1/);
    fireEvent.change(textarea, { target: { value: "Term\tDefinition" } });

    fireEvent.click(screen.getByRole("button", { name: "Import" }));

    expect(defaultProps.onAppend).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ term: "Term", definition: "Definition" }),
      ]),
    );
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls onOpenChange(false) on cancel without calling onAppend", () => {
    render(<ImportFlashcardsModal {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel Import" }));
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    expect(defaultProps.onAppend).not.toHaveBeenCalled();
  });

  it("parses with comma delimiter when Comma radio is selected", () => {
    render(<ImportFlashcardsModal {...defaultProps} />);
    fireEvent.click(screen.getByLabelText("Comma"));
    const textarea = screen.getByPlaceholderText(/Word 1/);
    fireEvent.change(textarea, { target: { value: "Term,Definition" } });
    expect(screen.getByText("Preview 1 cards")).toBeInTheDocument();
  });

  it("shows custom term/def delimiter input when Custom radio is selected", () => {
    render(<ImportFlashcardsModal {...defaultProps} />);
    const customRadios = screen.getAllByLabelText("Custom");
    fireEvent.click(customRadios[0]);
    expect(screen.getByPlaceholderText("|")).toBeInTheDocument();
  });

  it("shows custom card separator input when Custom card sep radio is selected", () => {
    render(<ImportFlashcardsModal {...defaultProps} />);
    const customRadios = screen.getAllByLabelText("Custom");
    fireEvent.click(customRadios[1]);
    expect(screen.getByPlaceholderText("###")).toBeInTheDocument();
  });

  it("parses with semicolon card separator when Semicolon radio is selected", () => {
    render(<ImportFlashcardsModal {...defaultProps} />);
    fireEvent.click(screen.getByLabelText("Semicolon"));
    const textarea = screen.getByPlaceholderText(/Word 1/);
    fireEvent.change(textarea, { target: { value: "Term\tDef;Term2\tDef2" } });
    expect(screen.getByText("Preview 2 cards")).toBeInTheDocument();
  });

  it("clears textarea after successful import", () => {
    render(<ImportFlashcardsModal {...defaultProps} />);
    const textarea = screen.getByPlaceholderText(/Word 1/);
    fireEvent.change(textarea, { target: { value: "Term\tDef" } });
    fireEvent.click(screen.getByRole("button", { name: "Import" }));
    expect((textarea as HTMLTextAreaElement).value).toBe("");
  });
});
