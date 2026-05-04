"use client";

import * as React from "react";
import type { Event as CalendarEventModel, ToolbarProps, View } from "react-big-calendar";
import type { GroupCalendarEventRow } from "@/domains/groups/types";

type CalendarTabEvent = CalendarEventModel & {
  id?: string;
  resource: GroupCalendarEventRow;
};
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

dayjs.extend(isoWeek);

export function formatToolbarRange(date: Date, view: View): string {
  if (view === "day") {
    return dayjs(date).format("dddd, MMMM D, YYYY");
  }
  const start = dayjs(date).startOf("isoWeek");
  const end = dayjs(date).endOf("isoWeek");
  if (start.year() !== end.year()) {
    return `${start.format("MMM D, YYYY")} – ${end.format("MMM D, YYYY")}`;
  }
  if (start.month() !== end.month()) {
    return `${start.format("MMM D")} – ${end.format("MMM D, YYYY")}`;
  }
  return `${start.format("MMM D")} – ${end.format("D, YYYY")}`;
}

export function GroupCalendarToolbar({
  date,
  view,
  onNavigate,
  onView,
}: ToolbarProps<CalendarTabEvent>) {
  const title = React.useMemo(() => formatToolbarRange(date, view), [date, view]);

  return (
    <div className="gcal-toolbar flex flex-wrap items-center justify-between gap-3 border-b border-[#dadce0] bg-white px-3 py-2.5 sm:px-4">
      <div className="flex min-w-0 flex-wrap items-center gap-1 sm:gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "h-9 rounded-full border-[#dadce0] px-4 text-sm font-medium text-[#5f6368]",
            "bg-white hover:bg-[#f1f3f4]",
          )}
          onClick={() => onNavigate("TODAY")}
        >
          Today
        </Button>
        <div className="flex items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-full text-[#5f6368] hover:bg-[#f1f3f4]"
            aria-label="Previous"
            onClick={() => onNavigate("PREV")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-full text-[#5f6368] hover:bg-[#f1f3f4]"
            aria-label="Next"
            onClick={() => onNavigate("NEXT")}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        <h2 className="min-w-0 truncate text-lg font-normal tracking-tight text-[#3c4043] sm:text-[22px] sm:leading-7">
          {title}
        </h2>
      </div>

      <Select value={view} onValueChange={(v) => onView(v as View)}>
        <SelectTrigger
          className={cn(
            "h-9 w-[110px] rounded-lg border-[#dadce0] bg-white text-sm font-medium text-[#3c4043]",
            "hover:bg-[#f8f9fa]",
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          <SelectItem value="week">Week</SelectItem>
          <SelectItem value="day">Day</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
