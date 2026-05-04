import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  exchangeGoogleCode,
} from "@/domains/auth/auth-api";
import { navigateAfterLogin } from "@/domains/auth/post-login-redirect";
import {
  clearOAuthSession,
  getOAuthState,
  getOAuthVerifier,
  getAccessToken,
  setTokens,
} from "@/domains/auth/token-storage";

export const Route = createFileRoute("/login/callback")({
  component: LoginCallbackPage,
});

/** Prevents exchanging the same Google `code` twice (React Strict Mode runs effects twice in dev). */
function exchangeGuardKey(code: string) {
  return `oauth_pkce_exchanged_${code}`;
}

function LoginCallbackPage() {
  const [message, setMessage] = useState("Signing you in…");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const oauthError = params.get("error");

    async function run() {
      if (oauthError) {
        const desc = params.get("error_description") ?? oauthError;
        setMessage("Could not sign in.");
        toast.error(desc);
        clearOAuthSession();
        return;
      }

      const verifier = getOAuthVerifier();
      const expectedState = getOAuthState();

      if (!code || !verifier) {
        setMessage("Missing authorization code. Try signing in again.");
        toast.error("Missing authorization response from Google.");
        clearOAuthSession();
        return;
      }

      const guardKey = exchangeGuardKey(code);
      const guard = sessionStorage.getItem(guardKey);
      if (guard === "done") {
        if (getAccessToken()) {
          navigateAfterLogin();
        }
        return;
      }
      if (guard === "started") {
        return;
      }
      sessionStorage.setItem(guardKey, "started");

      if (!state || state !== expectedState) {
        sessionStorage.removeItem(guardKey);
        setMessage("Invalid session state. Try signing in again.");
        toast.error("Security validation failed (state). Clear cookies and retry.");
        clearOAuthSession();
        return;
      }

      try {
        const tokens = await exchangeGoogleCode(code, verifier);
        sessionStorage.setItem(guardKey, "done");
        clearOAuthSession();
        setTokens(tokens.access_token, tokens.refresh_token);
        toast.success("Signed in");
        navigateAfterLogin();
      } catch (e) {
        sessionStorage.removeItem(guardKey);
        const msg = e instanceof Error ? e.message : "Sign-in failed";
        setMessage("Could not complete sign-in.");
        toast.error(msg);
        clearOAuthSession();
      }
    }

    void run();
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      <Link
        to="/login"
        className="text-sm font-medium text-primary underline underline-offset-4"
      >
        Back to sign in
      </Link>
    </div>
  );
}
