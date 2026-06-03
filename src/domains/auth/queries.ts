/**
 * Auth Domain - TanStack Query Configuration
 */

import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCurrentUser,
  logoutRequest,
  patchCurrentUser,
  syncGoogleProfile,
  HttpError,
  type PatchUserBody,
  type UserProfileResponse,
} from "./auth-api";
import { refreshSessionLocked } from "./session-refresh";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from "./token-storage";
import { mapProfileToUser } from "./map-profile";
import type { User, LoginInput, RegisterInput, ChangePasswordInput } from "./types";

async function syncGoogleProfileWithRefresh(): Promise<User> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const trySync = async (access: string) => {
    const profile = await syncGoogleProfile(access);
    return mapProfileToUser(profile);
  };

  try {
    return await trySync(token);
  } catch (err) {
    if (!(err instanceof HttpError) || err.status !== 401) {
      throw err;
    }
    try {
      await refreshSessionLocked();
    } catch {
      clearTokens();
      throw new Error("Not authenticated");
    }
    const newAccess = getAccessToken();
    if (!newAccess) {
      clearTokens();
      throw new Error("Not authenticated");
    }
    return await trySync(newAccess);
  }
}

async function patchCurrentUserProfile(body: PatchUserBody): Promise<User> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const tryPatch = async (access: string) => {
    const profile = await patchCurrentUser(access, body);
    return mapProfileToUser(profile);
  };

  try {
    return await tryPatch(token);
  } catch (err) {
    if (!(err instanceof HttpError) || err.status !== 401) {
      throw err;
    }
    try {
      await refreshSessionLocked();
    } catch {
      clearTokens();
      throw new Error("Not authenticated");
    }
    const newAccess = getAccessToken();
    if (!newAccess) {
      clearTokens();
      throw new Error("Not authenticated");
    }
    return await tryPatch(newAccess);
  }
}

async function loadCurrentUser(): Promise<User> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const tryProfile = async (access: string) => {
    const profile: UserProfileResponse = await fetchCurrentUser(access);
    return mapProfileToUser(profile);
  };

  try {
    return await tryProfile(token);
  } catch (err) {
    if (!(err instanceof HttpError) || err.status !== 401) {
      throw err;
    }
    try {
      await refreshSessionLocked();
    } catch {
      clearTokens();
      throw new Error("Not authenticated");
    }
    const newAccess = getAccessToken();
    if (!newAccess) {
      clearTokens();
      throw new Error("Not authenticated");
    }
    return await tryProfile(newAccess);
  }
}

/**
 * Query: Get current authenticated user
 */
export const currentUserQueryOptions = () =>
  queryOptions({
    queryKey: ["auth", "current-user"],
    queryFn: loadCurrentUser,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: false,
  });

/**
 * Mutation: Login (password) — not used with Google OAuth; kept for API compatibility.
 */
export const useLoginMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_input: LoginInput) => {
      throw new Error("Password login is not enabled. Use Google sign-in.");
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["auth", "current-user"], user);
    },
  });
};

/**
 * Mutation: Logout
 */
export const useLogoutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const access = getAccessToken();
      if (access) {
        await logoutRequest(access).catch(() => undefined);
      }
      clearTokens();
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["auth"] });
    },
  });
};

/**
 * Mutation: Register — placeholder when using Google-only auth.
 */
export const useRegisterMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_input: RegisterInput) => {
      throw new Error("Registration is via Google sign-in only.");
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["auth", "current-user"], user);
    },
  });
};

/**
 * Mutation: Change password
 */
export const useChangePasswordMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_input: ChangePasswordInput) => {
      throw new Error("Password change is not available for Google accounts.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "current-user"] });
    },
  });
};

/**
 * Mutation: PATCH /users/me (profile fields including notification_enabled)
 */
export const usePatchProfileMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: patchCurrentUserProfile,
    onSuccess: (user) => {
      queryClient.setQueryData(["auth", "current-user"], user);
      queryClient.invalidateQueries({ queryKey: ["drive-quota"] });
    },
  });
};

/**
 * Mutation: POST /users/me/google-profile/sync
 */
export const useSyncGoogleProfileMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncGoogleProfileWithRefresh,
    onSuccess: (user) => {
      queryClient.setQueryData(["auth", "current-user"], user);
      queryClient.invalidateQueries({ queryKey: ["drive-quota"] });
    },
  });
};
