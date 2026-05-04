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
            Round opened {new Date(round.roundStartedAt).toLocaleString()}
          </h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Deadline: {new Date(round.dueDate).toLocaleString()}
            {round.isClosed ? " · Closed" : beforeDeadline ? " · Open" : " · Past deadline"}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Progress: {round.ratedCount} / {round.totalCount} ratings submitted (all members)
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
            {closeMutation.isPending ? "Closing…" : "Close round"}
          </Button>
        )}
      </div>

      {round.isClosed && (
        <div className="mt-4">
          <h5 className="text-sm font-medium text-foreground">Aggregated results</h5>
          <p className="mt-1 text-xs text-muted-foreground">
            Averages are anonymous; individual scores are not shown.
          </p>
          {results.isLoading ? (
            <p className="mt-3 text-xs text-muted-foreground">Loading results…</p>
          ) : resultsError?.status === 403 ? (
            <p className="mt-3 text-xs text-destructive">You cannot view these results.</p>
          ) : results.isError ? (
            <p className="mt-3 text-xs text-destructive">Could not load results.</p>
          ) : results.data ? (
            <AggregatedResults results={results.data} />
          ) : null}
        </div>
      )}

      {!round.isClosed && canRate && (
        <div className="mt-4">
          <h5 className="text-sm font-medium text-foreground">Your ratings</h5>
          <p className="mt-1 text-xs text-muted-foreground">
            Rate each member from 0 (none) to 10 (outstanding). You can update until the
            deadline.
          </p>
          {myRatings.isLoading ? (
            <p className="mt-3 text-xs text-muted-foreground">Loading…</p>
          ) : myRatings.isError ? (
            <p className="mt-3 text-xs text-destructive">Could not load your rating form.</p>
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
          The deadline has passed; ratings can no longer be changed. The leader can close this
          round to publish averages.
        </p>
      )}
    </div>
  );
}
