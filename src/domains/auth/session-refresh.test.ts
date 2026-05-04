import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { STORAGE_KEYS, setTokens } from "./token-storage";

describe("refreshSessionLocked", () => {
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

    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000");
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "cid");
    vi.stubEnv(
      "VITE_GOOGLE_REDIRECT_URI",
      "http://localhost:5173/login/callback",
    );

    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              access_token: "new-access",
              refresh_token: "new-refresh",
            }),
        }),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("deduplicates concurrent refresh calls into one fetch", async () => {
    setTokens("old-access", "old-refresh");
    const { refreshSessionLocked } = await import("./session-refresh");

    const a = refreshSessionLocked();
    const b = refreshSessionLocked();
    await Promise.all([a, b]);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(store[STORAGE_KEYS.access]).toBe("new-access");
    expect(store[STORAGE_KEYS.refresh]).toBe("new-refresh");
  });

  it("clears tokens when refresh fails", async () => {
    setTokens("old-access", "old-refresh");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: () => Promise.resolve(""),
      }),
    );

    const { refreshSessionLocked } = await import("./session-refresh");

    await expect(refreshSessionLocked()).rejects.toThrow();
    expect(store[STORAGE_KEYS.access]).toBeUndefined();
    expect(store[STORAGE_KEYS.refresh]).toBeUndefined();
  });
});
