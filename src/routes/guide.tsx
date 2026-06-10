import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import {
  Users,
  CheckSquare,
  Sparkles,
  ArrowLeft,
  ImageIcon,
  FolderOpen,
  ClipboardList,
  CalendarDays,
  GitPullRequest,
  Star,
  Lock,
  UserPlus,
  PlayCircle,
  X,
  ZoomIn,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import ntuLogo from "@/assets/ntu_logo.png";
import groupStep1 from "@/assets/group-step1.png";
import groupStep2 from "@/assets/group-step2.png";
import groupStep3 from "@/assets/group-step3.png";
import groupStep4_1 from "@/assets/group-step4_1.png";
import groupStep4_2 from "@/assets/group-step4_2.png";
import groupStep5 from "@/assets/group-step5.png";
import groupStep6_1 from "@/assets/group-step6_1.png";
import groupStep6_2 from "@/assets/group-step6_2.png";
import groupStep6_3 from "@/assets/group-step6_3.png";
import groupStep7_1 from "@/assets/group-step7_1.png";
import groupStep7_2 from "@/assets/group-step7_2.png";
import todoList from "@/assets/todo-list.png";
import flashcard from "@/assets/flashcard.png";

export const Route = createFileRoute("/guide")({
  head: () => ({
    meta: [
      { title: "Hướng dẫn sử dụng — NTU Study" },
      { name: "description", content: "Hướng dẫn sử dụng NTU Study" },
    ],
  }),
  component: GuidePage,
});

/* ─── Static phase metadata (icon, id, step, reverse — language-neutral) ── */

const PHASE_META = [
  { id: "create-group", key: "createGroup", icon: Users, step: 1, reverse: false, images: [groupStep1] },
  { id: "invite-members", key: "inviteMembers", icon: UserPlus, step: 2, reverse: true, images: [groupStep2] },
  { id: "setup-resources", key: "setupResources", icon: FolderOpen, step: 3, reverse: false, images: [groupStep3] },
  { id: "assign-tasks", key: "assignTasks", icon: ClipboardList, step: 4, reverse: true, images: [groupStep4_1, groupStep4_2] },
  { id: "calendar-events", key: "calendarEvents", icon: CalendarDays, step: 5, reverse: false, images: [groupStep5] },
  { id: "review-tasks", key: "reviewTasks", icon: GitPullRequest, step: 6, reverse: true, images: [groupStep6_1, groupStep6_2, groupStep6_3] },
  { id: "peer-evaluation", key: "peerEvaluation", icon: Star, step: 7, reverse: false, images: [groupStep7_1, groupStep7_2] },
  { id: "close-project", key: "closeProject", icon: Lock, step: 8, reverse: true, images: [] },
];

const FEATURE_META = [
  { id: "tasks", key: "tasks", icon: CheckSquare, reverse: false, image: todoList },
  { id: "flashcards", key: "flashcards", icon: Sparkles, reverse: true, image: flashcard },
];

/* ─── Components ─────────────────────────────────────────────────────────── */

function ImagePlaceholder({ alt }: { alt: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/40">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <ImageIcon className="h-12 w-12 opacity-40" />
        <span className="text-sm font-medium opacity-60">{alt}</span>
        <span className="text-xs opacity-40">{t("guide.imagePlaceholder")}</span>
      </div>
    </div>
  );
}

function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        onClick={onClose}
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>
      <img
        src={src}
        alt={alt}
        className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body,
  );
}

function ZoomableImage({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="group relative cursor-zoom-in" onClick={() => setOpen(true)}>
        <img
          src={src}
          alt={alt}
          className="w-full rounded-2xl border border-border object-contain shadow-sm transition-opacity group-hover:opacity-90"
        />
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm">
            <ZoomIn className="h-5 w-5" />
          </div>
        </div>
      </div>
      {open && <Lightbox src={src} alt={alt} onClose={() => setOpen(false)} />}
    </>
  );
}

