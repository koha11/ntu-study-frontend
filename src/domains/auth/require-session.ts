import { redirect } from "@tanstack/react-router";
import type { ParsedLocation } from "@tanstack/react-router";
import { getAccessToken } from "./token-storage";

/** Use as route `beforeLoad: requireSession` — receives router context automatically. */
export function requireSession({ location }: { location: ParsedLocation }): void {
  if (!getAccessToken()) {
    throw redirect({
      to: "/login",
      search: { redirect: location.href },
    });
  }
}
