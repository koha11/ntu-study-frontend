import * as React from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Mail, AlertCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  invitationValidateQueryOptions,
  useAcceptInvitationMutation,
} from "@/domains/invitations/queries";
import { useCurrentUser } from "@/domains/auth";

export function AcceptInvitationPage() {
  const { token } = useParams({ from: "/invitations/$token/accept" });
  const navigate = useNavigate();
  const { data: profile } = useCurrentUser();

  const { data: validation, isLoading, isError, error } = useQuery(
    invitationValidateQueryOptions(token ?? ""),
  );

  const { mutate: acceptMutate, isPending: accepting } = useAcceptInvitationMutation();

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
        onSuccess: () => {
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
        <InvalidBlock message="Missing invitation link." />
      </AppShell>
    );
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
          Loading invitation…
        </div>
      </AppShell>
    );
  }

  if (isError) {
    return (
      <AppShell>
        <InvalidBlock message={(error as Error)?.message ?? "Something went wrong."} />
      </AppShell>
    );
  }

  if (!validation?.valid || !validation.invitation) {
    const reasonLabel: Record<string, string> = {
      not_found: "This invitation link is invalid.",
      expired: "This invitation has expired.",
      already_accepted: "This invitation was already accepted.",
      invalid_status: "This invitation is no longer valid.",
    };
    const msg =
      reasonLabel[validation?.reason ?? ""] ??
      "This invitation cannot be used.";
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
        <ArrowLeft className="h-3 w-3" /> Home
      </Link>

      <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-8 shadow-elegant">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Group invitation</h1>
            <p className="text-sm text-muted-foreground">
              Join{" "}
              <span className="font-medium text-foreground">{groupName}</span>
            </p>
          </div>
        </div>

        {inviteEmail && (
          <p className="mt-6 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
            Invited email:{" "}
            <span className="font-mono text-xs">{inviteEmail}</span>
          </p>
        )}

        {expiresAt && (
          <p className="mt-2 text-xs text-muted-foreground">
            Expires {new Date(expiresAt).toLocaleString()}
          </p>
        )}

        {emailMismatchHint && (
          <div className="mt-4 flex gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              You&apos;re signed in as <strong>{profile?.email}</strong>. The invite is for{" "}
              <strong>{inviteEmail}</strong>. Accepting still grants membership to the invited address
              on the server — for Google sign-in later, use an account matching{" "}
              <strong>{inviteEmail}</strong>.
              <div className="mt-2">
                <Link
                  to="/login"
                  search={{ redirect: loginRedirectPath }}
                  className="font-medium underline"
                >
                  Sign in with a different account
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6">
          <label className="text-xs font-medium text-muted-foreground">
            Display name (optional—used if the app creates your profile from this invite)
          </label>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={profile?.name || "Your name"}
            className="mt-1"
          />
        </div>

        {!profile && (
          <p className="mt-3 text-sm text-muted-foreground">
            Tip:{" "}
            <Link
              to="/login"
              search={{ redirect: loginRedirectPath }}
              className="font-medium text-primary hover:underline"
            >
              Sign in with Google
            </Link>{" "}
            first if you use NTU Google — same email as above.
          </p>
        )}

        {profile && emailMatches && (
          <p className="mt-3 text-xs text-muted-foreground">
            Signed in as {profile.email}. You can accept below.
          </p>
        )}

        <Button
          type="button"
          className="mt-6 w-full bg-gradient-primary"
          disabled={accepting}
          onClick={handleAccept}
        >
          {accepting ? "Joining…" : "Accept invitation"}
        </Button>
      </div>
    </AppShell>
  );
}

function InvalidBlock({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center">
      <h1 className="text-lg font-semibold">Invitation unavailable</h1>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      <Link to="/groups" className="mt-6 inline-block text-sm text-primary hover:underline">
        Go to your groups
      </Link>
    </div>
  );
}
