import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { TaskForm } from "./TaskForm";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts?.count !== undefined ? `${key}:${opts.count}` : key,
  }),
}));

// DatePicker is a UI-only component — stub it with a simple input
vi.mock("@/components/ui/date-picker", () => ({
  DatePicker: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (v: string) => void;
  }) => (
    <input
      data-testid="date-picker"
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

describe("TaskForm – create mode", () => {
  it("renders Task Title and Description inputs", () => {
    render(<TaskForm />);
    expect(screen.getByText("tasks.form.taskTitle")).toBeInTheDocument();
    expect(screen.getByText("tasks.form.description")).toBeInTheDocument();
  });

  it("renders Save button in create mode", () => {
    render(<TaskForm />);
    expect(screen.getByRole("button", { name: "common.save" })).toBeInTheDocument();
  });

  it("renders Status select in personal (no group) create mode", () => {
    render(<TaskForm />);
    expect(screen.getByText("tasks.form.status")).toBeInTheDocument();
    expect(screen.getByTestId("status-select")).toBeInTheDocument();
  });

  it("renders expectedOutcomeType dropdown", () => {
    render(<TaskForm />);
    expect(screen.getByText("tasks.form.expectedOutcomeType")).toBeInTheDocument();
    expect(screen.getByTestId("expected-outcome-type-select")).toBeInTheDocument();
  });

  it("shows outcome note", () => {
    render(<TaskForm />);
    expect(screen.getByText("tasks.form.outcomeNote")).toBeInTheDocument();
  });

  it("defaults expectedOutcomeType to none", () => {
    render(<TaskForm />);
    const select = screen.getByTestId("expected-outcome-type-select") as HTMLSelectElement;
    expect(select.value).toBe("none");
  });

  it("submit includes expectedOutcomeType none by default", () => {
    const onSubmit = vi.fn();
    render(<TaskForm onSubmit={onSubmit} />);
    const [titleInput, descInput] = screen.getAllByRole("textbox");
    fireEvent.change(titleInput, { target: { value: "Task" } });
    fireEvent.change(descInput, { target: { value: "Desc" } });
    fireEvent.click(screen.getByRole("button", { name: "common.save" }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ expectedOutcomeType: "none" }),
    );
  });

  it("submit includes expectedOutcomeDescription when filled", () => {
    const onSubmit = vi.fn();
    render(<TaskForm onSubmit={onSubmit} />);
    const textboxes = screen.getAllByRole("textbox");
    fireEvent.change(textboxes[0], { target: { value: "Task" } });
    fireEvent.change(textboxes[1], { target: { value: "Desc" } });
    fireEvent.change(textboxes[2], { target: { value: "Final report" } });
    fireEvent.click(screen.getByRole("button", { name: "common.save" }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ expectedOutcomeDescription: "Final report" }),
    );
  });

  it("hides Status select in group create mode", () => {
    render(<TaskForm defaultGroupId="g1" />);
    expect(screen.queryByDisplayValue("To Do")).not.toBeInTheDocument();
  });

  it("shows Cancel button when onCancel is provided", () => {
    render(<TaskForm onCancel={vi.fn()} />);
    expect(screen.getByRole("button", { name: "common.cancel" })).toBeInTheDocument();
  });

  it("calls onCancel when Cancel button is clicked", () => {
    const onCancel = vi.fn();
    render(<TaskForm onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: "common.cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onSubmit with form data when submitted", () => {
    const onSubmit = vi.fn();
    render(<TaskForm onSubmit={onSubmit} />);

    const [titleInput, descInput] = screen.getAllByRole("textbox");
    fireEvent.change(titleInput, { target: { value: "My New Task" } });
    fireEvent.change(descInput, { target: { value: "Some description" } });
    fireEvent.click(screen.getByRole("button", { name: "common.save" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ title: "My New Task" }),
    );
  });

  it("includes groupId in submit data when defaultGroupId is provided", () => {
    const onSubmit = vi.fn();
    render(<TaskForm defaultGroupId="grp-99" onSubmit={onSubmit} />);

    const [titleInput, descInput] = screen.getAllByRole("textbox");
    fireEvent.change(titleInput, { target: { value: "Group Task" } });
    fireEvent.change(descInput, { target: { value: "Some description" } });
    fireEvent.click(screen.getByRole("button", { name: "common.save" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ groupId: "grp-99" }),
    );
  });

  it("includes parentTaskId in submit data when provided", () => {
    const onSubmit = vi.fn();
    render(
      <TaskForm
        parentTaskId="parent-t1"
        parentTaskTitle="Parent Task"
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByText("tasks.form.subtaskOf")).toBeInTheDocument();
    expect(screen.getByText("Parent Task")).toBeInTheDocument();

    const [titleInput, descInput] = screen.getAllByRole("textbox");
    fireEvent.change(titleInput, { target: { value: "Child Task" } });
    fireEvent.change(descInput, { target: { value: "Some description" } });
    fireEvent.click(screen.getByRole("button", { name: "common.save" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ parentTaskId: "parent-t1" }),
    );
  });

  it("renders assignee select when group and memberOptions are provided", () => {
    render(
      <TaskForm
        defaultGroupId="g1"
        memberOptions={[
          { userId: "u1", label: "Alice" },
          { userId: "u2", label: "Bob" },
        ]}
      />,
    );

    expect(screen.getByText("tasks.form.assignee")).toBeInTheDocument();
    expect(screen.getByTestId("assignee-select")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Alice" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Bob" })).toBeInTheDocument();
  });

  it("includes assigneeId in submit when member is selected in group mode", () => {
    const onSubmit = vi.fn();
    render(
      <TaskForm
        defaultGroupId="g1"
        memberOptions={[
          { userId: "u1", label: "Alice" },
          { userId: "u2", label: "Bob" },
        ]}
        onSubmit={onSubmit}
      />,
    );

    const [titleInput, descInput] = screen.getAllByRole("textbox");
    fireEvent.change(titleInput, { target: { value: "Assigned Task" } });
    fireEvent.change(descInput, { target: { value: "Some description" } });
    fireEvent.change(screen.getByTestId("assignee-select"), { target: { value: "u2" } });
    fireEvent.click(screen.getByRole("button", { name: "common.save" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ assigneeId: "u2" }),
    );
  });

  it("does not include assigneeId for personal tasks (no group)", () => {
    const onSubmit = vi.fn();
    render(<TaskForm onSubmit={onSubmit} />);

    const [titleInput, descInput] = screen.getAllByRole("textbox");
    fireEvent.change(titleInput, { target: { value: "Personal Task" } });
    fireEvent.change(descInput, { target: { value: "Some description" } });
    fireEvent.click(screen.getByRole("button", { name: "common.save" }));

    const call = onSubmit.mock.calls[0][0] as Record<string, unknown>;
    expect(call.assigneeId).toBeUndefined();
  });

  it("disables Save button while loading", () => {
    render(<TaskForm isLoading={true} />);
    expect(screen.getByRole("button", { name: "tasks.form.saving" })).toBeDisabled();
  });
});

