import * as React from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import type { MyRatingEntry } from "@/domains/contributions/types";
import { useSubmitRoundRating } from "@/domains/contributions";

interface RatingFormProps {
  groupId: string;
  roundStartedAt: string;
  entries: MyRatingEntry[];
}

export function RatingForm({ groupId, roundStartedAt, entries }: RatingFormProps) {
  const { mutateAsync, isPending } = useSubmitRoundRating();
  const entriesKey = entries.map((e) => `${e.rateeId}:${e.score ?? ""}`).join("|");

  const [scores, setScores] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    setScores((prev) => {
      const next = { ...prev };
      for (const e of entries) {
        next[e.rateeId] = e.score ?? prev[e.rateeId] ?? 5;
      }
      return next;
    });
  }, [entriesKey]);

  const handleSaveAll = async () => {
    for (const e of entries) {
      const score = scores[e.rateeId] ?? 0;
      await mutateAsync({ groupId, roundStartedAt, rateeId: e.rateeId, score });
    }
  };

  return (
    <div className="mt-4 space-y-6">
      {entries.map((e) => (
        <div key={e.rateeId} className="rounded-lg border border-border/60 bg-background/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium text-foreground">
              {e.rateeFullName.trim() || "Member"}
            </span>
            <span className="text-xs text-muted-foreground">
              {scores[e.rateeId] ?? 0} / 10
            </span>
          </div>
          <Slider
            className="mt-3"
            min={0}
            max={10}
            step={1}
            value={[scores[e.rateeId] ?? 0]}
            onValueChange={(v) => setScores((s) => ({ ...s, [e.rateeId]: v[0] ?? 0 }))}
          />
        </div>
      ))}
      <Button
        type="button"
        className="w-full bg-gradient-primary"
        disabled={isPending || entries.length === 0}
        onClick={() => void handleSaveAll()}
      >
        {isPending ? "Saving…" : "Save all ratings"}
      </Button>
    </div>
  );
}
