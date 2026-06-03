import { createFileRoute } from "@tanstack/react-router";
import { TermsPage } from "@/domains/legal";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
});
