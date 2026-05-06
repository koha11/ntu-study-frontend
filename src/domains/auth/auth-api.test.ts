import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  buildGoogleCallbackPostUrl,
  normalizeApiBase,
  buildGoogleAuthorizeUrl,
  fetchCurrentUser,
  patchCurrentUser,
  startCanvaOAuth,
  HttpError,
} from "./auth-api";

describe("auth-api helpers", () => {
  it("normalizeApiBase strips trailing slashes", () => {
    expect(normalizeApiBase("http://localhost:3000/")).toBe(
      "http://localhost:3000",
    );
  });

  it("buildGoogleCallbackPostUrl encodes query params", () => {
    const url = buildGoogleCallbackPostUrl(
      "http://localhost:3000",
      "auth-code",
      "verifier",
    );
    expect(url).toBe(
      "http://localhost:3000/auth/google/callback?code=auth-code&code_verifier=verifier",
    );
  });
});

describe("buildGoogleAuthorizeUrl", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000");
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "cid");
    vi.stubEnv(
      "VITE_GOOGLE_REDIRECT_URI",
      "http://localhost:5173/login/callback",
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("includes PKCE and required OAuth params", () => {
    const url = buildGoogleAuthorizeUrl({
      codeChallenge: "challenge",
      state: "state123",
    });
    expect(url.startsWith("https://accounts.google.com/o/oauth2/v2/auth?")).toBe(
      true,
    );
    const u = new URL(url);
    expect(u.searchParams.get("client_id")).toBe("cid");
    expect(u.searchParams.get("redirect_uri")).toBe(
      "http://localhost:5173/login/callback",
    );
    expect(u.searchParams.get("code_challenge")).toBe("challenge");
    expect(u.searchParams.get("code_challenge_method")).toBe("S256");
    expect(u.searchParams.get("state")).toBe("state123");
    expect(u.searchParams.get("response_type")).toBe("code");
  });

  it("includes Google contacts.readonly scope for People API", () => {
    const url = buildGoogleAuthorizeUrl({
      codeChallenge: "c",
      state: "s",
    });
    const scope = new URL(url).searchParams.get("scope") ?? "";
    expect(scope).toContain("https://www.googleapis.com/auth/contacts.readonly");
  });

  it("includes Google contacts.other.readonly for otherContacts search", () => {
    const url = buildGoogleAuthorizeUrl({
      codeChallenge: "c",
      state: "s",
    });
    const scope = new URL(url).searchParams.get("scope") ?? "";
    expect(scope).toContain("https://www.googleapis.com/auth/contacts.other.readonly");
  });

  it("includes Google calendar.events scope for Calendar / Meet", () => {
    const url = buildGoogleAuthorizeUrl({
      codeChallenge: "c",
      state: "s",
    });
    const scope = new URL(url).searchParams.get("scope") ?? "";
    expect(scope).toContain("https://www.googleapis.com/auth/calendar.events");
  });

  it("includes Google calendar.calendars scope for creating secondary calendars", () => {
    const url = buildGoogleAuthorizeUrl({
      codeChallenge: "c",
      state: "s",
    });
    const scope = new URL(url).searchParams.get("scope") ?? "";
    expect(scope).toContain("https://www.googleapis.com/auth/calendar.calendars");
  });

  it("includes drive.activity.readonly for Drive Activity API (group folder log)", () => {
    const url = buildGoogleAuthorizeUrl({
      codeChallenge: "c",
      state: "s",
    });
    const scope = new URL(url).searchParams.get("scope") ?? "";
    expect(scope).toContain(
      "https://www.googleapis.com/auth/drive.activity.readonly",
    );
  });

  it("adds hd when VITE_GOOGLE_HD is set", () => {
    vi.stubEnv("VITE_GOOGLE_HD", "ntu.edu.sg");
    const url = buildGoogleAuthorizeUrl({
      codeChallenge: "c",
      state: "s",
    });
    expect(new URL(url).searchParams.get("hd")).toBe("ntu.edu.sg");
  });
});

describe("fetchCurrentUser", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000");
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "cid");
    vi.stubEnv(
      "VITE_GOOGLE_REDIRECT_URI",
      "http://localhost:5173/login/callback",
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("throws HttpError with response status when not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: () => Promise.resolve(""),
      }),
    );

    try {
      await fetchCurrentUser("access-token");
      expect.fail("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(HttpError);
      expect((e as HttpError).status).toBe(401);
    }
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("returns JSON on success", async () => {
    const profile = {
      id: "u1",
      email: "e@x.com",
      full_name: "N",
      avatar_url: null,
      role: "user",
      notification_enabled: true,
      canva_connected: false,
      created_at: "",
      updated_at: "",
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(profile),
      }),
    );

    await expect(fetchCurrentUser("t")).resolves.toEqual(profile);
  });
});

describe("patchCurrentUser", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000");
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "cid");
    vi.stubEnv(
      "VITE_GOOGLE_REDIRECT_URI",
      "http://localhost:5173/login/callback",
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("calls PATCH /users/me with JSON body", async () => {
    const updated = {
      id: "u1",
      email: "e@x.com",
      full_name: "N",
      avatar_url: null,
      role: "user",
      notification_enabled: false,
      canva_connected: true,
      created_at: "",
      updated_at: "",
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(updated),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      patchCurrentUser("tok", { notification_enabled: false }),
    ).resolves.toEqual(updated);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/users/me");
    expect(init.method).toBe("PATCH");
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe(
      "application/json",
    );
    expect(init.body).toBe(JSON.stringify({ notification_enabled: false }));
  });

  it("throws HttpError when not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        text: () => Promise.resolve(""),
      }),
    );

    await expect(
      patchCurrentUser("t", { notification_enabled: true }),
    ).rejects.toBeInstanceOf(HttpError);
  });
});

describe("startCanvaOAuth", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000");
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "cid");
    vi.stubEnv(
      "VITE_GOOGLE_REDIRECT_URI",
      "http://localhost:5173/login/callback",
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("POSTs /auth/canva/start with Bearer token", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          authorizeUrl: "https://www.canva.com/api/oauth/authorize?x=1",
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(startCanvaOAuth("access")).resolves.toEqual({
      authorizeUrl: "https://www.canva.com/api/oauth/authorize?x=1",
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/auth/canva/start");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer access",
    );
  });

  it("throws HttpError when not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: () => Promise.resolve(""),
      }),
    );

    await expect(startCanvaOAuth("t")).rejects.toBeInstanceOf(HttpError);
  });
});
