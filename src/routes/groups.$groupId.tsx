import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { z } from "zod";
import { GroupDetailPage } from "@/domains/groups";
import { AppShell } from "@/components/AppShell";
import { requireSession } from "@/domains/auth";

const groupDetailTabSchema = z.enum([
  "overview",
  "tasks",
  "drive",
  "canva",
  "calendar",
  "members",
  "contribution",
]);

const groupDetailSearchSchema = z.object({
  tab: groupDetailTabSchema.optional(),
});

export const Route = createFileRoute("/groups/$groupId")({
  beforeLoad: requireSession,
  validateSearch: (search) => groupDetailSearchSchema.parse(search ?? {}),
  component: GroupDetailPage,
  notFoundComponent: () => (
    <AppShell>
      <div className="rounded-2xl border border-border bg-card p-12 text-center">
        <h2 className="text-xl font-semibold">Group not found</h2>
        <Link to="/groups" className="mt-3 inline-block text-sm text-primary-glow">
          ← Back to groups
        </Link>
      </div>
    </AppShell>
  ),
});
