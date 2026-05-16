import * as React from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { CornerDownRight, GripVertical, Layers, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Task, TaskStatus } from "../types";
import {
  useUpdateTaskStatusMutation,
  useSubmitTaskMutation,
  useApproveTaskMutation,
  useCreateTaskMutation,
  useUpdateTaskMutation,
} from "../queries";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { TaskForm, type TaskFormMemberOption } from "./TaskForm";

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "todo", label: "To do" },
  { id: "in_progress", label: "In progress" },
  { id: "pending_review", label: "Review" },
  { id: "done", label: "Done" },
  { id: "failed", label: "Failed" },
];

function columnDroppableId(status: TaskStatus) {
  return `column-${status}` as const;
}

function findTaskDeep(roots: Task[], id: string): Task | undefined {
  for (const r of roots) {
    if (r.id === id) return r;
    const subs = r.subtasks ?? [];
    const nested = findTaskDeep(subs, id);
    if (nested) return nested;
  }
  return undefined;
}

function sortSubtasks(t: Task): Task[] {
  return [...(t.subtasks ?? [])].sort((a, b) =>
    (a.createdAt ?? "").localeCompare(b.createdAt ?? ""),
  );
}

/**
 * Roots and nested subtasks in tree order (parent before children) for Kanban columns.
 * Fills `parentTaskTitle` from the immediate parent’s title when the API omits `parent_task` on nested rows.
 */
function flattenTasksForBoard(roots: Task[]): Task[] {
  const out: Task[] = [];
  function walk(node: Task, immediateParentTitle?: string) {
    let merged = node;
    if (node.parentTaskId) {
      const fromApi = (node.parentTaskTitle ?? "").trim();
      const fromTree = (immediateParentTitle ?? "").trim();
      const resolved = fromApi || fromTree;
      if (resolved && !fromApi) {
        merged = { ...node, parentTaskTitle: resolved };
      }
    }
    out.push(merged);
    for (const st of sortSubtasks(merged)) {
      walk(st, merged.title);
    }
  }
  for (const r of roots) walk(r);
  return out;
}

function initialsFromName(name: string | undefined, fallbackId?: string): string {
  const n = (name ?? "").trim();
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase().slice(0, 2);
    }
    return n.slice(0, 2).toUpperCase();
  }
  const id = (fallbackId ?? "").replace(/-/g, "");
  return id ? id.slice(0, 2).toUpperCase() : "—";
}

function canEditGroupTask(
  task: Task,
  currentUserId: string | undefined,
  isLeader: boolean,
): boolean {
  if (!currentUserId) return false;
  if (isLeader) return true;
  if (task.createdById === currentUserId) return true;
  if (task.assigneeId === currentUserId) return true;
  return false;
}

