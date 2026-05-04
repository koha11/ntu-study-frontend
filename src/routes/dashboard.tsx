import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/domains/dashboard";
import { requireDashboard } from "@/domains/auth";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: ({ location }) => requireDashboard({ location }),
  component: DashboardPage,
});
