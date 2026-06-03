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
import { HttpError } from "@/domains/auth/auth-api";
import { useCreateGroupMeetEvent } from "@/domains/groups/hooks/useCreateGroupMeetEvent";
import { toast } from "sonner";
import type { CreateGroupMeetEventResult } from "../types";

export interface GroupScheduleMeetDialogProps {
  groupId: string;
}

export function GroupScheduleMeetDialog({ groupId }: GroupScheduleMeetDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [scheduleStart, setScheduleStart] = React.useState("");
  const [scheduleEnd, setScheduleEnd] = React.useState("");
  const [scheduleResult, setScheduleResult] =
    React.useState<CreateGroupMeetEventResult | null>(null);
  const [scheduleError, setScheduleError] = React.useState<string | null>(null);

  const { mutateAsync: createMeetEvent, isPending: meetEventPending } =
    useCreateGroupMeetEvent();

  const resetForm = React.useCallback(() => {
    setScheduleStart("");
    setScheduleEnd("");
    setScheduleResult(null);
    setScheduleError(null);
  }, []);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      resetForm();
    }
  };

  const handleSubmit = async () => {
    setScheduleError(null);
    if (!scheduleStart.trim()) {
      setScheduleError(t("groups.scheduleMeet.chooseStart"));
      return;
    }
    const startDate = new Date(scheduleStart);
    if (Number.isNaN(startDate.getTime())) {
      setScheduleError(t("groups.scheduleMeet.invalidStart"));
      return;
    }
    let endIso: string | undefined;
    if (scheduleEnd.trim()) {
      const endDate = new Date(scheduleEnd);
      if (Number.isNaN(endDate.getTime())) {
        setScheduleError(t("groups.scheduleMeet.invalidEnd"));
        return;
      }
      if (endDate.getTime() <= startDate.getTime()) {
        setScheduleError(t("groups.scheduleMeet.endAfterStart"));
        return;
      }
      endIso = endDate.toISOString();
    }

    try {
      const result = await createMeetEvent({
        groupId,
        input: {
          start: startDate.toISOString(),
          ...(endIso ? { end: endIso } : {}),
        },
      });
      setScheduleResult(result);
      toast.success(t("groups.scheduleMeet.eventCreated"));
    } catch (e) {
      const raw = e instanceof HttpError ? e.message : "";
      const msg =
        raw?.trim() ||
        (e instanceof Error ? e.message : "") ||
        t("groups.scheduleMeet.couldNotCreate");
      setScheduleError(msg);
      if (e instanceof HttpError && e.status === 403) {
        toast.error(t("groups.scheduleMeet.missingCalendarAccess"));
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="shadow-sm">
          {t("groups.scheduleMeet.triggerButton")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[min(90vh,640px)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("groups.scheduleMeet.title")}</DialogTitle>
          <DialogDescription>
            {t("groups.scheduleMeet.desc")}
          </DialogDescription>
        </DialogHeader>
        {scheduleResult ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              {t("groups.scheduleMeet.meetingCreated")}
            </p>
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <p className="text-xs font-medium text-muted-foreground">{t("groups.scheduleMeet.meetLabel")}</p>
              <a
                href={scheduleResult.meet_link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 break-all text-sm text-primary hover:underline"
              >
                {scheduleResult.meet_link}
              </a>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  void navigator.clipboard.writeText(scheduleResult.meet_link).then(
                    () => toast.success(t("groups.scheduleMeet.meetLinkCopied")),
                    () => toast.error(t("groups.scheduleMeet.couldNotCopy")),
                  );
                }}
              >
                {t("groups.scheduleMeet.copyMeetLink")}
              </Button>
              <Button type="button" size="sm" className="bg-gradient-primary" asChild>
                <a
                  href={scheduleResult.meet_link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("groups.scheduleMeet.openMeet")}
                </a>
              </Button>
              {scheduleResult.html_link ? (
                <Button type="button" variant="secondary" size="sm" asChild>
                  <a
                    href={scheduleResult.html_link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("groups.scheduleMeet.openInCalendar")}
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div>
              <Label
                htmlFor="schedule-start"
                className="text-xs font-medium text-muted-foreground"
              >
                {t("groups.scheduleMeet.startRequired")}
              </Label>
              <Input
                id="schedule-start"
                type="datetime-local"
                className="mt-1"
                value={scheduleStart}
                onChange={(e) => setScheduleStart(e.target.value)}
                disabled={meetEventPending}
              />
            </div>
            <div>
              <Label
                htmlFor="schedule-end"
                className="text-xs font-medium text-muted-foreground"
              >
                {t("groups.scheduleMeet.endOptional")}
              </Label>
              <Input
                id="schedule-end"
                type="datetime-local"
                className="mt-1"
                value={scheduleEnd}
                onChange={(e) => setScheduleEnd(e.target.value)}
                disabled={meetEventPending}
              />
            </div>
            {scheduleError ? (
              <p className="text-sm text-destructive" role="alert">
                {scheduleError}
              </p>
            ) : null}
          </div>
        )}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={meetEventPending}
            onClick={() => setOpen(false)}
          >
            {scheduleResult ? t("common.close") : t("common.cancel")}
          </Button>
          {scheduleResult ? null : (
            <Button
              type="button"
              className="bg-gradient-primary"
              disabled={meetEventPending}
              onClick={() => void handleSubmit()}
            >
              {meetEventPending ? t("groups.scheduleMeet.creating") : t("groups.scheduleMeet.createInvite")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