function KanbanColumn({
  status,
  label,
  children,
  dropDisabled,
}: {
  status: TaskStatus;
  label: string;
  children: React.ReactNode;
  dropDisabled: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: columnDroppableId(status),
    disabled: dropDisabled,
  });

  return (
    <div className="flex min-h-[420px] min-w-[220px] flex-1 flex-col rounded-xl border border-border bg-muted/20">
      <div className="border-b border-border px-3 py-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </h3>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-2 p-2 transition-colors",
          isOver && !dropDisabled && "bg-primary/5 ring-1 ring-inset ring-primary/20",
          dropDisabled && "opacity-60",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function KanbanCard({
  task,
  contextLabel,
  memberOptions,
  defaultAssigneeId,
  currentUserId,
  isLeader,
}: {
  task: Task;
  contextLabel: string;
  memberOptions: TaskFormMemberOption[];
  defaultAssigneeId?: string;
  currentUserId?: string;
  isLeader: boolean;
}) {
  const [subtaskOpen, setSubtaskOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const { mutate: createSubtask, isPending: subtaskPending } = useCreateTaskMutation();
  const { mutate: updateTask, isPending: updatePending } = useUpdateTaskMutation();

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    disabled: task.status === "done",
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.85 : 1,
  };

  const due = task.dueDate ? new Date(task.dueDate) : null;
  const today = new Date();
  const startOf = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x.getTime();
  };
  const overdue =
    due &&
    task.status !== "done" &&
    startOf(due) < startOf(today) &&
    due.toDateString() !== today.toDateString();
  const dueToday =
    due && task.status !== "done" && due.toDateString() === today.toDateString();

  const isSubtask = Boolean(task.parentTaskId);
  const parentTaskNameForBadge = (task.parentTaskTitle ?? "").trim() || "Parent task";
  const displayName = task.assigneeName?.trim() || "Unassigned";
  const initials = initialsFromName(task.assigneeName, task.assigneeId);
  const canEdit = canEditGroupTask(task, currentUserId, isLeader);
  const canAddSubtask = Boolean(task.groupId && !isSubtask);

  return (
    <div className="space-y-2">
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "rounded-xl border border-border bg-card p-3 shadow-sm",
          isDragging && "z-10 shadow-md ring-1 ring-primary/30",
        )}
      >
        <div className="flex gap-2">
          <button
            type="button"
            className="mt-1 shrink-0 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
            {...listeners}
            {...attributes}
            aria-label="Drag task"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              {isSubtask ? (
                <div
                  className="inline-flex max-w-full min-w-0 flex-1 items-center gap-1.5 rounded-md border border-primary/35 bg-primary/5 px-2 py-1"
                  title={parentTaskNameForBadge}
                >
                  <CornerDownRight
                    className="h-3.5 w-3.5 shrink-0 text-primary"
                    aria-hidden
                  />
                  <span className="truncate text-xs font-semibold leading-snug text-foreground">
                    {parentTaskNameForBadge}
                  </span>
                </div>
              ) : (
                <div className="inline-flex max-w-full min-w-0 flex-1 items-center gap-1.5 rounded-md border border-warning/40 bg-warning/5 px-2 py-1">
                  <Layers className="h-3.5 w-3.5 shrink-0 text-warning" aria-hidden />
                  <span className="truncate text-[10px] font-bold uppercase tracking-wide text-warning">
                    {contextLabel}
                  </span>
                </div>
              )}
              {canEdit ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                  aria-label="Edit task"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              ) : null}
            </div>

            <h4 className="text-base font-bold leading-snug tracking-tight text-foreground">
              {task.title}
            </h4>

            <div className="flex items-center justify-between gap-2 pt-0.5">
              <div className="flex min-w-0 items-center gap-2">
                {task.assigneeAvatarUrl ? (
                  <img
                    src={task.assigneeAvatarUrl}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded-lg border border-border object-cover"
                  />
                ) : (
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-amber-400/90 via-orange-500/80 to-indigo-600/90 text-[11px] font-bold text-primary-foreground shadow-inner"
                    title={displayName}
                  >
                    {initials}
                  </div>
                )}
                <span className="truncate text-xs font-medium text-muted-foreground">
                  {displayName}
                </span>
              </div>
              {due ? (
                <span
                  className={cn(
                    "shrink-0 text-xs font-medium tabular-nums text-muted-foreground",
                    dueToday && "text-warning",
                    overdue && "text-destructive",
                  )}
                >
                  {due.toLocaleDateString("en", { month: "short", day: "numeric" })}
                </span>
              ) : (
                <span className="shrink-0 text-xs text-muted-foreground/70">—</span>
              )}
            </div>

            {canAddSubtask ? (
              <div className="border-t border-border/60 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-full gap-1 text-xs"
                  onClick={() => setSubtaskOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add subtask
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <Dialog open={subtaskOpen} onOpenChange={setSubtaskOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New subtask</DialogTitle>
          </DialogHeader>
          <TaskForm
            defaultGroupId={task.groupId}
            parentTaskId={task.id}
            parentTaskTitle={task.title}
            memberOptions={memberOptions}
            defaultAssigneeId={defaultAssigneeId}
            isLoading={subtaskPending}
            onCancel={() => setSubtaskOpen(false)}
            onSubmit={(data) => {
              createSubtask(data, {
                onSuccess: () => setSubtaskOpen(false),
              });
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit task</DialogTitle>
          </DialogHeader>
          {editOpen ? (
            <TaskForm
              key={task.id}
              isEdit
              defaultGroupId={task.groupId}
              memberOptions={memberOptions}
              defaultAssigneeId={defaultAssigneeId}
              initialData={{
                id: task.id,
                title: task.title,
                description: task.description,
                dueDate: task.dueDate,
                assigneeId: task.assigneeId,
              }}
              isLoading={updatePending}
              onCancel={() => setEditOpen(false)}
              onUpdate={(input) => {
                updateTask(
                  { id: task.id, input },
                  {
                    onSuccess: () => setEditOpen(false),
                  },
                );
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export interface GroupKanbanBoardProps {
  tasks: Task[];
  isLeader: boolean;
  groupId: string;
  /** Shown on the card tag when the task has no parent task title */
  groupName: string;
  memberOptions: TaskFormMemberOption[];
  defaultAssigneeId?: string;
  /** Used to show edit only when the user may edit (leader, creator, or assignee) */
  currentUserId?: string;
}

export function GroupKanbanBoard({
  tasks,
  isLeader,
  groupId: _groupId,
  groupName,
  memberOptions,
  defaultAssigneeId,
  currentUserId,
}: GroupKanbanBoardProps) {
  const { mutate: updateStatus } = useUpdateTaskStatusMutation();
  const { mutate: submitTask } = useSubmitTaskMutation();
  const { mutate: approveTask } = useApproveTaskMutation();

  const contextLabel = groupName.trim() || "Group";

  const [optimisticStatuses, setOptimisticStatuses] = React.useState<Map<string, TaskStatus>>(
    () => new Map(),
  );

  const [rejectionTask, setRejectionTask] = React.useState<Task | null>(null);
  const [rejectionComment, setRejectionComment] = React.useState("");

  // Auto-clear optimistic overrides once server data confirms the new status.
  React.useEffect(() => {
    setOptimisticStatuses((prev) => {
      if (prev.size === 0) return prev;
      const flat = flattenTasksForBoard(tasks);
      const next = new Map(prev);
      let changed = false;
      for (const [id, status] of prev) {
        const serverTask = flat.find((t) => t.id === id);
        if (serverTask?.status === status) {
          next.delete(id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [tasks]);

  const flatTasks = React.useMemo(() => {
    const flat = flattenTasksForBoard(tasks);
    if (optimisticStatuses.size === 0) return flat;
    return flat.map((t) => {
      const override = optimisticStatuses.get(t.id);
      return override !== undefined ? { ...t, status: override } : t;
    });
  }, [tasks, optimisticStatuses]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      const overId = String(over.id);
      if (!overId.startsWith("column-")) return;

      const newStatus = overId.replace("column-", "") as TaskStatus;
      const task = findTaskDeep(tasks, active.id as string);
      if (!task || task.status === newStatus) return;

      if (newStatus === "done" || newStatus === "failed") {
        if (!isLeader || task.status !== "pending_review") return;
      } else if (newStatus === "pending_review") {
        if (task.status !== "in_progress") return;
      } else if (task.status === "pending_review") {
        if (!isLeader) return;
      } else if (task.status === "done") {
        return;
      }

      const makeOnError = (taskId: string) => (err: unknown) => {
        setOptimisticStatuses((prev) => {
          const next = new Map(prev);
          next.delete(taskId);
          return next;
        });
        toast.error(err instanceof Error ? err.message : "Failed to update task status");
      };

      if (newStatus === "failed") {
        // Show rejection dialog — optimistic update deferred until leader confirms
        setRejectionTask(task);
        setRejectionComment("");
        return;
      }

      setOptimisticStatuses((prev) => new Map(prev).set(task.id, newStatus));

      if (newStatus === "done") {
        approveTask({ id: task.id, input: { status: "done" } }, { onError: makeOnError(task.id) });
        return;
      }
      if (newStatus === "pending_review") {
        submitTask(task.id, { onError: makeOnError(task.id) });
        return;
      }
      updateStatus({ id: task.id, status: newStatus }, { onError: makeOnError(task.id) });
    },
    [tasks, isLeader, updateStatus, submitTask, approveTask, setRejectionTask, setRejectionComment],
  );

  function handleRejectConfirm() {
    if (!rejectionTask || !rejectionComment.trim()) return;
    const task = rejectionTask;
    const comment = rejectionComment.trim();
    setRejectionTask(null);
    setRejectionComment("");
    setOptimisticStatuses((prev) => new Map(prev).set(task.id, "failed"));
    const onError = (err: unknown) => {
      setOptimisticStatuses((prev) => {
        const next = new Map(prev);
        next.delete(task.id);
        return next;
      });
      toast.error(err instanceof Error ? err.message : "Failed to update task status");
    };
    approveTask({ id: task.id, input: { status: "failed", comment } }, { onError });
  }

  return (
    <>
    <Dialog
      open={rejectionTask !== null}
      onOpenChange={(open) => {
        if (!open) {
          setRejectionTask(null);
          setRejectionComment("");
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reject task</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Provide a reason for rejecting{" "}
            <span className="font-medium text-foreground">
              &ldquo;{rejectionTask?.title}&rdquo;
            </span>
            . This will be included in the notification sent to the assignee.
          </p>
          <Label htmlFor="rejection-comment" className="sr-only">
            Rejection reason
          </Label>
          <Textarea
            id="rejection-comment"
            placeholder="Enter rejection reason…"
            rows={3}
            value={rejectionComment}
            onChange={(e) => setRejectionComment(e.target.value)}
            className="resize-none"
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setRejectionTask(null);
              setRejectionComment("");
            }}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!rejectionComment.trim()}
            onClick={handleRejectConfirm}
          >
            Reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {COLUMNS.map((col) => {
          const colTasks = flatTasks
            .filter((t) => t.status === col.id)
            .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
          const dropDisabled =
            !isLeader && (col.id === "done" || col.id === "failed");

          return (
            <KanbanColumn
              key={col.id}
              status={col.id}
              label={col.label}
              dropDisabled={dropDisabled}
            >
              {colTasks.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">Empty</p>
              ) : (
                colTasks.map((t) => (
                  <KanbanCard
                    key={t.id}
                    task={t}
                    contextLabel={contextLabel}
                    memberOptions={memberOptions}
                    defaultAssigneeId={defaultAssigneeId}
                    currentUserId={currentUserId}
                    isLeader={isLeader}
                  />
                ))
              )}
            </KanbanColumn>
          );
        })}
      </div>
    </DndContext>
    </>
  );
}
