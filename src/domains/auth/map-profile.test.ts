import { describe, it, expect } from "vitest";
import { mapProfileToUser } from "./map-profile";
import type { UserProfileResponse } from "./auth-api";
import { UserRole } from "@/common/enums/user-role.enum";

describe("mapProfileToUser", () => {
  const base: UserProfileResponse = {
    id: "u1",
    email: "a@b.com",
    full_name: "Alice",
    avatar_url: "https://ex/a.png",
    role: "user",
    notification_enabled: true,
    canva_connected: false,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-02T00:00:00.000Z",
  };

  it("maps notification and Canva flags", () => {
    const u = mapProfileToUser({
      ...base,
      notification_enabled: false,
      canva_connected: true,
    });
    expect(u.notificationEnabled).toBe(false);
    expect(u.canvaConnected).toBe(true);
    expect(u.name).toBe("Alice");
    expect(u.email).toBe("a@b.com");
    expect(u.role).toBe(UserRole.USER);
  });

  it("maps manual Drive quota limit bytes", () => {
    const u = mapProfileToUser({
      ...base,
      drive_total_quota: "17179869184",
    });
    expect(u.driveTotalQuotaBytes).toBe("17179869184");
  });
});
