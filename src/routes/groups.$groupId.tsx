import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useTranslation } from "react-i18next";
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
  "flashcards",
]);

const groupDetailSearchSchema = z.object({
  tab: groupDetailTabSchema.optional(),
});

function GroupNotFound() {
  const { t } = useTranslation();
  return (
    <AppShell>
      <div className="rounded-2xl border border-border bg-card p-12 text-center">
        <h2 className="text-xl font-semibold">{t("groups.groupNotFound")}</h2>
        <Link to="/groups" className="mt-3 inline-block text-sm text-primary-glow">
          {t("groups.backToGroups")}
        </Link>
      </div>
    </AppShell>
  );
}

export const Route = createFileRoute("/groups/$groupId")({
  beforeLoad: requireSession,
  validateSearch: (search) => groupDetailSearchSchema.parse(search ?? {}),
  component: GroupDetailPage,
  notFoundComponent: GroupNotFound,
});
