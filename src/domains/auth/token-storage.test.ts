import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  STORAGE_KEYS,
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  authHeaders,
} from "./token-storage";

describe("token-storage", () => {
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        store = {};
      },
      key: () => null,
      length: 0,
    });
  });

  it("setTokens persists access and refresh", () => {
    setTokens("a", "r");
    expect(store[STORAGE_KEYS.access]).toBe("a");
    expect(store[STORAGE_KEYS.refresh]).toBe("r");
    expect(getAccessToken()).toBe("a");
    expect(getRefreshToken()).toBe("r");
  });

  it("clearTokens removes both", () => {
    setTokens("a", "r");
    clearTokens();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it("authHeaders adds Bearer when token present", () => {
    setTokens("tok", "ref");
    expect(authHeaders()).toEqual({ Authorization: "Bearer tok" });
  });

  it("authHeaders omits Authorization without token", () => {
    clearTokens();
    expect(authHeaders()).toEqual({});
  });
});
