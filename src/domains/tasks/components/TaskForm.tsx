import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { CreateTaskInput, UpdateTaskInput, ExpectedOutcomeType } from "../types";
import { DatePicker } from "@/components/ui/date-picker";

function todayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toDateInputValue(iso?: string): string {
  if (!iso?.trim()) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export interface TaskFormMemberOption {
  userId: string;
  label: string;
}

interface TaskFormProps {
  initialData?: {
    id: string;
    title: string;
    description?: string;
    dueDate?: string;
    status?: string;
    assigneeId?: string;
    expectedOutcomeType?: ExpectedOutcomeType;
    expectedOutcomeDescription?: string;
  };
  /** When creating a task in a group context, sets `groupId` on submit */
  defaultGroupId?: string;
  /** Group members for assignee picker (group tasks) */
  memberOptions?: TaskFormMemberOption[];
  /** Default selected assignee (usually current user id) */
  defaultAssigneeId?: string;
  /** Create as subtask of this task (requires `defaultGroupId` for group tasks) */
  parentTaskId?: string;
  parentTaskTitle?: string;
  /** Update existing task (title, description, due date, assignee); omit status here — use board drag */
  isEdit?: boolean;
  isLoading?: boolean;
  onSubmit?: (data: CreateTaskInput) => void;
  onUpdate?: (data: UpdateTaskInput) => void;
  onCancel?: () => void;
}

const OUTCOME_TYPES: ExpectedOutcomeType[] = [
  "none",
  "document",
  "presentation",
  "code",
  "other",
];

export function TaskForm({
  initialData,
  defaultGroupId,
  memberOptions,
  defaultAssigneeId,
  parentTaskId,
  parentTaskTitle,
  isEdit = false,
  isLoading = false,
  onSubmit,
  onUpdate,
  onCancel,
}: TaskFormProps) {
  const { t } = useTranslation();
  const initialAssignee =
    initialData?.assigneeId?.trim() ||
    defaultAssigneeId ||
    memberOptions?.[0]?.userId ||
    "";
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    dueDate: isEdit
      ? toDateInputValue(initialData?.dueDate)
      : initialData?.dueDate || "",
    status: initialData?.status || "todo",
    assigneeId: initialAssignee,
    expectedOutcomeType: (initialData?.expectedOutcomeType ?? "none") as ExpectedOutcomeType,
    expectedOutcomeDescription: initialData?.expectedOutcomeDescription || "",
  });
  const [dueDateError, setDueDateError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.dueDate && formData.dueDate < todayDateString()) {
      setDueDateError(true);
      return;
    }
    setDueDateError(false);
    if (isEdit && onUpdate) {
      onUpdate({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        dueDate: formData.dueDate || "",
        assigneeId:
          defaultGroupId && memberOptions?.length
            ? formData.assigneeId || undefined
            : undefined,
        expectedOutcomeType: formData.expectedOutcomeType,
        expectedOutcomeDescription:
          formData.expectedOutcomeDescription.trim() || undefined,
      });
      return;
    }
    if (onSubmit) {
      onSubmit({
        title: formData.title,
        description: formData.description || undefined,
        dueDate: formData.dueDate || undefined,
        groupId: defaultGroupId,
        parentTaskId: parentTaskId || undefined,
        assigneeId:
          defaultGroupId && memberOptions?.length
            ? formData.assigneeId || undefined
            : undefined,
        expectedOutcomeType: formData.expectedOutcomeType,
        expectedOutcomeDescription:
          formData.expectedOutcomeDescription.trim() || undefined,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isEdit ? (
        <p className="text-xs text-muted-foreground">
          {t("tasks.form.statusNote")}
        </p>
      ) : null}
      {!isEdit && parentTaskId && parentTaskTitle ? (
        <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          {t("tasks.form.subtaskOf")}{" "}
          <span className="font-semibold text-foreground">{parentTaskTitle}</span>
        </p>
      ) : null}
      <div>
        <label className="text-sm font-medium text-foreground">{t("tasks.form.taskTitle")}</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="mt-1 w-full rounded-md border border-border px-3 py-2"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">{t("tasks.form.description")}</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="mt-1 w-full rounded-md border border-border px-3 py-2"
          rows={3}
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">{t("tasks.form.dueDate")}</label>
        <DatePicker
          value={formData.dueDate}
          onChange={(value) => {
            setFormData({ ...formData, dueDate: value });
            setDueDateError(false);
          }}
        />
        {dueDateError && (
          <p className="mt-1 text-xs text-destructive">{t("tasks.form.dueDateError")}</p>
        )}
      </div>
      {defaultGroupId && memberOptions && memberOptions.length > 0 && (
        <div>
          <label className="text-sm font-medium text-foreground">{t("tasks.form.assignee")}</label>
          <select
            data-testid="assignee-select"
            value={formData.assigneeId}
            onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
            required
          >
            {memberOptions.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="text-sm font-medium text-foreground">
          {t("tasks.form.expectedOutcomeType")}
        </label>
        <select
          data-testid="expected-outcome-type-select"
          value={formData.expectedOutcomeType}
          onChange={(e) =>
            setFormData({ ...formData, expectedOutcomeType: e.target.value as ExpectedOutcomeType })
          }
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
        >
          {OUTCOME_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(`tasks.form.outcomeType.${type}`)}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-muted-foreground">{t("tasks.form.outcomeNote")}</p>
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">
          {t("tasks.form.expectedOutcomeDescription")}
        </label>
        <textarea
          value={formData.expectedOutcomeDescription}
          onChange={(e) =>
            setFormData({ ...formData, expectedOutcomeDescription: e.target.value })
          }
          className="mt-1 w-full rounded-md border border-border px-3 py-2"
          rows={2}
          placeholder={t("tasks.form.outcomeDescriptionPlaceholder")}
        />
      </div>
      {!defaultGroupId && !isEdit && (
        <div>
          <label className="text-sm font-medium text-foreground">{t("tasks.form.status")}</label>
          <select
            data-testid="status-select"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="mt-1 w-full rounded-md border border-border px-3 py-2"
          >
            <option value="todo">{t("tasks.filters.todo")}</option>
            <option value="in_progress">{t("tasks.filters.in_progress")}</option>
            <option value="pending_review">{t("tasks.filters.pending_review")}</option>
            <option value="done">{t("tasks.filters.done")}</option>
            <option value="failed">{t("tasks.filters.failed")}</option>
          </select>
        </div>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
        >
          {isLoading ? t("tasks.form.saving") : isEdit ? t("tasks.form.updateTask") : t("common.save")}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-border px-4 py-2 text-foreground"
          >
            {t("common.cancel")}
          </button>
        )}
      </div>
    </form>
  );
}
