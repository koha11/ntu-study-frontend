import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  validateInvitationToken,
  acceptInvitation,
  fetchPendingInvitationToken,
  fetchGroupInvitations,
  resendGroupInvitation,
} from "./invitations-api";
import { HttpError } from "@/domains/auth/auth-api";

describe("invitations-api", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  describe("validateInvitationToken", () => {
    it("GET /invitations/:token/validate has no Authorization header", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            valid: false,
            reason: "not_found",
          }),
      });
      vi.stubGlobal("fetch", fetchMock);

      await validateInvitationToken("abc");

      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3000/invitations/abc/validate",
        { method: "GET" },
      );
    });

    it("returns parsed JSON", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              valid: true,
              invitation: {
                id: "i1",
                group_id: "g1",
                token: "t",
                expires_at: "",
                created_at: "",
                group: { id: "g1", name: "Study" },
              },
            }),
        }),
      );

      await expect(validateInvitationToken("t")).resolves.toMatchObject({
        valid: true,
      });
    });
  });

  describe("acceptInvitation", () => {
    it("POST /invitations/:token/accept with JSON body", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            user: { id: "u1", email: "a@b.com", full_name: "A" },
          }),
      });
      vi.stubGlobal("fetch", fetchMock);

      await acceptInvitation("tok", { full_name: "Name" });

      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3000/invitations/tok/accept",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({ full_name: "Name" }),
        }),
      );
    });

    it("throws HttpError on conflict", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 409,
          statusText: "Conflict",
          text: () => Promise.resolve(""),
        }),
      );

      try {
        await acceptInvitation("x");
        expect.fail("expected throw");
      } catch (e) {
        expect(e).toBeInstanceOf(HttpError);
        expect((e as HttpError).status).toBe(409);
      }
    });
  });

  describe("fetchPendingInvitationToken", () => {
    it("GET /invitations/pending-token/:id with Bearer token", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ token: "abc" }),
      });
      vi.stubGlobal("fetch", fetchMock);

      const out = await fetchPendingInvitationToken("inv-uuid-1", "access");

      expect(out).toEqual({ token: "abc" });
      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3000/invitations/pending-token/inv-uuid-1",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "Bearer access",
          }),
        }),
      );
    });
  });

  describe("fetchGroupInvitations", () => {
    it("GET /invitations/groups/:groupId with Bearer token", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });
      vi.stubGlobal("fetch", fetchMock);

      await fetchGroupInvitations("g1", "access");

      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3000/invitations/groups/g1",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "Bearer access",
          }),
        }),
      );
    });
  });

  describe("resendGroupInvitation", () => {
    it("POST /invitations/groups/:groupId/invitations/:invitationId/resend with Bearer token", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            id: "new-inv",
            group_id: "g1",
            email: "a@b.com",
            token: "tok",
            status: "pending",
            expires_at: new Date().toISOString(),
          }),
      });
      vi.stubGlobal("fetch", fetchMock);

      await resendGroupInvitation("g1", "inv1", "access");

      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3000/invitations/groups/g1/invitations/inv1/resend",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer access",
          }),
        }),
      );
    });
  });
});
