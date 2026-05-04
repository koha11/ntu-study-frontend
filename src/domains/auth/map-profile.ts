import type { User } from "./types";
import type { UserProfileResponse } from "./auth-api";
import { UserRole } from "@/common/enums/user-role.enum";

function mapRole(role: string): UserRole {
  if (role === UserRole.LEADER) return UserRole.LEADER;
  if (role === UserRole.ADMIN) return UserRole.ADMIN;
  return UserRole.USER;
}

export function mapProfileToUser(p: UserProfileResponse): User {
  return {
    id: p.id,
    email: p.email,
    name: p.full_name,
    avatar: p.avatar_url ?? undefined,
    role: mapRole(p.role),
    notificationEnabled: p.notification_enabled,
    canvaConnected: p.canva_connected,
    driveTotalQuotaBytes: p.drive_total_quota ?? null,
    createdAt: new Date(p.created_at),
    updatedAt: new Date(p.updated_at),
  };
}
