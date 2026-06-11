"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { InviteEmailCombobox } from "@/domains/contacts/components/InviteEmailCombobox";
import { useInviteMember, useRemoveMember, useToggleMemberStatus } from "@/domains/groups";
import type { MemberRow } from "@/domains/groups";
import { useGroupInvitations, useResendGroupInvitation } from "@/domains/invitations";

function invitationIdsEligibleForResend(
  rows: { id: string; email?: string | null; status?: string; created_at: string }[],
  memberEmails: Set<string>,
): Set<string> {
  type Row = (typeof rows)[number];
  const byKey = new Map<string, Row[]>();
  for (const inv of rows) {
    const key = inv.email?.trim().toLowerCase() || `__noid__${inv.id}`;
    const list = byKey.get(key);
    if (list) list.push(inv);
    else byKey.set(key, [inv]);
  }

  const idSet = new Set<string>();
  for (const [emailKey, group] of byKey) {
    if (!emailKey.startsWith("__noid__") && memberEmails.has(emailKey)) {
      continue;
    }
    const resendable = group.filter((inv) => {
      const s = inv.status ?? "pending";
      return s === "pending" || s === "expired";
    });
    if (resendable.length === 0) continue;
    resendable.sort((a, b) => {
      const sa = a.status ?? "pending";
      const sb = b.status ?? "pending";
      if (sa !== sb) {
        if (sa === "pending" && sb === "expired") return -1;
        if (sa === "expired" && sb === "pending") return 1;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    idSet.add(resendable[0].id);
  }
  return idSet;
}

function invitationStatusBadgeClass(status: string) {
  switch (status) {
    case "pending":
      return "border-amber-500/50 bg-amber-500/15 text-amber-950 dark:bg-amber-500/20 dark:text-amber-200";
    case "expired":
      return "border-orange-500/45 bg-orange-500/12 text-orange-950 dark:bg-orange-500/15 dark:text-orange-200";
    case "accepted":
      return "border-emerald-500/50 bg-emerald-500/12 text-emerald-950 dark:bg-emerald-500/15 dark:text-emerald-200";
    default:
      return "border-border bg-muted/60 text-muted-foreground";
  }
}

export interface MembersTabProps {
  groupId: string;
  leaderId: string;
  isLeader: boolean;
  groupLocked?: boolean;
  members: MemberRow[];
  membersLoading: boolean;
}

export function MembersTab({
  groupId,
  leaderId,
  isLeader,
  groupLocked = false,
  members,
  membersLoading,
}: MembersTabProps) {
  const { t } = useTranslation();
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteError, setInviteError] = React.useState<string | null>(null);
  const [resendError, setResendError] = React.useState<string | null>(null);
  const [invitationsDialogOpen, setInvitationsDialogOpen] = React.useState(false);

  const { data: invitationRows = [], isLoading: invitationsLoading } = useGroupInvitations(
    groupId,
    isLeader,
  );

  const memberEmails = React.useMemo(
    () =>
      new Set(
        members
          .map((m) => m.email?.trim().toLowerCase())
          .filter((e): e is string => Boolean(e)),
      ),
    [members],
  );

  const resendButtonInvitationIds = React.useMemo(
    () => invitationIdsEligibleForResend(invitationRows, memberEmails),
    [invitationRows, memberEmails],
  );

  const { mutate: inviteMember, isPending: invitePending } = useInviteMember();
  const {
    mutate: resendInvitation,
    isPending: resendPending,
    variables: resendVariables,
  } = useResendGroupInvitation();
  const { mutate: toggleMemberStatus } = useToggleMemberStatus();
  const { mutate: removeMember } = useRemoveMember();

  const handleInvite = () => {
    setInviteError(null);
    const email = inviteEmail.trim();
    if (!email) {
      setInviteError(t("groups.members.enterEmail"));
      return;
    }
    inviteMember(
      { groupId, email },
      {
        onSuccess: () => {
          setInviteEmail("");
        },
        onError: (err: Error) => {
          setInviteError(err.message);
        },
      },
    );
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{t("groups.members.title")}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("groups.members.subtitle")}
          </p>
        </div>
        {isLeader && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => setInvitationsDialogOpen(true)}
          >
            {t("groups.members.invitationActivity")}
          </Button>
        )}
      </div>

      {isLeader && !groupLocked && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground">{t("groups.members.email")}</label>
            <InviteEmailCombobox
              value={inviteEmail}
              onChange={setInviteEmail}
              fetchEnabled={isLeader}
              disabled={invitePending}
            />
          </div>
          <Button
            type="button"
            className="bg-gradient-primary"
            disabled={invitePending}
            onClick={handleInvite}
          >
            {invitePending ? t("groups.members.sending") : t("groups.members.invite")}
          </Button>
        </div>
      )}
      {inviteError && <p className="mt-2 text-xs text-destructive">{inviteError}</p>}

      {isLeader && (
        <Dialog
          open={invitationsDialogOpen}
          onOpenChange={(open) => {
            setInvitationsDialogOpen(open);
            if (!open) setResendError(null);
          }}
        >
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("groups.members.invitationActivityTitle")}</DialogTitle>
              <DialogDescription>
                {t("groups.members.invitationActivityDesc")}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-2">
              {invitationsLoading ? (
                <p className="text-xs text-muted-foreground">{t("groups.members.loadingInvitations")}</p>
              ) : invitationRows.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t("groups.members.noInvitations")}</p>
              ) : (
                <>
                  {resendError && (
                    <p className="mb-3 text-xs text-destructive">{resendError}</p>
                  )}
                  <ul className="space-y-2 text-sm">
                    {invitationRows.map((inv) => {
                      const status = inv.status ?? "pending";
                      const canResend =
                        (status === "pending" || status === "expired") &&
                        resendButtonInvitationIds.has(inv.id);
                      const isResending =
                        resendPending &&
                        resendVariables?.groupId === groupId &&
                        resendVariables?.invitationId === inv.id;

                      return (
                        <li
                          key={inv.id}
                          className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-border/50 bg-muted/15 px-3 py-2"
                        >
                          <div className="min-w-0 flex-1 space-y-1">
                            <span className="font-mono text-xs">{inv.email ?? "—"}</span>
                            <span className="block w-full text-[11px] text-muted-foreground">
                              {t("groups.members.expires")} {new Date(inv.expires_at).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex shrink-0 flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                "shrink-0 px-2 py-0 text-[10px] font-semibold uppercase tracking-wide",
                                invitationStatusBadgeClass(status),
                              )}
                            >
                              {status}
                            </Badge>
                            {canResend && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={isResending}
                                onClick={() => {
                                  setResendError(null);
                                  resendInvitation(
                                    { groupId, invitationId: inv.id },
                                    {
                                      onError: (err: Error) => {
                                        setResendError(err.message);
                                      },
                                    },
                                  );
                                }}
                              >
                                {isResending ? t("groups.members.resending") : t("groups.members.resend")}
                              </Button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      <ul className="mt-6 divide-y divide-border">
        {membersLoading ? (
          <li className="py-3 text-sm text-muted-foreground">{t("groups.members.loadingMembers")}</li>
        ) : members.length === 0 ? (
          <li className="py-3 text-sm text-muted-foreground">{t("groups.members.noMembers")}</li>
        ) : (
          members.map((m) => {
            const isTargetLeader = m.user_id === leaderId;
            const canManage = isLeader && !isTargetLeader;

            return (
              <li
                key={m.user_id}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <div>
                  <div className="font-medium">{m.full_name || m.user_id}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {m.role}
                    {!m.is_active && ` · ${t("groups.members.inactive")}`}
                  </div>
                </div>
                {canManage && !groupLocked && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => toggleMemberStatus({ groupId, userId: m.user_id })}
                    >
                      {m.is_active ? t("groups.members.deactivate") : t("groups.members.activate")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => removeMember({ groupId, userId: m.user_id })}
                    >
                      {t("groups.members.remove")}
                    </Button>
                  </div>
                )}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
