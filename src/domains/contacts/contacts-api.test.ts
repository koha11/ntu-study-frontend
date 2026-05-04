import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchContactSuggestions } from "./contacts-api";
import { HttpError } from "@/domains/auth/auth-api";

describe("fetchContactSuggestions", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("calls GET /contacts/suggestions with q and Authorization", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve([
          { email: "a@b.com", display_name: "A", photo_url: null },
        ]),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchContactSuggestions("jwt", "foo");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/contacts/suggestions?q=foo");
    expect(init.method).toBe("GET");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer jwt");
    expect(result).toEqual([
      { email: "a@b.com", display_name: "A", photo_url: null },
    ]);
  });

  it("encodes query parameters", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      }),
    );

    await fetchContactSuggestions("t", "a b@c");

    const url = (vi.mocked(fetch).mock.calls[0] as [string])[0];
    expect(url).toContain("q=a+b%40c");
  });

  it("throws HttpError when not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        text: () => Promise.resolve("no contacts"),
      }),
    );

    await expect(fetchContactSuggestions("t", "x")).rejects.toMatchObject({
      status: 403,
    });
    await expect(fetchContactSuggestions("t", "x")).rejects.toBeInstanceOf(HttpError);
  });
});