function PhaseCard({
  meta,
  isLast,
}: {
  meta: (typeof PHASE_META)[number];
  isLast: boolean;
}) {
  const { t } = useTranslation();
  const Icon = meta.icon;
  const base = `guide.phases.${meta.key}` as const;
  const steps = t(`${base}.steps`, { returnObjects: true }) as string[];
  const tips = t(`${base}.tips`, { returnObjects: true }) as string[];
  const hasImages = meta.images.length > 0;

  return (
    <section
      id={meta.id}
      className={[
        "flex flex-col gap-10 py-14 md:py-20 lg:flex-row lg:items-start lg:gap-16",
        meta.reverse ? "lg:flex-row-reverse" : "",
        !isLast ? "border-b border-border/60" : "",
      ].join(" ")}
    >
      {/* Text */}
      <div className="flex-1 space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="h-5 w-5 text-primary-glow" />
          </div>
          <span className="rounded-full border border-border bg-card/60 px-3 py-0.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            {t("guide.stepLabel", { step: meta.step })}
          </span>
        </div>

        <div>
          <h3 className="text-2xl font-bold tracking-tight md:text-3xl">
            {t(`${base}.title`)}
          </h3>
          <p className="mt-2 text-base font-medium text-primary-glow">
            {t(`${base}.subtitle`)}
          </p>
        </div>

        <p className="text-base leading-relaxed text-muted-foreground">
          {t(`${base}.description`)}
        </p>

        <ol className="space-y-3">
          {Array.isArray(steps) &&
            steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary-glow">
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed text-muted-foreground">
                  {step}
                </span>
              </li>
            ))}
        </ol>

        {Array.isArray(tips) && tips.length > 0 && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">
              {t("guide.tipsLabel")}
            </p>
            <ul className="space-y-1.5">
              {tips.map((tip, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/60" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Image */}
      <div className="flex-1 lg:sticky lg:top-24">
        {hasImages ? (
          <div className="flex flex-col gap-4">
            {meta.images.map((src, i) => (
              <ZoomableImage key={i} src={src} alt={t(`${base}.imageAlt`)} />
            ))}
          </div>
        ) : (
          <ImagePlaceholder alt={t(`${base}.imageAlt`)} />
        )}
      </div>
    </section>
  );
}

function FeatureSection({
  meta,
  isLast,
}: {
  meta: (typeof FEATURE_META)[number];
  isLast: boolean;
}) {
  const { t } = useTranslation();
  const Icon = meta.icon;
  const base = `guide.features.${meta.key}` as const;
  const steps = t(`${base}.steps`, { returnObjects: true }) as string[];

  return (
    <section
      id={meta.id}
      className={[
        "flex flex-col gap-10 py-16 md:py-24 lg:flex-row lg:items-center lg:gap-16",
        meta.reverse ? "lg:flex-row-reverse" : "",
        !isLast ? "border-b border-border/60" : "",
      ].join(" ")}
    >
      <div className="flex-1 space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="h-5 w-5 text-primary-glow" />
          </div>
          <span className="rounded-full border border-border bg-card/60 px-3 py-0.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            {t(`${base}.badge`)}
          </span>
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            {t(`${base}.title`)}
          </h2>
          <p className="mt-2 text-base font-medium text-primary-glow">
            {t(`${base}.subtitle`)}
          </p>
        </div>
        <p className="text-base leading-relaxed text-muted-foreground">
          {t(`${base}.description`)}
        </p>
        <ol className="space-y-3">
          {Array.isArray(steps) &&
            steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary-glow">
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed text-muted-foreground">
                  {step}
                </span>
              </li>
            ))}
        </ol>
      </div>
      <div className="flex-1">
        <ZoomableImage src={meta.image} alt={t(`${base}.imageAlt`)} />
      </div>
    </section>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

function GuidePage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 md:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src={ntuLogo}
              alt="Trường Đại học Nha Trang"
              className="h-9 w-9 shrink-0 rounded-full object-contain"
            />
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">NTU Study</div>
              <div className="text-[10px] text-muted-foreground">
                {t("landing.tagline")}
              </div>
            </div>
          </Link>

          <nav className="ml-8 hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#group-workflow" className="transition-colors hover:text-foreground">
              {t("guide.nav.groups")}
            </a>
            <a href="#tasks" className="transition-colors hover:text-foreground">
              {t("guide.nav.tasks")}
            </a>
            <a href="#flashcards" className="transition-colors hover:text-foreground">
              {t("guide.nav.flashcards")}
            </a>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link
              to="/dashboard"
              className="hidden h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-medium transition-colors hover:bg-accent sm:inline-flex"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t("guide.backToDashboard")}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: "var(--gradient-glow)" }}
          aria-hidden
        />
        <div className="mx-auto max-w-6xl px-4 py-16 text-center md:px-6 md:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-primary-glow">
            <Sparkles className="h-3 w-3" /> {t("guide.hero.badge")}
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-5xl">
            {t("guide.hero.title1")}{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              {t("guide.hero.title2")}
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
            {t("guide.hero.subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#group-workflow"
              className="inline-flex h-10 items-center rounded-lg bg-gradient-primary px-5 text-sm font-medium text-white shadow-glow transition-opacity hover:opacity-90"
            >
              {t("guide.hero.readBtn")}
            </a>
            <Link
              to="/login"
              className="inline-flex h-10 items-center rounded-lg border border-border bg-card px-5 text-sm font-medium transition-colors hover:bg-accent"
            >
              {t("guide.hero.loginBtn")}
            </Link>
          </div>
        </div>
      </section>

      {/* Group workflow section */}
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <section id="group-workflow" className="pt-16 md:pt-24">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <PlayCircle className="h-5 w-5 text-primary-glow" />
            </div>
            <span className="rounded-full border border-border bg-card/60 px-3 py-0.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              {t("guide.groupWorkflow.badge")}
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            {t("guide.groupWorkflow.title")}
          </h2>
          <p className="mt-3 max-w-2xl text-base font-medium text-primary-glow">
            {t("guide.groupWorkflow.subtitle")}
          </p>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
            {t("guide.groupWorkflow.intro")}
          </p>

          {/* Step index pills */}
          <div className="mt-8 flex flex-wrap gap-2">
            {PHASE_META.map((p) => (
              <a
                key={p.id}
                href={`#${p.id}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary-glow">
                  {p.step}
                </span>
                {t(`guide.phases.${p.key}.title`)}
              </a>
            ))}
          </div>
        </section>

        {/* Phase cards */}
        <div className="mt-10 border-t border-border/60">
          {PHASE_META.map((phase, i) => (
            <PhaseCard
              key={phase.id}
              meta={phase}
              isLast={i === PHASE_META.length - 1}
            />
          ))}
        </div>

        {/* Other feature sections */}
        <div className="border-t border-border/60">
          {FEATURE_META.map((section, i) => (
            <FeatureSection
              key={section.id}
              meta={section}
              isLast={i === FEATURE_META.length - 1}
            />
          ))}
        </div>
      </div>

      {/* CTA */}
      <section className="border-t border-border/60 bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center md:px-6 md:py-20">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            {t("guide.cta.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            {t("guide.cta.subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/login"
              className="inline-flex h-11 items-center rounded-lg bg-gradient-primary px-6 text-sm font-medium text-white shadow-glow transition-opacity hover:opacity-90"
            >
              {t("guide.cta.startBtn")}
            </Link>
            <Link
              to="/"
              className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-border bg-card px-5 text-sm font-medium transition-colors hover:bg-accent"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t("guide.cta.homeBtn")}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-6 md:px-6">
          <span className="text-xs text-muted-foreground">
            {t("guide.footer.copyright")}
          </span>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link to="/privacy" className="transition-colors hover:text-foreground">
              {t("guide.footer.privacy")}
            </Link>
            <Link to="/terms" className="transition-colors hover:text-foreground">
              {t("guide.footer.terms")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
