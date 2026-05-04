import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Plus, Trash2, ListTodo, CalendarIcon, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  useTasksList,
  useUpdateTaskStatus,
  useSubmitTaskMutation,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  type Task,
} from "@/domains/tasks";
import { useGroupsList } from "@/domains/groups";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { TaskStatus } from "../types";

const FILTERS: { id: "all" | TaskStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "todo", label: "To do" },
  { id: "in_progress", label: "In progress" },
  { id: "pending_review", label: "Review" },
  { id: "done", label: "Done" },
];

function toDateOnlyString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dueMeta(due: Date | null, isDone: boolean) {
  const today = new Date();
  const overdue =
    due &&
    !isDone &&
    due.toDateString() !== today.toDateString() &&
    due.getTime() < new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const dueToday = due && !isDone && due.toDateString() === today.toDateString();
  return { overdue, dueToday };
}

export function TasksPage() {
  const { data: personalTasks = [], isLoading: personalLoading } = useTasksList();
  const { data: groupTasks = [], isLoading: groupTasksLoading } = useTasksList({
    assignedInGroups: true,
  });
  const { data: groups = [], isLoading: groupsLoading } = useGroupsList();

  const { mutate: updateTaskStatus } = useUpdateTaskStatus();
  const { mutate: patchTask } = useUpdateTaskMutation();
  const { mutate: createTask } = useCreateTaskMutation();
  const { mutate: removeTask } = useDeleteTaskMutation();
  const { mutate: submitTask } = useSubmitTaskMutation();

  const [filter, setFilter] = React.useState<"all" | TaskStatus>("all");
  const [newTaskTitle, setNewTaskTitle] = React.useState("");
  const [newTaskDate, setNewTaskDate] = React.useState<Date | undefined>();
  const [subtaskDrafts, setSubtaskDrafts] = React.useState<Record<string, string>>({});

  const openPersonalCount = personalTasks.filter((t) => t.status === "todo").length;

  const handleAddPersonalTask = (e: React.FormEvent) => {
    e.preventDefault();
    const v = newTaskTitle.trim();
    if (!v) return;
    createTask({
      title: v,
      dueDate: newTaskDate ? toDateOnlyString(newTaskDate) : undefined,
    });
    setNewTaskTitle("");
    setNewTaskDate(undefined);
  };

  const togglePersonalDone = (task: Task) => {
    const next: TaskStatus = task.status === "done" ? "todo" : "done";
    updateTaskStatus({ id: task.id, status: next });
  };

  const setPersonalDueDate = (taskId: string, d: Date | undefined) => {
    patchTask({
      id: taskId,
      input: { dueDate: d ? toDateOnlyString(d) : "" },
    });
  };

  const addSubtask = (parentId: string) => {
    const title = (subtaskDrafts[parentId] ?? "").trim();
    if (!title) return;
    createTask({ title, parentTaskId: parentId });
    setSubtaskDrafts((prev) => ({ ...prev, [parentId]: "" }));
  };

  const myTasks = groupTasks.filter((t) => filter === "all" || t.status === filter);

  if (personalLoading || groupTasksLoading || groupsLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading tasks...</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">My tasks</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything assigned to you across your groups.
        </p>
      </div>

      <section className="mb-8 rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground">
              <ListTodo className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold">Personal tasks</h2>
              <p className="text-xs text-muted-foreground">
                Saved to your account · {openPersonalCount} open
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleAddPersonalTask} className="mb-3 flex flex-wrap gap-2">
          <input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Add a personal task and press Enter"
            className="min-w-[200px] flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium hover:border-primary",
                  !newTaskDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                {newTaskDate
                  ? newTaskDate.toLocaleDateString("en", { month: "short", day: "numeric" })
                  : "Deadline"}
                {newTaskDate && (
                  <X
                    className="h-3 w-3 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setNewTaskDate(undefined);
                    }}
                  />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={newTaskDate}
                onSelect={setNewTaskDate}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          <button
            type="submit"
            className="flex items-center gap-1 rounded-md bg-gradient-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </form>

        <ul className="space-y-3">
          {personalTasks.map((task) => {
            const isDone = task.status === "done";
            const due = task.dueDate ? new Date(task.dueDate) : null;
            const { overdue, dueToday } = dueMeta(due, isDone);
            const subtasks = [...(task.subtasks ?? [])].sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            );

            return (
              <li key={task.id} className="rounded-md border border-border bg-background/40 p-2">
                <div className="group flex items-center gap-2 rounded-md border border-transparent p-2 hover:border-border hover:bg-accent/40">
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => togglePersonalDone(task)}
                    className="h-4 w-4 shrink-0 accent-primary"
                  />
                  <span
                    className={cn(
                      "flex-1 text-sm",
                      isDone ? "text-muted-foreground line-through" : "text-foreground",
                    )}
                  >
                    {task.title}
                  </span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors",
                          !due &&
                            "text-muted-foreground opacity-0 hover:bg-accent group-hover:opacity-100",
                          due &&
                            !overdue &&
                            !dueToday &&
                            "bg-muted text-muted-foreground hover:bg-accent",
                          dueToday && "bg-warning/15 text-warning",
                          overdue && "bg-destructive/15 text-destructive",
                        )}
                      >
                        <CalendarIcon className="h-3 w-3" />
                        {due
                          ? due.toLocaleDateString("en", { month: "short", day: "numeric" })
                          : "Set date"}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={due ?? undefined}
                        onSelect={(d) => setPersonalDueDate(task.id, d)}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                      {due && (
                        <div className="border-t border-border p-2">
                          <button
                            type="button"
                            onClick={() => setPersonalDueDate(task.id, undefined)}
                            className="w-full rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-destructive"
                          >
                            Clear date
                          </button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                  <button
                    type="button"
                    onClick={() => removeTask(task.id)}
                    className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mt-2 ml-7 space-y-1 border-l border-border pl-3">
                    {subtasks.map((st) => {
                      const stDone = st.status === "done";
                      return (
                        <div
                          key={st.id}
                          className="group/sub flex items-center gap-2 rounded-md py-1 pr-1 hover:bg-accent/30"
                        >
                          <input
                            type="checkbox"
                            checked={stDone}
                            onChange={() => togglePersonalDone(st)}
                            className="h-3.5 w-3.5 shrink-0 accent-primary"
                          />
                          <span
                            className={cn(
                              "flex-1 text-xs",
                              stDone ? "text-muted-foreground line-through" : "text-foreground",
                            )}
                          >
                            {st.title}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeTask(st.id)}
                            className="rounded p-0.5 text-muted-foreground opacity-0 hover:text-destructive group-hover/sub:opacity-100"
                            aria-label="Delete subtask"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                    <form
                      className="flex gap-1 pt-1"
                      onSubmit={(e) => {
                        e.preventDefault();
                        addSubtask(task.id);
                      }}
                    >
                      <input
                        value={subtaskDrafts[task.id] ?? ""}
                        onChange={(e) =>
                          setSubtaskDrafts((prev) => ({ ...prev, [task.id]: e.target.value }))
                        }
                        placeholder="Add subtask…"
                        className="min-w-0 flex-1 rounded border border-dashed border-border bg-transparent px-2 py-1 text-xs outline-none focus:border-primary"
                      />
                      <button
                        type="submit"
                        className="shrink-0 rounded border border-border px-2 py-1 text-[10px] font-medium hover:bg-accent"
                      >
                        Add
                      </button>
                    </form>
                  </div>
              </li>
            );
          })}
          {personalTasks.length === 0 && (
            <li className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              No personal tasks yet. Add one above.
            </li>
          )}
        </ul>
      </section>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Group tasks
        </h2>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              filter === f.id
                ? "border-primary bg-primary/15 text-primary-glow"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {myTasks.map((t) => {
          const g = groups.find((gr) => gr.id === t.groupId);
          return (
            <div key={t.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {t.groupId ? (
                      <Link
                        to="/groups/$groupId"
                        params={{ groupId: t.groupId }}
                        className="text-[10px] font-bold uppercase tracking-wider text-primary-glow hover:underline"
                      >
                        {g?.name}
                      </Link>
                    ) : null}
                    {t.groupId ? <ChevronRight className="h-3 w-3 text-muted-foreground" /> : null}
                    <span
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase",
                        t.status === "done" && "bg-success/15 text-success",
                        t.status === "in_progress" && "bg-info/15 text-info",
                        t.status === "pending_review" && "bg-warning/15 text-warning",
                        t.status === "failed" && "bg-destructive/15 text-destructive",
                        t.status === "todo" && "bg-muted text-muted-foreground",
                      )}
                    >
                      {t.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <h3 className="mt-2 font-semibold">{t.title}</h3>
                  {t.description ? (
                    <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
                  ) : null}
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Due
                  </div>
                  <div className="text-sm font-bold">
                    {t.dueDate
                      ? new Date(t.dueDate).toLocaleDateString("en", {
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </div>
                </div>
              </div>

              {t.status !== "done" && (
                <div className="mt-3 flex justify-end gap-2">
                  {t.status === "todo" && (
                    <button
                      type="button"
                      onClick={() => updateTaskStatus({ id: t.id, status: "in_progress" })}
                      className="rounded-md border border-info/40 bg-info/10 px-3 py-1 text-[11px] font-medium text-info hover:bg-info/20"
                    >
                      Start working
                    </button>
                  )}
                  {t.status === "in_progress" && (
                    <>
                      <button
                        type="button"
                        onClick={() => submitTask(t.id)}
                        className="rounded-md border border-warning/40 bg-warning/10 px-3 py-1 text-[11px] font-medium text-warning hover:bg-warning/20"
                      >
                        Submit for review
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {myTasks.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center text-sm text-muted-foreground">
            No tasks match this filter.
          </div>
        )}
      </div>
    </AppShell>
  );
}