describe("TaskForm – create mode – dueDate validation", () => {
  it("blocks submit and shows error when dueDate is in the past", () => {
    const onSubmit = vi.fn();
    render(<TaskForm onSubmit={onSubmit} />);

    const [titleInput, descInput] = screen.getAllByRole("textbox");
    fireEvent.change(titleInput, { target: { value: "Past Task" } });
    fireEvent.change(descInput, { target: { value: "Some description" } });
    fireEvent.change(screen.getByTestId("date-picker"), {
      target: { value: "2020-01-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: "common.save" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("tasks.form.dueDateError")).toBeInTheDocument();
  });

  it("clears dueDate error when date is changed", () => {
    const onSubmit = vi.fn();
    render(<TaskForm onSubmit={onSubmit} />);

    const [titleInput, descInput] = screen.getAllByRole("textbox");
    fireEvent.change(titleInput, { target: { value: "Task" } });
    fireEvent.change(descInput, { target: { value: "Some description" } });
    fireEvent.change(screen.getByTestId("date-picker"), {
      target: { value: "2020-01-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: "common.save" }));
    expect(screen.getByText("tasks.form.dueDateError")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("date-picker"), {
      target: { value: "2099-12-31" },
    });
    expect(screen.queryByText("tasks.form.dueDateError")).not.toBeInTheDocument();
  });
});

describe("TaskForm – edit mode", () => {
  const existing = {
    id: "task-99",
    title: "Existing Task",
    description: "Existing description",
    dueDate: "2099-12-31T00:00:00.000Z",
    status: "in_progress",
    assigneeId: "u1",
  };

  it("shows 'Update task' button in edit mode", () => {
    render(<TaskForm isEdit={true} initialData={existing} />);
    expect(screen.getByRole("button", { name: "tasks.form.updateTask" })).toBeInTheDocument();
  });

  it("pre-fills title with initialData", () => {
    render(<TaskForm isEdit={true} initialData={existing} />);
    const input = screen.getByDisplayValue("Existing Task") as HTMLInputElement;
    expect(input.value).toBe("Existing Task");
  });

  it("pre-fills description with initialData", () => {
    render(<TaskForm isEdit={true} initialData={existing} />);
    const textarea = screen.getByDisplayValue("Existing description") as HTMLTextAreaElement;
    expect(textarea.value).toBe("Existing description");
  });

  it("shows status hint message in edit mode", () => {
    render(<TaskForm isEdit={true} initialData={existing} />);
    expect(screen.getByText("tasks.form.statusNote")).toBeInTheDocument();
  });

  it("hides Status select in edit mode", () => {
    render(<TaskForm isEdit={true} initialData={existing} />);
    expect(screen.queryByDisplayValue("In Progress")).not.toBeInTheDocument();
  });

  it("calls onUpdate (not onSubmit) when form is submitted in edit mode", () => {
    const onUpdate = vi.fn();
    const onSubmit = vi.fn();
    render(
      <TaskForm
        isEdit={true}
        initialData={existing}
        onUpdate={onUpdate}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByDisplayValue("Existing Task"), {
      target: { value: "Updated Title" },
    });
    fireEvent.click(screen.getByRole("button", { name: "tasks.form.updateTask" }));

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Updated Title" }),
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("trims whitespace from title on update", () => {
    const onUpdate = vi.fn();
    render(<TaskForm isEdit={true} initialData={existing} onUpdate={onUpdate} />);

    fireEvent.change(screen.getByDisplayValue("Existing Task"), {
      target: { value: "  Trimmed  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "tasks.form.updateTask" }));

    const call = onUpdate.mock.calls[0][0] as Record<string, unknown>;
    expect(call.title).toBe("Trimmed");
  });

  it("pre-fills expectedOutcomeType from initialData", () => {
    render(
      <TaskForm
        isEdit
        initialData={{ ...existing, expectedOutcomeType: "document" }}
      />,
    );
    const select = screen.getByTestId("expected-outcome-type-select") as HTMLSelectElement;
    expect(select.value).toBe("document");
  });

  it("update includes expectedOutcomeType", () => {
    const onUpdate = vi.fn();
    render(
      <TaskForm
        isEdit
        initialData={{ ...existing, expectedOutcomeType: "code" }}
        onUpdate={onUpdate}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "tasks.form.updateTask" }));
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ expectedOutcomeType: "code" }),
    );
  });
});
