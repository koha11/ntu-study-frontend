import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserRole } from "@/common/enums/user-role.enum";

const ensureQueryData = vi.fn();

vi.mock("@/app/providers", () => ({
  queryClient: {
    ensureQueryData: (...args: unknown[]) => ensureQueryData(...args),
  },
}));

vi.mock("./token-storage", () => ({
  getAccessToken: vi.fn(() => "tok"),
}));

vi.mock("./queries", () => ({
  currentUserQueryOptions: vi.fn(() => ({})),
}));

import { requireAdmin } from "./require-admin";

describe("requireAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves when user is admin", async () => {
    ensureQueryData.mockResolvedValue({ role: UserRole.ADMIN });
    await expect(
      requireAdmin({ location: { href: "/admin" } } as never),
    ).resolves.toBeUndefined();
  });

  it("redirects when user is not admin", async () => {
    ensureQueryData.mockResolvedValue({ role: UserRole.USER });
    try {
      await requireAdmin({ location: { href: "/admin" } } as never);
      expect.fail("expected redirect");
    } catch (e: unknown) {
      const opts = (e as { options?: { to?: string } }).options;
      expect(opts?.to).toBe("/dashboard");
    }
  });
});
