import { createFileRoute } from "@tanstack/react-router";
import { NotificationsPage } from "@/domains/notifications";
import { requireSession } from "@/domains/auth";

export const Route = createFileRoute("/notifications")({
  beforeLoad: requireSession,
  component: NotificationsPage,
});
