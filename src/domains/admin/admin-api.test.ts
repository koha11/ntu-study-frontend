import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { HttpError } from "@/domains/auth/auth-api";
import {
  deleteAdminGroup,
  fetchAdminDashboard,
  fetchAdminUsers,
  runAdminCronJob,
} from "./admin-api";

describe("admin-api", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_BASE_URL", "https://api.example.com");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("fetchAdminUsers builds query string and sends bearer token", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ users: [], total: 0 })),
    });
    vi.stubGlobal("fetch", fetchMock);

    await fetchAdminUsers("tok", { skip: 0, take: 20, q: "a@b" });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/admin/users?");
    expect(url).toContain("q=a%40b");
    expect((init.headers as Record<string, string>)?.Authorization).toBe("Bearer tok");
  });

  it("fetchAdminDashboard uses GET /admin/dashboard", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            totals: { users: 1, groups: 1, tasks: 1 },
            cron_jobs_last_7_days: [],
            recent_cron_runs: [],
          }),
        ),
    });
    vi.stubGlobal("fetch", fetchMock);

    await fetchAdminDashboard("tok");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url.endsWith("/admin/dashboard")).toBe(true);
    expect((init.headers as Record<string, string>)?.Authorization).toBe("Bearer tok");
  });

  it("deleteAdminGroup issues DELETE and void success", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(""),
    });
    vi.stubGlobal("fetch", fetchMock);

    await deleteAdminGroup("tok", "g1");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/admin/groups/g1");
    expect(init.method).toBe("DELETE");
  });

  it("runAdminCronJob posts to cron-jobs slug run", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(""),
    });
    vi.stubGlobal("fetch", fetchMock);

    await runAdminCronJob("tok", "overdue-task-reminders");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/admin/cron-jobs/overdue-task-reminders/run");
    expect(init.method).toBe("POST");
  });

  it("throws HttpError on failed JSON response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: () => Promise.resolve("no"),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchAdminDashboard("tok")).rejects.toThrow(HttpError);
  });
});
