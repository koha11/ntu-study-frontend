"use client";

import * as React from "react";
import {
  Calendar,
  type DateLocalizer,
  type SlotInfo,
  type View,
} from "react-big-calendar";
import type { Event as RBCEventModel } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./group-calendar.css";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { calendarLocalizer } from "./calendar-localizer";
import { groupCalendarEventsQueryOptions } from "@/domains/groups/queries";
import { useUpdateGroup } from "@/domains/groups/hooks/useUpdateGroup";
import type { GroupCalendarEventRow } from "@/domains/groups/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScheduleGroupCalendarEventDialog } from "./ScheduleGroupCalendarEventDialog";
import { GroupCalendarToolbar } from "./GroupCalendarToolbar";
import { GroupCalendarDayHeader } from "./GroupCalendarDayHeader";
import { GroupTimeGutterHeader } from "./GroupTimeGutterHeader";
import { cn } from "@/lib/utils";

dayjs.extend(isoWeek);

export interface CalendarTabProps {
  groupId: string;
  groupName: string;
  google_calendar_id: string | null | undefined;
  meet_link: string | null | undefined;
  isLeader: boolean;
}

type RBCEvent = RBCEventModel & {
  id?: string;
  resource: GroupCalendarEventRow;
};

function toRbcEvent(ev: GroupCalendarEventRow): RBCEvent {
  const sRaw = ev.start.dateTime ?? ev.start.date;
  const eRaw = ev.end.dateTime ?? ev.end.date;
  const start = sRaw ? new Date(sRaw) : new Date();
  let end = eRaw ? new Date(eRaw) : new Date();
  const allDay = Boolean(ev.start.date && !ev.start.dateTime);
  if (allDay && end <= start) {
    end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  }
  return {
    id: ev.id,
    title: ev.summary,
    start,
    end,
    allDay,
    resource: ev,
  };
}

function rangeForView(date: Date, view: View): { timeMin: string; timeMax: string } {
  const d = dayjs(date);
  if (view === "day") {
    return {
      timeMin: d.startOf("day").toISOString(),
      timeMax: d.endOf("day").toISOString(),
    };
  }
  return {
    timeMin: d.startOf("isoWeek").toISOString(),
    timeMax: d.endOf("isoWeek").toISOString(),
  };
}

