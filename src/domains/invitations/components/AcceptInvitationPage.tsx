import * as React from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Mail, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  invitationValidateQueryOptions,
  useAcceptInvitationMutation,
} from "@/domains/invitations/queries";
import { useCurrentUser } from "@/domains/auth";
import { setTokens } from "@/domains/auth/token-storage";

export function AcceptInvitationPage() {
  const { t } = useTranslation();
  const { token } = useParams({ from: "/invitations/$token/accept" });
  const navigate = useNavigate();
  const { data: profile } = useCurrentUser();

  const { data: validation, isLoading, isError, error } = useQuery(
    invitationValidateQueryOptions(token ?? ""),
  );

  const { mutate: acceptMutate, isPending: accepting } = useAcceptInvitationMutation();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = React.useState("");

  const inviteEmail = validation?.invitation?.email?.toLowerCase().trim();
  const profileEmail = profile?.email?.toLowerCase().trim();
  const emailMatches =
    inviteEmail && profileEmail ? inviteEmail === profileEmail : false;
  const emailMismatchHint =
    Boolean(profile && inviteEmail && profileEmail && !emailMatches);

  const groupName =
    validation?.invitation?.group?.name ??
    (validation?.invitation?.group_id ? "this study group" : "Study group");

  const expiresAt = validation?.invitation?.expires_at;

  const handleAccept = () => {
    if (!token) return;
    acceptMutate(
      {
        token,
        ...(fullName.trim() ? { full_name: fullName.trim() } : {}),
      },
      {
        onSuccess: (data) => {
          setTokens(data.access_token, data.refresh_token);
          void queryClient.invalidateQueries({ queryKey: ["auth", "current-user"] });
          const gid = validation?.invitation?.group_id;
          if (gid) {
            navigate({ to: "/groups/$groupId", params: { groupId: gid } });
          } else {
            navigate({ to: "/groups" });
          }
        },
      },
    );
  };

  if (!token) {
    return (
      <AppShell>
        <InvalidBlock message={t("invitations.missingLink")} />
      </AppShell>
    );
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
          {t("invitations.loading")}
        </div>
      </AppShell>
    );
  }

  if (isError) {
    return (
      <AppShell>
        <InvalidBlock message={(error as Error)?.message ?? t("invitations.reasons.default")} />
      </AppShell>
    );
  }

  if (!validation?.valid || !validation.invitation) {
    const reasonKey = validation?.reason ?? "";
    const msg =
      t(`invitations.reasons.${reasonKey}`, { defaultValue: t("invitations.reasons.default") });
    return (
      <AppShell>
        <InvalidBlock message={msg} />
      </AppShell>
    );
  }

  const loginRedirectPath = `/invitations/${encodeURIComponent(token)}/accept`;

  return (
    <AppShell>
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> {t("invitations.home")}
      </Link>

      <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-8 shadow-elegant">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{t("invitations.title")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("invitations.joinGroup", { groupName })}
            </p>
          </div>
        </div>

        {inviteEmail && (
          <p className="mt-6 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
            {t("invitations.invitedEmail")}{" "}
            <span className="font-mono text-xs">{inviteEmail}</span>
          </p>
        )}

        {expiresAt && (
          <p className="mt-2 text-xs text-muted-foreground">
            {t("invitations.expires")} {new Date(expiresAt).toLocaleString()}
          </p>
        )}

        {emailMismatchHint && (
          <div className="mt-4 flex gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <strong>{profile?.email}</strong> — <strong>{inviteEmail}</strong>
              <div className="mt-2">
                <Link
                  to="/login"
                  search={{ redirect: loginRedirectPath }}
                  className="font-medium underline"
                >
                  {t("invitations.signInDifferent")}
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6">
          <label className="text-xs font-medium text-muted-foreground">
            {t("invitations.displayName")}
          </label>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={profile?.name || t("invitations.displayNamePlaceholder")}
            className="mt-1"
          />
        </div>

        {!profile && (
          <p className="mt-3 text-sm text-muted-foreground">
            <Link
              to="/login"
              search={{ redirect: loginRedirectPath }}
              className="font-medium text-primary hover:underline"
            >
              {t("invitations.signInTip")}
            </Link>
          </p>
        )}

        {profile && emailMatches && (
          <p className="mt-3 text-xs text-muted-foreground">
            {t("invitations.signedInAs", { email: profile.email })}
          </p>
        )}

        <Button
          type="button"
          className="mt-6 w-full bg-gradient-primary"
          disabled={accepting}
          onClick={handleAccept}
        >
          {accepting ? t("invitations.joining") : t("invitations.accept")}
        </Button>
      </div>
    </AppShell>
  );
}

function InvalidBlock({ message }: { message: string }) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center">
      <h1 className="text-lg font-semibold">{t("invitations.unavailable")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      <Link to="/groups" className="mt-6 inline-block text-sm text-primary hover:underline">
        {t("invitations.goToGroups")}
      </Link>
    </div>
  );
}
