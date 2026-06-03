"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface GroupQuickLinksEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canvaDraft: string;
  docDraft: string;
  meetDraft: string;
  dateDraft: string;
  onCanvaDraftChange: (value: string) => void;
  onDocDraftChange: (value: string) => void;
  onMeetDraftChange: (value: string) => void;
  onDateDraftChange: (value: string) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function GroupQuickLinksEditDialog({
  open,
  onOpenChange,
  canvaDraft,
  docDraft,
  meetDraft,
  dateDraft,
  onCanvaDraftChange,
  onDocDraftChange,
  onMeetDraftChange,
  onDateDraftChange,
  onSave,
  isSaving,
}: GroupQuickLinksEditDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" className="shrink-0 bg-gradient-primary shadow-glow">
          {t("groups.quickLinksEdit.triggerButton")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[min(90vh,640px)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("groups.quickLinksEdit.title")}</DialogTitle>
          <DialogDescription>
            {t("groups.quickLinksEdit.desc")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label
              htmlFor="overview-canva"
              className="text-xs font-medium text-muted-foreground"
            >
              {t("groups.quickLinksEdit.canvaUrl")}
            </Label>
            <Input
              id="overview-canva"
              type="url"
              className="mt-1"
              placeholder="https://www.canva.com/design/…"
              value={canvaDraft}
              onChange={(e) => onCanvaDraftChange(e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div>
            <Label htmlFor="overview-doc" className="text-xs font-medium text-muted-foreground">
              {t("groups.quickLinksEdit.docUrl")}
            </Label>
            <Input
              id="overview-doc"
              type="url"
              className="mt-1"
              placeholder="https://docs.google.com/document/…"
              value={docDraft}
              onChange={(e) => onDocDraftChange(e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div>
            <Label htmlFor="overview-meet" className="text-xs font-medium text-muted-foreground">
              {t("groups.quickLinksEdit.meetLink")}
            </Label>
            <Input
              id="overview-meet"
              type="url"
              className="mt-1"
              placeholder="https://meet.google.com/…"
              value={meetDraft}
              onChange={(e) => onMeetDraftChange(e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div>
            <Label htmlFor="overview-due" className="text-xs font-medium text-muted-foreground">
              {t("groups.quickLinksEdit.dueDate")}
            </Label>
            <Input
              id="overview-due"
              type="date"
              className="mt-1"
              value={dateDraft}
              onChange={(e) => onDateDraftChange(e.target.value)}
              disabled={isSaving}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={() => onOpenChange(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            className="bg-gradient-primary"
            disabled={isSaving}
            onClick={onSave}
          >
            {isSaving ? t("groups.quickLinksEdit.saving") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
