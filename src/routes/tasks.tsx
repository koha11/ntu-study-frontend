import { createFileRoute } from "@tanstack/react-router";
import { TasksPage } from "@/domains/tasks";
import { requireSession } from "@/domains/auth";

export const Route = createFileRoute("/tasks")({
  beforeLoad: requireSession,
  component: TasksPage,
});
