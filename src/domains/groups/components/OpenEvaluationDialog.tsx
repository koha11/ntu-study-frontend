import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOpenEvaluationRound } from "@/domains/contributions";

interface OpenEvaluationDialogProps {
  groupId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OpenEvaluationDialog({ groupId, open, onOpenChange }: OpenEvaluationDialogProps) {
  const { mutateAsync, isPending } = useOpenEvaluationRound();
  const [deadlineLocal, setDeadlineLocal] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!deadlineLocal.trim()) {
      setError("Choose a deadline date and time.");
      return;
    }
    const due = new Date(deadlineLocal);
    if (Number.isNaN(due.getTime())) {
      setError("Invalid date.");
      return;
    }
    if (due.getTime() <= Date.now()) {
      setError("Deadline must be in the future.");
      return;
    }
    try {
      await mutateAsync({ groupId, dueDateIso: due.toISOString() });
      setDeadlineLocal("");
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Open anonymous evaluation</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Every active member will be able to rate every other member (0–10). Ratings stay
          anonymous; averages appear after you close the round.
        </p>
        <div className="mt-4">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="eval-deadline">
            Deadline (local time)
          </label>
          <Input
            id="eval-deadline"
            className="mt-1"
            type="datetime-local"
            value={deadlineLocal}
            onChange={(e) => setDeadlineLocal(e.target.value)}
          />
        </div>
        {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-gradient-primary"
            disabled={isPending}
            onClick={() => void handleSubmit()}
          >
            {isPending ? "Opening…" : "Open evaluation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
