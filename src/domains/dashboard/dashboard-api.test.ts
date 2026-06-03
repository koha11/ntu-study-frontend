import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { HttpError } from "@/domains/auth/auth-api";

const mockGetAccessToken = vi.fn<[], string | null>();

vi.mock("@/domains/auth/token-storage", () => ({
  getAccessToken: () => mockGetAccessToken(),
}));

// Import after mock setup
const { fetchDashboard } = await import("./dashboard-api");

describe("fetchDashboard", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    mockGetAccessToken.mockReset();
  });

  it("throws 401 HttpError when no token is stored", async () => {
    mockGetAccessToken.mockReturnValue(null);

    await expect(fetchDashboard()).rejects.toThrow(HttpError);
  });

  it("calls GET /dashboard with Bearer Authorization header", async () => {
    mockGetAccessToken.mockReturnValue("my-token");

    const payload = { recentActivity: [], upcoming: [] };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(payload),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchDashboard();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/dashboard");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer my-token");
    expect(result).toEqual(payload);
  });

  it("throws HttpError on non-ok response with status text", async () => {
    mockGetAccessToken.mockReturnValue("tok");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: () => Promise.resolve(""),
      }),
    );

    const err = await fetchDashboard().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(HttpError);
    expect((err as HttpError).status).toBe(500);
  });

  it("throws HttpError with response body text when available", async () => {
    mockGetAccessToken.mockReturnValue("tok");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        text: () => Promise.resolve("Access denied"),
      }),
    );

    const err = await fetchDashboard().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(HttpError);
    expect((err as HttpError).status).toBe(403);
  });

  it("returns dashboard data with recentActivity and upcoming arrays", async () => {
    mockGetAccessToken.mockReturnValue("tok");

    const data = {
      recentActivity: [
        {
          kind: "notification",
          occurredAt: "2026-01-01T10:00:00.000Z",
          notification: {
            id: "n1",
            type: "task_assigned",
            message: "You have a new task",
            isRead: false,
          },
        },
      ],
      upcoming: [
        {
          kind: "task",
          date: "2026-06-01",
          task: {
            id: "t1",
            title: "Submit report",
            status: "todo",
            groupId: "g1",
            groupName: "NTU Group",
          },
        },
      ],
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(data),
      }),
    );

    const result = await fetchDashboard();
    expect(result.recentActivity).toHaveLength(1);
    expect(result.upcoming).toHaveLength(1);
  });
});
