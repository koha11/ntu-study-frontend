/**
 * Auth Domain - Type Definitions
 *
 * Defines authentication-related types.
 */

import type { UserRole } from "@/common/enums/user-role.enum";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  notificationEnabled: boolean;
  preferredLanguage: "en" | "vi";
  canvaConnected: boolean;
  /** Manual Drive quota cap in bytes (decimal string). Undefined/null when unset. */
  driveTotalQuotaBytes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUser extends User {
  email: string;
  emailVerified: boolean;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface UpdateProfileInput {
  name?: string;
  avatar?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
