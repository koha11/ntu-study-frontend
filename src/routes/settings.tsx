import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { requireSession } from "@/domains/auth";
import { SettingsPage } from "@/domains/settings/components/SettingsPage";

export const Route = createFileRoute("/settings")({
  beforeLoad: requireSession,
  component: () => (
    <AppShell>
      <SettingsPage />
    </AppShell>
  ),
});
