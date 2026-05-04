import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchDriveQuota, refreshDriveQuota } from "./drive-quota-api";
import { HttpError } from "@/domains/auth/auth-api";

describe("drive-quota-api", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("calls GET /drive/me/quota with Authorization header", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          total_bytes: "16000000000000",
          used_bytes: "12400000000000",
          quota_last_updated: "2026-05-01T12:00:00.000Z",
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const out = await fetchDriveQuota("tok");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/drive/me/quota");
    expect(init.method).toBe("GET");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer tok",
    );
    expect(out.total_bytes).toBe("16000000000000");
    expect(out.used_bytes).toBe("12400000000000");
  });

  it("calls POST /drive/me/quota/refresh with Authorization header", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          total_bytes: "100",
          used_bytes: "50",
          quota_last_updated: null,
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await refreshDriveQuota("tok");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/drive/me/quota/refresh");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer tok",
    );
  });

  it("throws HttpError on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        text: () => Promise.resolve("no drive"),
      }),
    );

    await expect(fetchDriveQuota("tok")).rejects.toThrow(HttpError);
  });
});
