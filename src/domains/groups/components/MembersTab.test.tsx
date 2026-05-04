import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { MembersTab } from "./MembersTab";
import { useGroupInvitations, useResendGroupInvitation } from "@/domains/invitations";

vi.mock("@/domains/invitations");

vi.mock("@/domains/contacts/components/InviteEmailCombobox", () => ({
  InviteEmailCombobox: () => <input aria-label="Email" readOnly />,
}));

vi.mock("@/domains/groups", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/domains/groups")>();
  return {
    ...actual,
    useInviteMember: () => ({ mutate: vi.fn(), isPending: false }),
    useRemoveMember: () => ({ mutate: vi.fn() }),
    useToggleMemberStatus: () => ({ mutate: vi.fn() }),
  };
});

describe("MembersTab", () => {
  const mutateResend = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useResendGroupInvitation).mockReturnValue({
      mutate: mutateResend,
      isPending: false,
      variables: undefined,
    } as never);
    vi.mocked(useGroupInvitations).mockReturnValue({
      data: [],
      isLoading: false,
    } as never);
  });

  function renderTab() {
    return render(
      <MembersTab
        groupId="g-1"
        leaderId="l-1"
        isLeader
        members={[]}
        membersLoading={false}
      />,
    );
  }

  function openInvitationsDialog() {
    fireEvent.click(screen.getByRole("button", { name: /invitation activity/i }));
  }

  it("shows Resend for pending and expired invitations, not for accepted", () => {
    vi.mocked(useGroupInvitations).mockReturnValue({
      data: [
        {
          id: "i-pending",
          group_id: "g-1",
          email: "p@test.com",
          status: "pending",
          token: "t1",
          expires_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
        {
          id: "i-expired",
          group_id: "g-1",
          email: "e@test.com",
          status: "expired",
          token: "t2",
          expires_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
        {
          id: "i-accepted",
          group_id: "g-1",
          email: "a@test.com",
          status: "accepted",
          token: "t3",
          expires_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
      ],
      isLoading: false,
    } as never);

    renderTab();
    openInvitationsDialog();

    const resendButtons = screen.getAllByRole("button", { name: /^resend$/i });
    expect(resendButtons).toHaveLength(2);
    expect(screen.getByText("p@test.com")).toBeInTheDocument();
    expect(screen.getByText("e@test.com")).toBeInTheDocument();
    expect(screen.getByText("a@test.com")).toBeInTheDocument();
  });

  it("shows only one Resend per email when duplicate invitations exist", () => {
    const iso = new Date().toISOString();
    vi.mocked(useGroupInvitations).mockReturnValue({
      data: [
        {
          id: "i-old",
          group_id: "g-1",
          email: "dup@test.com",
          status: "pending",
          token: "t1",
          expires_at: iso,
          created_at: "2026-01-01T00:00:00.000Z",
        },
        {
          id: "i-new",
          group_id: "g-1",
          email: "dup@test.com",
          status: "pending",
          token: "t2",
          expires_at: iso,
          created_at: "2026-06-01T00:00:00.000Z",
        },
      ],
      isLoading: false,
    } as never);

    renderTab();
    openInvitationsDialog();

    expect(screen.getAllByRole("button", { name: /^resend$/i })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: /^resend$/i }));
    expect(mutateResend).toHaveBeenCalledWith(
      { groupId: "g-1", invitationId: "i-new" },
      expect.objectContaining({ onError: expect.any(Function) }),
    );
  });

  it("hides Resend when the invitee is already a group member", () => {
    vi.mocked(useGroupInvitations).mockReturnValue({
      data: [
        {
          id: "i-1",
          group_id: "g-1",
          email: "member@test.com",
          status: "pending",
          token: "t1",
          expires_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
      ],
      isLoading: false,
    } as never);

    render(
      <MembersTab
        groupId="g-1"
        leaderId="l-1"
        isLeader
        members={[
          {
            user_id: "u-1",
            full_name: "Member",
            email: "member@test.com",
            role: "member",
            is_active: true,
            joined_at: new Date().toISOString(),
          },
        ]}
        membersLoading={false}
      />,
    );
    openInvitationsDialog();

    expect(screen.queryByRole("button", { name: /^resend$/i })).not.toBeInTheDocument();
    expect(screen.getByText("member@test.com")).toBeInTheDocument();
  });

  it("calls resend mutation with groupId and invitationId", () => {
    vi.mocked(useGroupInvitations).mockReturnValue({
      data: [
        {
          id: "inv-99",
          group_id: "g-1",
          email: "x@y.com",
          status: "pending",
          token: "tok",
          expires_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
      ],
      isLoading: false,
    } as never);

    renderTab();
    openInvitationsDialog();

    fireEvent.click(screen.getByRole("button", { name: /^resend$/i }));

    expect(mutateResend).toHaveBeenCalledWith(
      { groupId: "g-1", invitationId: "inv-99" },
      expect.objectContaining({ onError: expect.any(Function) }),
    );
  });
});
