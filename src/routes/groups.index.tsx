import { createFileRoute } from "@tanstack/react-router";
import { GroupsListPage } from "@/domains/groups";
import { requireSession } from "@/domains/auth";

export const Route = createFileRoute("/groups/")({
  beforeLoad: requireSession,
  component: GroupsListPage,
});
