"use client";

import * as React from "react";
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
      setScheduleError("Choose a start date and time.");
      return;
    }
    const startDate = new Date(scheduleStart);
    if (Number.isNaN(startDate.getTime())) {
      setScheduleError("Invalid start date.");
      return;
    }
    let endIso: string | undefined;
    if (scheduleEnd.trim()) {
      const endDate = new Date(scheduleEnd);
      if (Number.isNaN(endDate.getTime())) {
        setScheduleError("Invalid end date.");
        return;
      }
      if (endDate.getTime() <= startDate.getTime()) {
        setScheduleError("End time must be after start time.");
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
      toast.success("Calendar event created and invitations sent.");
    } catch (e) {
      const raw = e instanceof HttpError ? e.message : "";
      const msg =
        raw?.trim() ||
        (e instanceof Error ? e.message : "") ||
        "Could not create the meeting.";
      setScheduleError(msg);
      if (e instanceof HttpError && e.status === 403) {
        toast.error(
          "Google Calendar access is missing. Sign out and sign in again to grant permission.",
        );
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="shadow-sm">
          Schedule Meet &amp; invite
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[min(90vh,640px)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule Meet &amp; invite</DialogTitle>
          <DialogDescription>
            Creates a one-time Google Calendar event with Meet and invites all{" "}
            <span className="font-medium text-foreground">active</span> members. This does not change
            the group&apos;s saved Meet link above.
          </DialogDescription>
        </DialogHeader>
        {scheduleResult ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Meeting created. Share the link below or open it in Calendar.
            </p>
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <p className="text-xs font-medium text-muted-foreground">Meet</p>
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
                    () => toast.success("Meet link copied"),
                    () => toast.error("Could not copy"),
                  );
                }}
              >
                Copy Meet link
              </Button>
              <Button type="button" size="sm" className="bg-gradient-primary" asChild>
                <a
                  href={scheduleResult.meet_link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open Meet
                </a>
              </Button>
              {scheduleResult.html_link ? (
                <Button type="button" variant="secondary" size="sm" asChild>
                  <a
                    href={scheduleResult.html_link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open in Calendar
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
                Start (required)
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
                End (optional — defaults to 1 hour after start)
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
            {scheduleResult ? "Close" : "Cancel"}
          </Button>
          {scheduleResult ? null : (
            <Button
              type="button"
              className="bg-gradient-primary"
              disabled={meetEventPending}
              onClick={() => void handleSubmit()}
            >
              {meetEventPending ? "Creating…" : "Create & invite"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
