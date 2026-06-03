import { createFileRoute } from "@tanstack/react-router";
import { PrivacyPage } from "@/domains/legal";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});
