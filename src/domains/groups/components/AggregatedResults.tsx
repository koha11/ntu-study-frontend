import type { AggregatedRatingResult } from "@/domains/contributions/types";

interface AggregatedResultsProps {
  results: AggregatedRatingResult[];
}

export function AggregatedResults({ results }: AggregatedResultsProps) {
  if (results.length === 0) {
    return <p className="text-sm text-muted-foreground">No submitted scores in this round yet.</p>;
  }

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-border/60">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-muted/30">
          <tr>
            <th className="px-3 py-2 font-medium text-foreground">Member</th>
            <th className="px-3 py-2 font-medium text-foreground">Average score</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.assigneeId} className="border-b border-border/50 last:border-0">
              <td className="px-3 py-2 text-foreground">{r.assigneeFullName || r.assigneeId}</td>
              <td className="px-3 py-2 text-muted-foreground">
                {r.averageScore != null ? r.averageScore.toFixed(2) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
