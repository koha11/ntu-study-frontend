import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

/**
 * Layout parent for invitation links only (`/invitations/$token/accept`).
 * `/invitations` alone redirects to the dashboard (not in the sidebar).
 */
export const Route = createFileRoute("/invitations")({
  beforeLoad: ({ location }) => {
    const path = location.pathname.replace(/\/$/, "");
    if (path === "/invitations") {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: () => <Outlet />,
});
