import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchUserGroups,
  fetchGroupDetails,
  createGroup,
  updateGroup,
  fetchGroupMembers,
  inviteMember,
  toggleMemberStatus,
  removeMember,
  createGroupMeetEvent,
  fetchGroupCalendarEvents,
  createGroupCalendarEvent,
} from "./groups-api";
import { HttpError } from "@/domains/auth/auth-api";

describe("groups-api", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  describe("fetchUserGroups", () => {
    it("calls GET /groups with Authorization header", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      });
      vi.stubGlobal("fetch", fetchMock);

      await fetchUserGroups("tok");

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("http://localhost:3000/groups");
      expect(init.method).toBe("GET");
      expect((init.headers as Record<string, string>).Authorization).toBe(
        "Bearer tok",
      );
    });

    it("throws HttpError when not ok", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 403,
          statusText: "Forbidden",
          text: () => Promise.resolve(""),
        }),
      );

      try {
        await fetchUserGroups("t");
        expect.fail("expected throw");
      } catch (e) {
        expect(e).toBeInstanceOf(HttpError);
        expect((e as HttpError).status).toBe(403);
      }
    });

    it("returns parsed JSON on success", async () => {
      const summaries = [
        {
          id: "g1",
          name: "G",
          member_count: 2,
          leader_id: "u1",
          created_at: "2026-01-01T00:00:00.000Z",
        },
      ];
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: () => Promise.resolve(summaries),
        }),
      );

      await expect(fetchUserGroups("t")).resolves.toEqual(summaries);
    });
  });

  describe("fetchGroupDetails", () => {
    it("calls GET /groups/:id", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            id: "g1",
            name: "N",
            description: "",
            tags: [],
            status: "active",
            leader_id: "u1",
            drive_folder_id: null,
            created_at: "",
          }),
      });
      vi.stubGlobal("fetch", fetchMock);

      await fetchGroupDetails("g1", "tok");

      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3000/groups/g1",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "Bearer tok",
          }),
        }),
      );
    });

    it("throws HttpError with status on failure", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 404,
          statusText: "Not Found",
          text: () => Promise.resolve(""),
        }),
      );

      await expect(fetchGroupDetails("x", "t")).rejects.toMatchObject({
        status: 404,
      });
    });
  });

  describe("createGroup", () => {
    it("calls POST /groups with JSON body", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: () =>
          Promise.resolve({
            id: "new",
            name: "N",
            description: "",
            tags: [],
            status: "active",
            leader_id: "u1",
            created_at: "",
          }),
      });
      vi.stubGlobal("fetch", fetchMock);

      await createGroup({ name: "N", tags: ["a"] }, "tok");

      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3000/groups",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer tok",
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({ name: "N", tags: ["a"] }),
        }),
      );
    });

    it("includes report_date in POST body when provided", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: () =>
          Promise.resolve({
            id: "new",
            name: "N",
            description: "",
            tags: [],
            status: "active",
            leader_id: "u1",
            created_at: "",
          }),
      });
      vi.stubGlobal("fetch", fetchMock);

      await createGroup(
        { name: "N", tags: [], report_date: "2026-08-01" },
        "tok",
      );

      expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toEqual({
        name: "N",
        tags: [],
        report_date: "2026-08-01",
      });
    });

    it("throws HttpError on 400", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 400,
          statusText: "Bad Request",
          text: () => Promise.resolve("{}"),
        }),
      );

      await expect(
        createGroup({ name: "" }, "t"),
      ).rejects.toMatchObject({ status: 400 });
    });
  });

  describe("updateGroup", () => {
    it("calls PATCH /groups/:id", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            id: "g1",
            name: "Up",
            description: "",
            tags: [],
            status: "active",
            leader_id: "u1",
            created_at: "",
          }),
      });
      vi.stubGlobal("fetch", fetchMock);

      await updateGroup("g1", { name: "Up" }, "tok");

      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3000/groups/g1",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ name: "Up" }),
        }),
      );
    });

    it("includes meet_link and report_date in PATCH body when provided", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            id: "g1",
            name: "G",
            description: "",
            tags: [],
            status: "active",
            leader_id: "u1",
            meet_link: "https://meet.google.com/abc-defg-hij",
            report_date: "2026-07-01",
            created_at: "",
          }),
      });
      vi.stubGlobal("fetch", fetchMock);

      await updateGroup(
        "g1",
        {
          meet_link: "https://meet.google.com/abc-defg-hij",
          report_date: "2026-07-01",
        },
        "tok",
      );

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(JSON.parse(init.body as string)).toEqual({
        meet_link: "https://meet.google.com/abc-defg-hij",
        report_date: "2026-07-01",
      });
    });

    it("includes canva_file_url and doc_file_url in PATCH body when provided", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            id: "g1",
            name: "G",
            tags: [],
            status: "active",
            leader_id: "u1",
            created_at: "",
          }),
      });
      vi.stubGlobal("fetch", fetchMock);

      await updateGroup(
        "g1",
        {
          canva_file_url: "https://www.canva.com/design/A/view",
          doc_file_url: "https://docs.google.com/document/d/x/edit",
        },
        "tok",
      );

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(JSON.parse(init.body as string)).toEqual({
        canva_file_url: "https://www.canva.com/design/A/view",
        doc_file_url: "https://docs.google.com/document/d/x/edit",
      });
    });

    it("includes null meet_link and report_date in PATCH body for clear", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            id: "g1",
            name: "G",
            tags: [],
            status: "active",
            leader_id: "u1",
            meet_link: null,
            report_date: null,
            created_at: "",
          }),
      });
      vi.stubGlobal("fetch", fetchMock);

      await updateGroup(
        "g1",
        { meet_link: null, report_date: null },
        "tok",
      );

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(JSON.parse(init.body as string)).toEqual({
        meet_link: null,
        report_date: null,
      });
    });
  });

  describe("fetchGroupMembers", () => {
    it("calls GET /groups/:id/members", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      });
      vi.stubGlobal("fetch", fetchMock);

      await fetchGroupMembers("g1", "tok");

      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3000/groups/g1/members",
        expect.objectContaining({ method: "GET" }),
      );
    });
  });

  describe("inviteMember", () => {
    it("calls POST /groups/:id/members/invite with email", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: () =>
          Promise.resolve({
            id: "inv1",
            group_id: "g1",
            token: "tok",
            expires_at: "",
            created_at: "",
          }),
      });
      vi.stubGlobal("fetch", fetchMock);

      await inviteMember("g1", "a@b.com", "tok");

      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3000/groups/g1/members/invite",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ email: "a@b.com" }),
        }),
      );
    });

    it("throws HttpError on 409", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 409,
          statusText: "Conflict",
          text: () => Promise.resolve(""),
        }),
      );

      await expect(inviteMember("g", "e@x.com", "t")).rejects.toMatchObject({
        status: 409,
      });
    });
  });

  describe("toggleMemberStatus", () => {
    it("calls PATCH /groups/:id/members/:userId/toggle", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            id: "m1",
            group_id: "g1",
            user_id: "u2",
            is_active: false,
            created_at: "",
            updated_at: "",
          }),
      });
      vi.stubGlobal("fetch", fetchMock);

      await toggleMemberStatus("g1", "u2", "tok");

      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3000/groups/g1/members/u2/toggle",
        expect.objectContaining({ method: "PATCH" }),
      );
    });
  });

  describe("removeMember", () => {
    it("calls DELETE /groups/:id/members/:userId", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });
      vi.stubGlobal("fetch", fetchMock);

      await removeMember("g1", "u2", "tok");

      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3000/groups/g1/members/u2",
        expect.objectContaining({ method: "DELETE" }),
      );
    });

    it("resolves void on 204", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          status: 204,
        }),
      );

      await expect(removeMember("g", "u", "t")).resolves.toBeUndefined();
    });

    it("throws HttpError on failure", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 403,
          statusText: "Forbidden",
          text: () => Promise.resolve(""),
        }),
      );

      await expect(removeMember("g", "u", "t")).rejects.toMatchObject({
        status: 403,
      });
    });
  });

  describe("createGroupMeetEvent", () => {
    it("POSTs /groups/:id/calendar/meet-event with start and optional end", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: () =>
          Promise.resolve({
            event_id: "e1",
            meet_link: "https://meet.google.com/x",
            html_link: "https://cal",
            start: "2026-01-01T00:00:00.000Z",
            end: "2026-01-01T01:00:00.000Z",
          }),
      });
      vi.stubGlobal("fetch", fetchMock);

      await createGroupMeetEvent(
        "g1",
        {
          start: "2026-01-01T00:00:00.000Z",
          end: "2026-01-01T01:00:00.000Z",
        },
        "tok",
      );

      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3000/groups/g1/calendar/meet-event",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            start: "2026-01-01T00:00:00.000Z",
            end: "2026-01-01T01:00:00.000Z",
          }),
        }),
      );
    });

    it("omits end from body when not provided", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: () =>
          Promise.resolve({
            event_id: "e1",
            meet_link: "https://meet.google.com/x",
            html_link: "",
            start: "2026-01-01T00:00:00.000Z",
            end: "2026-01-01T01:00:00.000Z",
          }),
      });
      vi.stubGlobal("fetch", fetchMock);

      await createGroupMeetEvent("g1", { start: "2026-01-01T00:00:00.000Z" }, "t");

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(JSON.parse(init.body as string)).toEqual({
        start: "2026-01-01T00:00:00.000Z",
      });
    });
  });

  describe("fetchGroupCalendarEvents", () => {
    it("GETs /groups/:id/calendar/events with query params", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      });
      vi.stubGlobal("fetch", fetchMock);

      await fetchGroupCalendarEvents(
        "g1",
        "2026-06-01T00:00:00.000Z",
        "2026-06-08T00:00:00.000Z",
        "tok",
      );

      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3000/groups/g1/calendar/events?time_min=2026-06-01T00%3A00%3A00.000Z&time_max=2026-06-08T00%3A00%3A00.000Z",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({ Authorization: "Bearer tok" }),
        }),
      );
    });
  });

  describe("createGroupCalendarEvent", () => {
    it("POSTs body to /groups/:id/calendar/events", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: () =>
          Promise.resolve({
            event_id: "x",
            html_link: "https://cal",
            start: "2026-06-01T10:00:00.000Z",
            end: "2026-06-01T11:00:00.000Z",
            meet_link: null,
          }),
      });
      vi.stubGlobal("fetch", fetchMock);

      await createGroupCalendarEvent(
        "g1",
        {
          start: "2026-06-01T10:00:00.000Z",
          end: "2026-06-01T11:00:00.000Z",
          mode: "offline",
          place_name: "HQ",
        },
        "tok",
      );

      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3000/groups/g1/calendar/events",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            start: "2026-06-01T10:00:00.000Z",
            end: "2026-06-01T11:00:00.000Z",
            mode: "offline",
            place_name: "HQ",
          }),
        }),
      );
    });
  });
});
