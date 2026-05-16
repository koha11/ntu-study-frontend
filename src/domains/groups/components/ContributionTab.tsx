import * as React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useGroupEvaluationRounds } from "@/domains/contributions";
import { OpenEvaluationDialog } from "./OpenEvaluationDialog";
import { EvaluationRoundCard } from "./EvaluationRoundCard";
import { OverallScoreModal } from "./OverallScoreModal";

interface ContributionTabProps {
  groupId: string;
  isLeader: boolean;
  groupLocked: boolean;
}

export function ContributionTab({ groupId, isLeader, groupLocked }: ContributionTabProps) {
  const { t } = useTranslation();
  const { data: rounds = [], isLoading, isError } = useGroupEvaluationRounds(groupId);
  const [openDialog, setOpenDialog] = React.useState(false);
  const [openOverall, setOpenOverall] = React.useState(false);

  const closedRounds = rounds.filter((r) => r.isClosed);

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">{t("groups.contribution.title")}</h3>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {t("groups.contribution.subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {closedRounds.length > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenOverall(true)}
            >
              {t("groups.contribution.viewOverallScore")}
            </Button>
          )}
          {isLeader && !groupLocked && (
            <Button
              type="button"
              variant="outline"
              className="border-warning/40 text-warning hover:bg-warning/10"
              onClick={() => setOpenDialog(true)}
            >
              {t("groups.contribution.openEvaluation")}
            </Button>
          )}
        </div>
      </div>

      <OpenEvaluationDialog groupId={groupId} open={openDialog} onOpenChange={setOpenDialog} />
      <OverallScoreModal
        groupId={groupId}
        closedRounds={closedRounds}
        open={openOverall}
        onOpenChange={setOpenOverall}
      />

      <div className="mt-8 rounded-xl border border-dashed border-border/70 bg-muted/10 p-8">
        {isLoading ? (
          <p className="text-center text-sm text-muted-foreground">{t("groups.contribution.loading")}</p>
        ) : isError ? (
          <p className="text-center text-sm text-destructive">{t("groups.contribution.couldNotLoad")}</p>
        ) : rounds.length === 0 ? (
          <p className="text-center text-sm font-medium text-muted-foreground">
            {t("groups.contribution.noRoundsYet")}
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
