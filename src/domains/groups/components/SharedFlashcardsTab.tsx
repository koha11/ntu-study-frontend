import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Share2, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  groupSharedFlashcardsQueryOptions,
  useShareFlashcardSetMutation,
  useUnshareFlashcardSetMutation,
  flashcardsListQueryOptions,
} from "@/domains/flashcards/queries";
import { StudyMode } from "@/domains/flashcards/components/StudyMode";

interface SharedFlashcardsTabProps {
  groupId: string;
  currentUserId: string;
  groupLocked?: boolean;
}

export function SharedFlashcardsTab({ groupId, currentUserId, groupLocked = false }: SharedFlashcardsTabProps) {
  const { t } = useTranslation();
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false);
  const [studyingSetId, setStudyingSetId] = React.useState<string | null>(null);

  const { data: sharedSets = [], isLoading: sharedLoading } = useQuery(
    groupSharedFlashcardsQueryOptions(groupId),
  );
  const { data: mySets = [], isLoading: mySetsLoading } = useQuery(
    flashcardsListQueryOptions(),
  );

  const { mutate: shareSet, isPending: sharePending } = useShareFlashcardSetMutation();
  const { mutate: unshareSet, isPending: unsharePending } = useUnshareFlashcardSetMutation();

  const sharedSetIds = new Set(sharedSets.map((s) => s.setId));
  const availableToShare = mySets.filter((s) => !sharedSetIds.has(s.id));

  function handleShare(setId: string) {
    shareSet(
      { setId, groupId },
      {
        onSuccess: () => {
          toast.success(t("groups.sharedFlashcards.sharedWithGroup"));
          setShareDialogOpen(false);
        },
        onError: (err: Error) => {
          toast.error(err.message || t("groups.sharedFlashcards.failedToShare"));
        },
      },
    );
  }

  function handleUnshare(setId: string) {
    unshareSet(
      { setId, groupId },
      {
        onError: (err: Error) => {
          toast.error(err.message || t("groups.sharedFlashcards.failedToRemove"));
        },
      },
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{t("groups.sharedFlashcards.title")}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("groups.sharedFlashcards.subtitle")}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="bg-gradient-primary shrink-0"
          disabled={groupLocked}
          onClick={() => setShareDialogOpen(true)}
        >
          <Share2 className="mr-1.5 h-3.5 w-3.5" />
          {t("groups.sharedFlashcards.shareASet")}
        </Button>
      </div>

      {sharedLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">{t("groups.sharedFlashcards.loading")}</p>
      ) : sharedSets.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-2 py-6 text-center">
          <BookOpen className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">{t("groups.sharedFlashcards.noSetsShared")}</p>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-border">
          {sharedSets.map((entry) => {
            const isOwner = entry.ownerId === currentUserId;
            return (
              <li
                key={entry.shareId}
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{entry.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {entry.subject ? `${entry.subject} · ` : ""}
                    {entry.cardCount} {t("groups.sharedFlashcards.cards_other")}
                    {isOwner ? ` · ${t("groups.sharedFlashcards.sharedByYou")}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="bg-gradient-primary"
                    disabled={entry.cardCount === 0}
                    onClick={() => setStudyingSetId(entry.setId)}
                  >
                    {t("groups.sharedFlashcards.study")}
                  </Button>
                  {isOwner && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={unsharePending || groupLocked}
                      onClick={() => handleUnshare(entry.setId)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {studyingSetId != null && (
        <StudyMode setId={studyingSetId} onClose={() => setStudyingSetId(null)} />
      )}

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("groups.sharedFlashcards.shareDialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("groups.sharedFlashcards.shareDialogDesc")}
            </DialogDescription>
          </DialogHeader>
          {mySetsLoading ? (
            <p className="py-4 text-sm text-muted-foreground">{t("groups.sharedFlashcards.loadingYourSets")}</p>
          ) : availableToShare.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">
              {mySets.length === 0
                ? t("groups.sharedFlashcards.noSetsToShare")
                : t("groups.sharedFlashcards.allAlreadyShared")}
            </p>
          ) : (
            <ul className="mt-2 max-h-80 divide-y divide-border overflow-y-auto">
              {availableToShare.map((set) => (
                <li key={set.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{set.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {set.subject ? `${set.subject} · ` : ""}
                      {set.cardCount} {t("groups.sharedFlashcards.cards_other")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={sharePending}
                    onClick={() => handleShare(set.id)}
                  >
                    {t("groups.sharedFlashcards.share")}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
