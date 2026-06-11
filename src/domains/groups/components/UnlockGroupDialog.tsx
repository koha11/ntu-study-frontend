"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const MIN_REASON_LENGTH = 10;

export interface UnlockGroupDialogProps {
  open: boolean;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
}

export function UnlockGroupDialog({
  open,
  isPending,
  onOpenChange,
  onConfirm,
}: UnlockGroupDialogProps) {
  const { t } = useTranslation();
  const [reason, setReason] = React.useState("");

  function handleConfirm() {
    if (reason.trim().length >= MIN_REASON_LENGTH) {
      onConfirm(reason.trim());
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) setReason("");
    onOpenChange(next);
  }

  const tooShort = reason.trim().length < MIN_REASON_LENGTH;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("groups.unlock.title")}</DialogTitle>
          <DialogDescription>{t("groups.unlock.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="unlock-reason">{t("groups.unlock.reasonLabel")}</Label>
          <Textarea
            id="unlock-reason"
            rows={4}
            placeholder={t("groups.unlock.reasonPlaceholder")}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isPending}
          />
          {tooShort && reason.length > 0 && (
            <p className="text-xs text-destructive">
              {t("groups.unlock.reasonTooShort", { min: MIN_REASON_LENGTH })}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={tooShort || isPending}
          >
            {isPending ? t("groups.unlock.confirming") : t("groups.unlock.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