export function CalendarTab({
  groupId,
  groupName,
  google_calendar_id,
  meet_link,
  isLeader,
}: CalendarTabProps) {
  const [view, setView] = React.useState<View>("week");
  const [date, setDate] = React.useState(() => new Date());
  const [slotDraft, setSlotDraft] = React.useState<{ start: Date; end: Date } | null>(null);
  const [calInput, setCalInput] = React.useState(google_calendar_id ?? "");

  React.useEffect(() => {
    setCalInput(google_calendar_id ?? "");
  }, [google_calendar_id]);

  const range = React.useMemo(() => rangeForView(date, view), [date, view]);

  const hasCalendar = Boolean(google_calendar_id?.trim());

  const { data: rawEvents = [], isLoading, isError, error } = useQuery({
    ...groupCalendarEventsQueryOptions(groupId, hasCalendar ? range : null),
    enabled: Boolean(groupId && hasCalendar),
  });

  const events = React.useMemo(() => rawEvents.map(toRbcEvent), [rawEvents]);

  const { mutate: patchGroup, isPending: savingCalId } = useUpdateGroup();

  const calendarFormats = React.useMemo(
    () => ({
      timeGutterFormat: (d: Date, culture?: string, localizer?: DateLocalizer) =>
        localizer ? localizer.format(d, "h A", culture) : dayjs(d).format("h A"),
    }),
    [],
  );

  /** Time-of-day only; week/day grid shows [min, max] (12:00 AM – 11:59 PM). */
  const { calendarMin, calendarMax, scrollToTime } = React.useMemo(() => {
    const min = new Date(2018, 0, 1, 0, 0, 0);
    const max = new Date(2018, 0, 1, 23, 59, 0);
    const scroll = new Date(2018, 0, 1, 0, 0, 0);
    return { calendarMin: min, calendarMax: max, scrollToTime: scroll };
  }, []);

  const calendarComponents = React.useMemo(
    () => ({
      toolbar: GroupCalendarToolbar,
      timeGutterHeader: GroupTimeGutterHeader,
      week: { header: GroupCalendarDayHeader },
      day: { header: GroupCalendarDayHeader },
    }),
    [],
  );

  const handleSaveCalendarId = () => {
    const v = calInput.trim();
    patchGroup({
      id: groupId,
      data: { google_calendar_id: v.length > 0 ? v : null },
    });
  };

  const handleSelectSlot = (slot: SlotInfo) => {
    if (!isLeader) return;
    setSlotDraft({ start: slot.start, end: slot.end });
  };

  const handleSelectEvent = (ev: RBCEvent) => {
    const url = ev.resource.html_link;
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  if (!hasCalendar) {
    return (
      <div className="rounded-xl border border-border bg-card/40 p-6">
        <h2 className="text-lg font-semibold">Connect a Google Calendar</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          When you create a group while signed in with Google, we usually add a shared calendar
          automatically. If this group does not have one yet, create a secondary calendar in Google
          Calendar, open{" "}
          <span className="font-medium text-foreground">Settings → Integrate calendar</span>, and
          copy the <span className="font-medium text-foreground">Calendar ID</span> (it often ends with{" "}
          <code className="text-xs">@group.calendar.google.com</code>).
        </p>
        {isLeader ? (
          <div className="mt-4 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="gcal-id">Calendar ID</Label>
              <Input
                id="gcal-id"
                value={calInput}
                onChange={(e) => setCalInput(e.target.value)}
                placeholder="xxxx@group.calendar.google.com"
                className="font-mono text-sm"
              />
            </div>
            <Button
              type="button"
              className="bg-gradient-primary"
              disabled={savingCalId}
              onClick={handleSaveCalendarId}
            >
              {savingCalId ? "Saving…" : "Save"}
            </Button>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Only the group leader can connect the calendar.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isLeader ? (
        <details className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm">
          <summary className="cursor-pointer font-medium text-foreground">Calendar settings</summary>
          <div className="mt-3 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="gcal-id-edit">Calendar ID</Label>
              <Input
                id="gcal-id-edit"
                value={calInput}
                onChange={(e) => setCalInput(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            <Button type="button" variant="secondary" disabled={savingCalId} onClick={handleSaveCalendarId}>
              {savingCalId ? "Saving…" : "Update"}
            </Button>
          </div>
        </details>
      ) : null}

      <div className={cn("min-w-0 w-full", isLoading && "opacity-75")}>
        {isError ? (
          <div className="rounded-xl border border-border bg-card p-4 text-sm text-destructive">
            {(error as Error)?.message ?? "Could not load calendar events."}
          </div>
        ) : (
          <div className="gcal-skin w-full min-w-0">
            <Calendar<RBCEvent>
              localizer={calendarLocalizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ minHeight: 560, width: "100%" }}
              view={view}
              views={["week", "day"]}
              date={date}
              min={calendarMin}
              max={calendarMax}
              onNavigate={(d: Date) => setDate(d)}
              onView={(v: View) => setView(v)}
              selectable={isLeader}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={(ev: RBCEvent) => handleSelectEvent(ev)}
              step={60}
              timeslots={1}
              formats={calendarFormats}
              scrollToTime={scrollToTime}
              components={calendarComponents}
              messages={{
                today: "Today",
                previous: "Back",
                next: "Next",
                week: "Week",
                day: "Day",
              }}
            />
          </div>
        )}
      </div>

      {!isLeader ? (
        <p className="text-xs text-muted-foreground">
          View-only: only the leader can create events by clicking a time slot.
        </p>
      ) : null}

      {slotDraft ? (
        <ScheduleGroupCalendarEventDialog
          open
          onOpenChange={(v) => {
            if (!v) setSlotDraft(null);
          }}
          groupId={groupId}
          groupName={groupName}
          meetLink={meet_link}
          defaultRange={slotDraft}
        />
      ) : null}
    </div>
  );
}
