import { redirect } from "@tanstack/react-router";
import type { ParsedLocation } from "@tanstack/react-router";
import { queryClient } from "@/app/providers";
import { getAccessToken } from "./token-storage";
import { currentUserQueryOptions } from "./queries";
import { UserRole } from "@/common/enums/user-role.enum";

/**
 * Use on `/dashboard`: requires login; admins are redirected to the admin console.
 */
export async function requireDashboard(opts: { location: ParsedLocation }): Promise<void> {
  if (!getAccessToken()) {
    throw redirect({
      to: "/login",
      search: { redirect: opts.location.href },
    });
  }
  const user = await queryClient.ensureQueryData(currentUserQueryOptions());
  if (user.role === UserRole.ADMIN) {
    throw redirect({ to: "/admin" });
  }
}
