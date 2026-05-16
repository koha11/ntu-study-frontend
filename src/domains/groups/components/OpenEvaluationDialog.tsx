import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { useOpenEvaluationRound } from "@/domains/contributions";
import { useTranslation } from "react-i18next";

interface OpenEvaluationDialogProps {
  groupId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OpenEvaluationDialog({ groupId, open, onOpenChange }: OpenEvaluationDialogProps) {
  const { t } = useTranslation();
  const { mutateAsync, isPending } = useOpenEvaluationRound();
  const [deadlineDate, setDeadlineDate] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!deadlineDate) {
      setError(t("groups.openEvaluationDialog.errorNoDate"));
      return;
    }
    const parts = deadlineDate.split("-").map(Number);
    const due = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999);
    if (Number.isNaN(due.getTime())) {
      setError(t("groups.openEvaluationDialog.errorInvalidDate"));
      return;
    }
    if (due.getTime() <= Date.now()) {
      setError(t("groups.openEvaluationDialog.errorPastDate"));
      return;
    }
    try {
      await mutateAsync({ groupId, dueDateIso: due.toISOString() });
      setDeadlineDate("");
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("groups.openEvaluationDialog.errorGeneric"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("groups.openEvaluationDialog.title")}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {t("groups.openEvaluationDialog.description")}
        </p>
        <div className="mt-4">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="eval-deadline">
            {t("groups.openEvaluationDialog.deadlineLabel")}
          </label>
          <DatePicker
            id="eval-deadline"
            value={deadlineDate}
            onChange={setDeadlineDate}
            placeholder={t("groups.openEvaluationDialog.deadlinePlaceholder")}
          />
        </div>
        {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            className="bg-gradient-primary"
            disabled={isPending}
            onClick={() => void handleSubmit()}
          >
            {isPending ? t("groups.openEvaluationDialog.opening") : t("groups.openEvaluationDialog.open")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
