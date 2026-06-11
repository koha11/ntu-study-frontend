import * as React from "react";
import { useQueries } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { roundResultsQueryOptions } from "@/domains/contributions/queries";
import type { EvaluationRound } from "@/domains/contributions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface OverallScoreModalProps {
  groupId: string;
  closedRounds: EvaluationRound[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OverallScoreModal({
  groupId,
  closedRounds,
  open,
  onOpenChange,
}: OverallScoreModalProps) {
  const { t } = useTranslation();

  const results = useQueries({
    queries: closedRounds.map((r) => roundResultsQueryOptions(groupId, r.roundStartedAt)),
  });

  const isLoading = results.some((r) => r.isLoading);

  const rows = React.useMemo(() => {
    const map = new Map<string, { name: string; total: number; count: number }>();
    for (const result of results) {
      if (!result.data) continue;
      for (const entry of result.data) {
        if (entry.averageScore == null) continue;
        const existing = map.get(entry.assigneeId);
        if (existing) {
          existing.total += entry.averageScore;
          existing.count += 1;
        } else {
          map.set(entry.assigneeId, {
            name: entry.assigneeFullName || entry.assigneeId,
            total: entry.averageScore,
            count: 1,
          });
        }
      }
    }
    return Array.from(map.entries())
      .map(([id, { name, total, count }]) => ({ id, name, avg: total / count }))
      .sort((a, b) => b.avg - a.avg);
  }, [results]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("groups.contribution.overallScoreTitle")}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {t("groups.contribution.overallScoreLoading")}
          </p>
        ) : rows.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {t("groups.contribution.overallScoreEmpty")}
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/60">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="px-3 py-2 font-medium text-foreground">
                    {t("groups.contribution.overallScoreMember")}
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-foreground">
                    {t("groups.contribution.overallScoreAvg")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border/50 last:border-0">
                    <td className="px-3 py-2 text-foreground">{r.name}</td>
                    <td className="px-3 py-2 text-right font-medium text-foreground">
                      {r.avg.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
