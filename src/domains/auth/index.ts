/**
 * Auth Domain - Public API
 *
 * Manages user authentication, login, logout, and auth state.
 */

export { useCurrentUser } from "./hooks/useCurrentUser";
export { useLogin } from "./hooks/useLogin";
export { useLogout } from "./hooks/useLogout";
export { useRegister } from "./hooks/useRegister";
export { useChangePassword } from "./hooks/useChangePassword";
export { usePatchProfile } from "./hooks/usePatchProfile";
export { useSyncGoogleProfile } from "./hooks/useSyncGoogleProfile";
export { startGoogleLogin } from "./start-google-login";
export { requireSession } from "./require-session";
export { requireAdmin } from "./require-admin";
export { requireDashboard } from "./require-dashboard";

export type { User } from "./types";
