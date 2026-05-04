import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  Plus,
  RotateCw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  useFlashcardsList,
  useFlashcardDetails,
  useCompleteFlashcardStudy,
  useDeleteFlashcardSet,
} from "@/domains/flashcards";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function formatNextReview(iso: string | null | undefined): string {
  if (!iso) return "Not scheduled";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

export type FlashcardsPageProps = {
  /** When navigating from create flow with `?studySet=` */
  studySetParam?: string;
  clearStudyParam?: () => void;
};

export function FlashcardsPage({ studySetParam, clearStudyParam }: FlashcardsPageProps = {}) {
  const { data: flashcardSets = [], isLoading } = useFlashcardsList();
  const { mutate: deleteFlashcardSet, isPending: isDeletingSet } = useDeleteFlashcardSet();
  const [studyingSetId, setStudyingSetId] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name: string } | null>(
    null,
  );

  React.useEffect(() => {
    if (!studySetParam) return;
    setStudyingSetId(studySetParam);
    clearStudyParam?.();
  }, [studySetParam, clearStudyParam]);

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading flashcard sets...</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Flashcards</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Spaced-repetition study sets across your courses.
          </p>
        </div>
        <Button className="bg-gradient-primary shadow-glow" asChild>
          <Link to="/flashcards/new">
            <Plus className="h-4 w-4" /> New set
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {flashcardSets.map((s) => (
          <div
            key={s.id}
            className="group rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-elegant"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex items-center gap-1">
                <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                  {s.cardCount} cards
                </span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label={`Delete flashcard set ${s.name}`}
                  onClick={() => setDeleteTarget({ id: s.id, name: s.name })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <h3 className="mt-3 font-semibold">{s.name}</h3>
            <div className="text-xs text-muted-foreground">{s.subject || "—"}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              Next review (set): {formatNextReview(s.nextReviewAt)}
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                onClick={() => setStudyingSetId(s.id)}
                disabled={s.cardCount === 0}
                className="flex-1 bg-gradient-primary"
              >
                Study
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to="/flashcards/$setId/edit" params={{ setId: s.id }}>
                  Edit
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {studyingSetId && <StudyMode setId={studyingSetId} onClose={() => setStudyingSetId(null)} />}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !isDeletingSet) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete flashcard set?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete “{deleteTarget?.name}” and all of its cards. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingSet}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeletingSet}
              onClick={() => {
                if (!deleteTarget) return;
                const id = deleteTarget.id;
                deleteFlashcardSet(id, {
                  onSuccess: () => {
                    setDeleteTarget(null);
                    setStudyingSetId((current) => (current === id ? null : current));
                  },
                });
              }}
            >
              {isDeletingSet ? "Deleting…" : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function StudyMode({ setId, onClose }: { setId: string; onClose: () => void }) {
  const { data: set, isLoading } = useFlashcardDetails(setId);
  const { mutate: completeStudy } = useCompleteFlashcardStudy();
  const sessionScoresRef = React.useRef<number[]>([]);

  const cards = set?.cards ?? [];
  const [idx, setIdx] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);

  React.useEffect(() => {
    sessionScoresRef.current = [];
    setIdx(0);
    setFlipped(false);
  }, [setId]);

  const card = cards[idx];

  const flushSession = React.useCallback(() => {
    const scores = sessionScoresRef.current;
    const score =
      scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 50;
    completeStudy({ setId, score });
  }, [completeStudy, setId]);

  const handleClose = React.useCallback(() => {
    flushSession();
    onClose();
  }, [flushSession, onClose]);

  const isFirst = idx === 0;
  const isLast = cards.length > 0 && idx === cards.length - 1;

  const goNext = React.useCallback(() => {
    setFlipped(false);
    if (cards.length === 0) return;
    if (isLast) {
      handleClose();
      return;
    }
    setIdx((i) => i + 1);
  }, [cards.length, isLast, handleClose]);

  const goPrev = React.useCallback(() => {
    setFlipped(false);
    if (cards.length === 0 || isFirst) return;
    setIdx((i) => i - 1);
  }, [cards.length, isFirst]);

  const goNextRef = React.useRef(goNext);
  const goPrevRef = React.useRef(goPrev);
  goNextRef.current = goNext;
  goPrevRef.current = goPrev;

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        setFlipped((f) => !f);
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNextRef.current();
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrevRef.current();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (isLoading || !set) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-6">
        <div className="text-muted-foreground">Loading cards…</div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-6">
        <div className="max-w-md text-center">
          <p className="text-muted-foreground">This set has no cards yet.</p>
          <Button className="mt-4" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-6">
      <div className="w-full max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Studying — {set.subject || "General"}
            </div>
            <div className="text-xl font-bold">{set.name}</div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-gradient-surface p-3 text-center text-[11px] text-muted-foreground">
          Card {idx + 1} / {cards.length} · Set next review after session: logged when you close
        </div>

        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          className={cn(
            "mt-4 flex min-h-[300px] w-full flex-col items-center justify-center rounded-3xl border-2 p-10 text-center transition-all",
            flipped
              ? "border-primary-glow bg-linear-to-br from-primary/20 to-primary-glow/10 shadow-glow"
              : "border-border bg-card hover:border-primary/40",
          )}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {flipped ? "Answer" : "Question"}
          </div>
          <div className="mt-4 text-2xl font-semibold leading-snug">
            {flipped ? card.back : card.front}
          </div>
          <div className="mt-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <RotateCw className="h-3 w-3" /> Click or Space to flip · ← → to navigate
          </div>
        </button>

        <div className="mt-4 flex items-center justify-between gap-3">
          <Button variant="outline" onClick={goPrev} disabled={isFirst}>
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <Button variant="outline" onClick={goNext}>
            {isLast ? (
              <>Finish</>
            ) : (
              <>
                Next <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
