import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { GroupForm } from "./GroupForm";

describe("GroupForm", () => {
  const onSubmit = vi.fn();
  const onCancel = vi.fn();

  beforeEach(() => { vi.clearAllMocks(); });

  it("renders empty form with no initial data", () => {
    render(<GroupForm onSubmit={onSubmit} />);
    expect(screen.getByText("Group Name")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("pre-fills name and description from initialData", () => {
    render(
      <GroupForm
        initialData={{ id: "g1", name: "Existing Group", description: "Some desc" }}
        onSubmit={onSubmit}
      />,
    );
    const inputs = screen.getAllByRole("textbox");
    expect((inputs[0] as HTMLInputElement).value).toBe("Existing Group");
    expect((inputs[1] as HTMLTextAreaElement).value).toBe("Some desc");
  });

  it("calls onSubmit with form data on submit", () => {
    render(<GroupForm onSubmit={onSubmit} />);
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], {
      target: { value: "New Group" },
    });
    fireEvent.change(inputs[1], {
      target: { value: "A new group description" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: "New Group", description: "A new group description" }),
    );
  });

  it("renders Cancel button when onCancel is provided", () => {
    render(<GroupForm onSubmit={onSubmit} onCancel={onCancel} />);
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("calls onCancel when Cancel is clicked", () => {
    render(<GroupForm onSubmit={onSubmit} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("does not render Cancel button when onCancel is not provided", () => {
    render(<GroupForm onSubmit={onSubmit} />);
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  it("shows Saving... and disables button when isLoading is true", () => {
    render(<GroupForm onSubmit={onSubmit} isLoading />);
    const btn = screen.getByRole("button", { name: "Saving..." });
    expect(btn).toBeDisabled();
  });

  it("shows Save and enables button when isLoading is false", () => {
    render(<GroupForm onSubmit={onSubmit} isLoading={false} />);
    expect(screen.getByRole("button", { name: "Save" })).not.toBeDisabled();
  });
});
