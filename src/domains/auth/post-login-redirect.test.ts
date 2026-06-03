import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  POST_LOGIN_REDIRECT_KEY,
  storePostLoginRedirect,
  peekPostLoginRedirect,
  consumePostLoginRedirect,
  normalizeSafeAppPath,
  navigateAfterLogin,
} from "./post-login-redirect";

describe("post-login-redirect", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("storePostLoginRedirect", () => {
    it("stores the path in sessionStorage", () => {
      storePostLoginRedirect("/dashboard?tab=overview");
      expect(sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY)).toBe("/dashboard?tab=overview");
    });
  });

  describe("peekPostLoginRedirect", () => {
    it("returns null when nothing is stored", () => {
      expect(peekPostLoginRedirect()).toBeNull();
    });

    it("returns the stored path without removing it", () => {
      storePostLoginRedirect("/groups/123");
      expect(peekPostLoginRedirect()).toBe("/groups/123");
      expect(sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY)).toBe("/groups/123");
    });
  });

  describe("consumePostLoginRedirect", () => {
    it("returns null when nothing is stored", () => {
      expect(consumePostLoginRedirect()).toBeNull();
    });

    it("returns the stored value and removes it", () => {
      storePostLoginRedirect("/tasks");
      const result = consumePostLoginRedirect();
      expect(result).toBe("/tasks");
      expect(sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY)).toBeNull();
    });
  });

  describe("normalizeSafeAppPath", () => {
    it("returns null for undefined input", () => {
      expect(normalizeSafeAppPath(undefined)).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(normalizeSafeAppPath("")).toBeNull();
    });

    it("returns null for whitespace-only string", () => {
      expect(normalizeSafeAppPath("   ")).toBeNull();
    });

    it("returns null for /login paths (loop prevention)", () => {
      expect(normalizeSafeAppPath("/login")).toBeNull();
      expect(normalizeSafeAppPath("/login/callback")).toBeNull();
    });

    it("returns the path for a valid same-origin path", () => {
      const result = normalizeSafeAppPath("/dashboard");
      expect(result).toBe("/dashboard");
    });

    it("preserves query string and hash", () => {
      const result = normalizeSafeAppPath("/groups/abc?tab=members#section");
      expect(result).toBe("/groups/abc?tab=members#section");
    });

    it("returns null for external URLs (cross-origin)", () => {
      expect(normalizeSafeAppPath("https://evil.com/path")).toBeNull();
    });

    it("returns null for paths starting with //", () => {
      expect(normalizeSafeAppPath("//evil.com")).toBeNull();
    });

    it("decodes percent-encoded paths", () => {
      const result = normalizeSafeAppPath("/groups%2F123");
      expect(result).toBe("/groups/123");
    });

    it("returns null for malformed percent-encoding", () => {
      expect(normalizeSafeAppPath("%zz")).toBeNull();
    });
  });

  describe("navigateAfterLogin", () => {
    it("navigates to /dashboard when no redirect is stored", () => {
      const replaceSpy = vi.spyOn(window.location, "replace").mockImplementation(() => undefined);
      navigateAfterLogin();
      expect(replaceSpy).toHaveBeenCalledWith("/dashboard");
    });

    it("navigates to stored safe path after consuming it", () => {
      const replaceSpy = vi.spyOn(window.location, "replace").mockImplementation(() => undefined);
      storePostLoginRedirect("/tasks");
      navigateAfterLogin();
      expect(replaceSpy).toHaveBeenCalledWith("/tasks");
      expect(sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY)).toBeNull();
    });

    it("falls back to /dashboard when stored path is a login URL", () => {
      const replaceSpy = vi.spyOn(window.location, "replace").mockImplementation(() => undefined);
      storePostLoginRedirect("/login");
      navigateAfterLogin();
      expect(replaceSpy).toHaveBeenCalledWith("/dashboard");
    });
  });
});
