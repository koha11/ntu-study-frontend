import { createFileRoute, Link } from "@tanstack/react-router";
import {
  GraduationCap,
  Users,
  CheckSquare,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Twitter,
  Github,
  Mail,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NTU Study — Group collaboration for students" },
      {
        name: "description",
        content:
          "Collaborate on courses, projects and reading clubs with shared tasks, flashcards and contribution ratings — built for NTU students.",
      },
      { property: "og:title", content: "NTU Study — Group collaboration for students" },
      {
        property: "og:description",
        content: "Shared tasks, flashcards and contribution ratings, built for NTU students.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { t } = useTranslation();

  const features = [
    {
      icon: Users,
      title: t("landing.features.groups.title"),
      body: t("landing.features.groups.body"),
    },
    {
      icon: CheckSquare,
      title: t("landing.features.tasks.title"),
      body: t("landing.features.tasks.body"),
    },
    {
      icon: Sparkles,
      title: t("landing.features.flashcards.title"),
      body: t("landing.features.flashcards.body"),
    },
    {
      icon: TrendingUp,
      title: t("landing.features.contribution.title"),
      body: t("landing.features.contribution.body"),
    },
    {
      icon: ShieldCheck,
      title: t("landing.features.records.title"),
      body: t("landing.features.records.body"),
    },
    {
      icon: GraduationCap,
      title: t("landing.features.ntu.title"),
      body: t("landing.features.ntu.body"),
    },
  ];

  const stats = [
    { label: t("landing.stats.activeGroups"), value: "320+" },
    { label: t("landing.stats.tasksTracked"), value: "12.4k" },
    { label: t("landing.stats.flashcardsReviewed"), value: "98k" },
    { label: t("landing.stats.avgContribution"), value: "8.6" },
  ];

  const steps = [
    {
      step: t("landing.howItWorks.steps.step1.number"),
      title: t("landing.howItWorks.steps.step1.title"),
      body: t("landing.howItWorks.steps.step1.body"),
    },
    {
      step: t("landing.howItWorks.steps.step2.number"),
      title: t("landing.howItWorks.steps.step2.title"),
      body: t("landing.howItWorks.steps.step2.body"),
    },
    {
      step: t("landing.howItWorks.steps.step3.number"),
      title: t("landing.howItWorks.steps.step3.title"),
      body: t("landing.howItWorks.steps.step3.body"),
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 md:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">NTU Study</div>
              <div className="text-[10px] text-muted-foreground">{t("landing.tagline")}</div>
            </div>
          </Link>

          <nav className="ml-8 hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">{t("landing.nav.features")}</a>
            <a href="#how" className="hover:text-foreground">{t("landing.nav.howItWorks")}</a>
            <a href="#faq" className="hover:text-foreground">{t("landing.nav.faq")}</a>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link
              to="/login"
              className="hidden h-10 items-center rounded-lg border border-border bg-card px-3 text-sm font-medium transition-colors hover:bg-accent sm:inline-flex"
            >
              {t("landing.nav.signIn")}
            </Link>
            <Link to="/login">
              <Button className="h-10 bg-gradient-primary shadow-glow">
                {t("landing.nav.getStarted")} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: "var(--gradient-glow)" }}
          aria-hidden
        />
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-16 md:px-6 md:pb-28 md:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-primary-glow">
              <Sparkles className="h-3 w-3" /> {t("landing.badge")}
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-6xl">
              {t("landing.hero.title1")}{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                {t("landing.hero.title2")}
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
              {t("landing.hero.subtitle")}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to="/login">
                <Button className="h-12 bg-gradient-primary px-6 text-sm shadow-glow">
                  {t("landing.hero.continueWithGoogle")} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a
                href="#features"
                className="inline-flex h-12 items-center rounded-lg border border-border bg-card px-5 text-sm font-medium transition-colors hover:bg-accent"
              >
                {t("landing.hero.seeHowItWorks")}
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-border bg-card/60 p-4 text-center backdrop-blur-sm"
              >
                <div className="bg-gradient-primary bg-clip-text text-2xl font-bold text-transparent md:text-3xl">
                  {s.value}
                </div>
                <div className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border/60 bg-card/30">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs uppercase tracking-widest text-primary-glow">
              {t("landing.features.sectionLabel")}
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              {t("landing.features.sectionTitle")}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
              {t("landing.features.sectionSubtitle")}
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-elegant"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-base font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {f.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs uppercase tracking-widest text-primary-glow">
              {t("landing.howItWorks.sectionLabel")}
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              {t("landing.howItWorks.sectionTitle")}
            </h2>
          </div>

          <ol className="mt-12 grid gap-5 md:grid-cols-3">
            {steps.map((s) => (
              <li
                key={s.step}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <div className="text-xs font-bold tracking-widest text-primary-glow">
                  {s.step}
                </div>
                <h3 className="mt-3 text-base font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {s.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-4xl px-4 py-20 md:px-6 md:py-24">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-surface p-10 text-center shadow-elegant md:p-14">
            <div
              className="pointer-events-none absolute inset-0 -z-10"
              style={{ background: "var(--gradient-glow)" }}
              aria-hidden
            />
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              {t("landing.cta.title")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
              {t("landing.cta.subtitle")}
            </p>
            <div className="mt-7 flex justify-center">
              <Link to="/login">
                <Button className="h-12 bg-gradient-primary px-6 text-sm shadow-glow">
                  {t("landing.cta.button")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-card/30">
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
                <GraduationCap className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <div className="text-sm font-semibold">NTU Study</div>
                <div className="text-[11px] text-muted-foreground">
                  {t("landing.footer.copyright", { year: new Date().getFullYear() })}
                </div>
              </div>
            </div>

            <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <a href="#features" className="hover:text-foreground">{t("landing.footer.features")}</a>
              <a href="#how" className="hover:text-foreground">{t("landing.footer.howItWorks")}</a>
              <Link to="/login" className="hover:text-foreground">{t("landing.footer.signIn")}</Link>
              <a href="#" className="hover:text-foreground">{t("landing.footer.privacy")}</a>
              <a href="#" className="hover:text-foreground">{t("landing.footer.terms")}</a>
            </nav>

            <div className="flex items-center gap-2">
              <a
                href="#"
                aria-label="Email"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Mail className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="Twitter"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="GitHub"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Github className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
