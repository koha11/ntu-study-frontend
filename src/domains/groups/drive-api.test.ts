import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createGroupFolder,
  fetchGroupAssets,
  fetchGroupDriveActivity,
  fetchGroupDriveFileBlob,
  uploadToGroupFolder,
} from "./drive-api";
import { HttpError } from "@/domains/auth/auth-api";

describe("drive-api", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("calls GET /drive/groups/:groupId/assets with Authorization header", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    });
    vi.stubGlobal("fetch", fetchMock);

    await fetchGroupAssets("g1", "tok");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/drive/groups/g1/assets");
    expect(init.method).toBe("GET");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer tok",
    );
  });

  it("appends folderId query param when provided", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    });
    vi.stubGlobal("fetch", fetchMock);

    await fetchGroupAssets("g1", "tok", "sub-id");

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "http://localhost:3000/drive/groups/g1/assets?folderId=sub-id",
    );
  });

  it("throws HttpError on non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Unauthorized"),
      }),
    );

    await expect(fetchGroupAssets("g1", "tok")).rejects.toThrow(HttpError);
  });

  it("calls POST /drive/groups/:groupId/folders with JSON body", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: () =>
        Promise.resolve({
          id: "nf",
          name: "New",
          webViewLink: "https://drive.google.com/...",
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await createGroupFolder("g1", "tok", {
      name: "New",
      parentFolderId: "p1",
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/drive/groups/g1/folders");
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer tok");
    expect(headers["Content-Type"]).toBe("application/json");
    expect(init.body).toBe(
      JSON.stringify({ name: "New", parentFolderId: "p1" }),
    );
  });

  it("posts multipart upload with FormData and optional parentFolderId", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ id: "up", name: "f.txt" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const file = new File(["x"], "f.txt", { type: "text/plain" });
    await uploadToGroupFolder("g1", "tok", file, "parent-id");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/drive/groups/g1/uploads");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer tok",
    );
    expect(init.body).toBeInstanceOf(FormData);
    const fd = init.body as FormData;
    expect(fd.get("file")).toBe(file);
    expect(fd.get("parentFolderId")).toBe("parent-id");
  });

  it("GET file content URL-encodes fileId", async () => {
    const blob = new Blob(["hi"]);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      blob: () => Promise.resolve(blob),
      headers: {
        get: (k: string) => (k.toLowerCase() === "content-type" ? "application/pdf" : null),
      },
    });
    vi.stubGlobal("fetch", fetchMock);

    const out = await fetchGroupDriveFileBlob("g1", "tok", "id/with?chars");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/drive/groups/g1/files/id%2Fwith%3Fchars/content",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer tok",
        }),
      }),
    );
    expect(out.blob).toBe(blob);
    expect(out.contentType).toBe("application/pdf");
  });

  it("calls GET /drive/groups/:groupId/activity with optional query params", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          items: [
            {
              occurredAt: "2024-01-01T00:00:00.000Z",
              actorLabel: "A",
              fileName: "f.txt",
              action: "Edited",
            },
          ],
          nextPageToken: "t2",
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await fetchGroupDriveActivity("g1", "tok", {
      pageToken: "t1",
      pageSize: 10,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "http://localhost:3000/drive/groups/g1/activity?pageToken=t1&pageSize=10",
    );
    expect(init.method).toBe("GET");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer tok",
    );
    expect(res.items).toHaveLength(1);
    expect(res.nextPageToken).toBe("t2");
  });

  it("fetchGroupDriveFileBlob throws HttpError on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: () => Promise.resolve("nope"),
      }),
    );

    await expect(
      fetchGroupDriveFileBlob("g1", "tok", "fid"),
    ).rejects.toThrow(HttpError);
  });
});
