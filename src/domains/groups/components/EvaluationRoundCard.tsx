import { useTranslation } from "react-i18next";
import { HttpError } from "@/domains/auth/auth-api";
import type { EvaluationRound } from "@/domains/contributions/types";
import {
  useMyRoundRatings,
  useRoundResults,
  useCloseEvaluationRound,
} from "@/domains/contributions";
import { Button } from "@/components/ui/button";
import { RatingForm } from "./RatingForm";
import { AggregatedResults } from "./AggregatedResults";

interface EvaluationRoundCardProps {
  groupId: string;
  round: EvaluationRound;
  isLeader: boolean;
}

export function EvaluationRoundCard({ groupId, round, isLeader }: EvaluationRoundCardProps) {
  const { t } = useTranslation();
  const closeMutation = useCloseEvaluationRound();
  const now = Date.now();
  const due = new Date(round.dueDate).getTime();
  const beforeDeadline = now <= due;
  const canRate = !round.isClosed && beforeDeadline;

  const myRatings = useMyRoundRatings(groupId, round.roundStartedAt, {
    enabled: canRate,
  });
  const results = useRoundResults(groupId, round.roundStartedAt, {
    enabled: round.isClosed,
  });

  const resultsError =
    results.error instanceof HttpError ? results.error : undefined;

  return (
    <div className="rounded-2xl border border-border bg-card/80 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="font-semibold text-foreground">
            {t("groups.evaluationRoundCard.roundOpened", { date: new Date(round.roundStartedAt).toLocaleString() })}
          </h4>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("groups.evaluationRoundCard.deadline", { date: new Date(round.dueDate).toLocaleString() })}
            {" "}
            {round.isClosed
              ? t("groups.evaluationRoundCard.statusClosed")
              : beforeDeadline
              ? t("groups.evaluationRoundCard.statusOpen")
              : t("groups.evaluationRoundCard.statusPastDeadline")}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("groups.evaluationRoundCard.progress", { rated: round.ratedCount, total: round.totalCount })}
          </p>
        </div>
        {isLeader && !round.isClosed && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-warning/40 text-warning hover:bg-warning/10"
            disabled={closeMutation.isPending}
            onClick={() =>
              closeMutation.mutate({ groupId, roundStartedAt: round.roundStartedAt })
            }
          >
            {closeMutation.isPending ? t("groups.evaluationRoundCard.closing") : t("groups.evaluationRoundCard.closeRound")}
          </Button>
        )}
      </div>

      {round.isClosed && (
        <div className="mt-4">
          <h5 className="text-sm font-medium text-foreground">{t("groups.evaluationRoundCard.aggregatedResults")}</h5>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("groups.evaluationRoundCard.aggregatedResultsDesc")}
          </p>
          {results.isLoading ? (
            <p className="mt-3 text-xs text-muted-foreground">{t("groups.evaluationRoundCard.loadingResults")}</p>
          ) : resultsError?.status === 403 ? (
            <p className="mt-3 text-xs text-destructive">{t("groups.evaluationRoundCard.cannotViewResults")}</p>
          ) : results.isError ? (
            <p className="mt-3 text-xs text-destructive">{t("groups.evaluationRoundCard.couldNotLoadResults")}</p>
          ) : results.data ? (
            <AggregatedResults results={results.data} />
          ) : null}
        </div>
      )}

      {!round.isClosed && canRate && (
        <div className="mt-4">
          <h5 className="text-sm font-medium text-foreground">{t("groups.evaluationRoundCard.yourRatings")}</h5>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("groups.evaluationRoundCard.yourRatingsDesc")}
          </p>
          {myRatings.isLoading ? (
            <p className="mt-3 text-xs text-muted-foreground">{t("groups.evaluationRoundCard.loading")}</p>
          ) : myRatings.isError ? (
            <p className="mt-3 text-xs text-destructive">{t("groups.evaluationRoundCard.couldNotLoadRatingForm")}</p>
          ) : myRatings.data && myRatings.data.length > 0 ? (
            <RatingForm
              groupId={groupId}
              roundStartedAt={round.roundStartedAt}
              entries={myRatings.data}
            />
          ) : null}
        </div>
      )}

      {!round.isClosed && !beforeDeadline && (
        <p className="mt-4 text-sm text-muted-foreground">
          {t("groups.evaluationRoundCard.deadlinePassed")}
        </p>
      )}
    </div>
  );
}
