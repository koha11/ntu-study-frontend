import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/AppShell";
import {
  useFlashcardsList,
  useDeleteFlashcardSet,
} from "@/domains/flashcards";
import { StudyMode } from "./StudyMode";
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

function formatNextReview(iso: string | null | undefined, t: (key: string) => string): string {
  if (!iso) return t("flashcards.notScheduled");
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
  studySetParam?: string;
  clearStudyParam?: () => void;
};

export function FlashcardsPage({ studySetParam, clearStudyParam }: FlashcardsPageProps = {}) {
  const { t } = useTranslation();
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
          <div className="text-muted-foreground">{t("flashcards.loading")}</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("flashcards.pageTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("flashcards.pageSubtitle")}
          </p>
        </div>
        <Button className="bg-gradient-primary shadow-glow" asChild>
          <Link to="/flashcards/new">
            <Plus className="h-4 w-4" /> {t("flashcards.newSet")}
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
                  {s.cardCount} {t("flashcards.cards")}
                </span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label={t("flashcards.deleteSet", { name: s.name })}
                  onClick={() => setDeleteTarget({ id: s.id, name: s.name })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <h3 className="mt-3 font-semibold">{s.name}</h3>
            <div className="text-xs text-muted-foreground">{s.subject || "—"}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              {t("flashcards.nextReview")} {formatNextReview(s.nextReviewAt, t)}
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                onClick={() => setStudyingSetId(s.id)}
                disabled={s.cardCount === 0}
                className="flex-1 bg-gradient-primary"
              >
                {t("flashcards.study")}
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to="/flashcards/$setId/edit" params={{ setId: s.id }}>
                  {t("flashcards.edit")}
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
            <AlertDialogTitle>{t("flashcards.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("flashcards.deleteDesc", { name: deleteTarget?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingSet}>{t("flashcards.cancel")}</AlertDialogCancel>
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
              {isDeletingSet ? t("flashcards.deleting") : t("flashcards.delete")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
