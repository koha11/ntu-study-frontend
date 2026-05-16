import * as React from "react";
import { RotateCw, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFlashcardDetails, useCompleteFlashcardStudy } from "@/domains/flashcards";

interface StudyModeProps {
  setId: string;
  onClose: () => void;
}

export function StudyMode({ setId, onClose }: StudyModeProps) {
  const { t } = useTranslation();
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
        <div className="text-muted-foreground">{t("flashcards.studyMode.loadingCards")}</div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-6">
        <div className="max-w-md text-center">
          <p className="text-muted-foreground">{t("flashcards.studyMode.noCards")}</p>
          <Button className="mt-4" onClick={onClose}>
            {t("flashcards.studyMode.close")}
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
              {t("flashcards.studyMode.studying")} {set.subject || t("flashcards.studyMode.general")}
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
          {t("flashcards.studyMode.cardProgress", { current: idx + 1, total: cards.length })}
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
            {flipped ? t("flashcards.studyMode.answer") : t("flashcards.studyMode.question")}
          </div>
          <div className="mt-4 text-2xl font-semibold leading-snug">
            {flipped ? card.back : card.front}
          </div>
          <div className="mt-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <RotateCw className="h-3 w-3" /> {t("flashcards.studyMode.flipHint")}
          </div>
        </button>

        <div className="mt-4 flex items-center justify-between gap-3">
          <Button variant="outline" onClick={goPrev} disabled={isFirst}>
            <ChevronLeft className="h-4 w-4" /> {t("flashcards.studyMode.previous")}
          </Button>
          <Button variant="outline" onClick={goNext}>
            {isLast ? <>{t("flashcards.studyMode.finish")}</> : <>{t("flashcards.studyMode.next")} <ChevronRight className="h-4 w-4" /></>}
          </Button>
        </div>
      </div>
    </div>
  );
}
