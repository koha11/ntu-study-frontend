import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { z } from "zod";
import { GraduationCap, ArrowLeft, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { normalizeSafeAppPath } from "@/domains/auth/post-login-redirect";
import { startGoogleLogin } from "@/domains/auth/start-google-login";
import { getAccessToken } from "@/domains/auth/token-storage";
import { toast } from "sonner";

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: (search) => loginSearchSchema.parse(search),
  beforeLoad: () => {
    if (getAccessToken()) {
      throw redirect({ to: "/dashboard" });
    }
  },
  head: () => ({
    meta: [
      { title: "Sign in — NTU Study" },
      {
        name: "description",
        content:
          "Sign in to NTU Study with your NTU Google account to access your groups, tasks and flashcards.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { redirect: redirectPath } = Route.useSearch();

  if (pathname === "/login/callback") {
    return <Outlet />;
  }

  const safeRedirect = normalizeSafeAppPath(redirectPath);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Branded header */}
      <header className="border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 md:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">NTU Study</div>
              <div className="text-[10px] text-muted-foreground">{t("login.tagline")}</div>
            </div>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link
              to="/"
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t("login.backToHome")}
            </Link>
          </div>
        </div>
      </header>

      {/* Sign-in card */}
      <main className="relative flex flex-1 items-center justify-center overflow-hidden p-6">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: "var(--gradient-glow)" }}
          aria-hidden
        />

        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-elegant">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight">{t("login.welcomeBack")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t("login.signInToContinue")}</p>
          </div>

          <Button
            type="button"
            variant="outline"
            className="mt-8 h-11 w-full gap-3 text-sm font-medium"
            onClick={() => {
              startGoogleLogin({
                redirectAfterLogin: safeRedirect ?? undefined,
              }).catch((err) => {
                const msg = err instanceof Error ? err.message : t("login.couldNotStartLogin");
                toast.error(msg);
              });
            }}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M12 10.2v3.9h5.5c-.2 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"
              />
              <path
                fill="#34A853"
                d="M3.9 7.3l3.2 2.3C8 7.9 9.9 6.6 12 6.6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.4 12 2.4 8.3 2.4 5.1 4.5 3.9 7.3z"
              />
              <path
                fill="#FBBC05"
                d="M12 21.6c2.6 0 4.7-.9 6.3-2.4l-3-2.5c-.8.6-2 1-3.3 1-2.6 0-4.7-1.7-5.5-4.1l-3.2 2.5c1.4 2.7 4.4 5.5 8.7 5.5z"
              />
              <path
                fill="#4285F4"
                d="M21.2 12.2c0-.6-.1-1.1-.2-1.6H12v3.9h5.5c-.3 1.3-1.1 2.4-2.2 3.1l3 2.5c1.8-1.6 2.9-4.1 2.9-7.9z"
              />
            </svg>
            {t("login.continueWithGoogle")}
          </Button>

          <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            {t("login.eduHint")}
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {t("login.byContiuing")}{" "}
            <a href="#" className="underline hover:text-foreground">
              {t("login.terms")}
            </a>{" "}
            {t("login.and")}{" "}
            <a href="#" className="underline hover:text-foreground">
              {t("login.privacy")}
            </a>
            .
          </p>
        </div>
      </main>

      {/* Branded footer */}
      <footer className="border-t border-border/60 bg-card/30">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-muted-foreground md:flex-row md:px-6">
          <div>{t("login.footer.copyright", { year: new Date().getFullYear() })}</div>
          <nav className="flex items-center gap-5">
            <Link to="/" className="hover:text-foreground">
              {t("login.footer.home")}
            </Link>
            <a href="#" className="hover:text-foreground">
              {t("login.footer.privacy")}
            </a>
            <a href="#" className="hover:text-foreground">
              {t("login.footer.terms")}
            </a>
            <a href="#" className="hover:text-foreground">
              {t("login.footer.support")}
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
