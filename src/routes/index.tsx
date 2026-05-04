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

const features = [
  {
    icon: Users,
    title: "Study groups, organised",
    body: "Spin up a course or project group, invite classmates with one link, and keep everything in a shared workspace.",
  },
  {
    icon: CheckSquare,
    title: "Tasks that move",
    body: "Plan, assign and track work on a Kanban board with sub-tasks, deadlines and automatic reminders.",
  },
  {
    icon: Sparkles,
    title: "Flashcards that stick",
    body: "Build decks together and revise with spaced repetition before assessments — no more scattered notes.",
  },
  {
    icon: TrendingUp,
    title: "Fair contribution scoring",
    body: "Leaders rate teammates at the end of a project so effort is recognised and free-riding is visible.",
  },
  {
    icon: ShieldCheck,
    title: "Locked, audit-ready records",
    body: "Once a project closes, deliverables and ratings are locked and exportable for academic review.",
  },
  {
    icon: GraduationCap,
    title: "Made for NTU",
    body: "Sign in with your NTU Google account. Your groups, files and progress follow you across every module.",
  },
];

const stats = [
  { label: "Active study groups", value: "320+" },
  { label: "Tasks tracked", value: "12.4k" },
  { label: "Flashcards reviewed", value: "98k" },
  { label: "Avg. contribution score", value: "8.6" },
];

function LandingPage() {
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
              <div className="text-[10px] text-muted-foreground">Group collaboration</div>
            </div>
          </Link>

          <nav className="ml-8 hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link
              to="/login"
              className="hidden h-10 items-center rounded-lg border border-border bg-card px-3 text-sm font-medium transition-colors hover:bg-accent sm:inline-flex"
            >
              Sign in
            </Link>
            <Link to="/login">
              <Button className="h-10 bg-gradient-primary shadow-glow">
                Get started <ArrowRight className="h-4 w-4" />
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
              <Sparkles className="h-3 w-3" /> Built for NTU students
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-6xl">
              Study together.{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Ship projects faster.
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
              NTU Study brings groups, tasks, files and flashcards into one
              calm workspace — so your team can focus on the work that
              matters, and leaders can grade contribution fairly.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to="/login">
                <Button className="h-12 bg-gradient-primary px-6 text-sm shadow-glow">
                  Continue with Google <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a
                href="#features"
                className="inline-flex h-12 items-center rounded-lg border border-border bg-card px-5 text-sm font-medium transition-colors hover:bg-accent"
              >
                See how it works
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
              Everything in one place
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              The study workspace your group actually opens
            </h2>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
              Stop juggling chat groups, spreadsheets and shared docs. NTU
              Study replaces the busywork so your team can ship.
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
              Three steps
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              From kickoff to submission, without the chaos
            </h2>
          </div>

          <ol className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Create or join a group",
                body: "Use your NTU Google sign-in and either start a new group or accept an invite link from your leader.",
              },
              {
                step: "02",
                title: "Plan and execute",
                body: "Break the project into tasks, attach files, and review flashcards together as the deadline approaches.",
              },
              {
                step: "03",
                title: "Lock and rate",
                body: "When the project ends, the leader closes the project. Contribution scores are recorded and exported.",
              },
            ].map((s) => (
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
              Ready to study smarter together?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
              Sign in with your NTU Google account and bring your first group
              on board in under a minute.
            </p>
            <div className="mt-7 flex justify-center">
              <Link to="/login">
                <Button className="h-12 bg-gradient-primary px-6 text-sm shadow-glow">
                  Get started — it's free for students
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
                  © {new Date().getFullYear()} NTU Study. A student project.
                </div>
              </div>
            </div>

            <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <a href="#features" className="hover:text-foreground">Features</a>
              <a href="#how" className="hover:text-foreground">How it works</a>
              <Link to="/login" className="hover:text-foreground">Sign in</Link>
              <a href="#" className="hover:text-foreground">Privacy</a>
              <a href="#" className="hover:text-foreground">Terms</a>
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
