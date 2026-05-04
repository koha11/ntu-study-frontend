import { createFileRoute } from "@tanstack/react-router";
import { AcceptInvitationPage } from "@/domains/invitations";

export const Route = createFileRoute("/invitations/$token/accept")({
  component: AcceptInvitationPage,
});
