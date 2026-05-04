import * as React from "react";
import { Button } from "@/components/ui/button";
import { useGroupEvaluationRounds } from "@/domains/contributions";
import { OpenEvaluationDialog } from "./OpenEvaluationDialog";
import { EvaluationRoundCard } from "./EvaluationRoundCard";

interface ContributionTabProps {
  groupId: string;
  isLeader: boolean;
  groupLocked: boolean;
}

export function ContributionTab({ groupId, isLeader, groupLocked }: ContributionTabProps) {
  const { data: rounds = [], isLoading, isError } = useGroupEvaluationRounds(groupId);
  const [openDialog, setOpenDialog] = React.useState(false);

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">Anonymous contribution rating</h3>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Rate each member&apos;s contribution from 0 (none) to 10 (outstanding). Ratings are
            anonymous and aggregated after the leader closes the round.
          </p>
        </div>
        {isLeader && !groupLocked && (
          <Button
            type="button"
            variant="outline"
            className="border-warning/40 text-warning hover:bg-warning/10"
            onClick={() => setOpenDialog(true)}
          >
            Open evaluation
          </Button>
        )}
      </div>

      <OpenEvaluationDialog groupId={groupId} open={openDialog} onOpenChange={setOpenDialog} />

      <div className="mt-8 rounded-xl border border-dashed border-border/70 bg-muted/10 p-8">
        {isLoading ? (
          <p className="text-center text-sm text-muted-foreground">Loading…</p>
        ) : isError ? (
          <p className="text-center text-sm text-destructive">Could not load evaluation rounds.</p>
        ) : rounds.length === 0 ? (
          <p className="text-center text-sm font-medium text-muted-foreground">
            The leader has not opened evaluation yet.
          </p>
        ) : (
          <ul className="space-y-6">
            {rounds.map((r) => (
              <li key={r.roundStartedAt}>
                <EvaluationRoundCard groupId={groupId} round={r} isLeader={isLeader} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
