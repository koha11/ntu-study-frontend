"use client";

import type { HeaderProps } from "react-big-calendar";
import dayjs from "dayjs";
import { cn } from "@/lib/utils";

/**
 * Week/day column header: weekday label + date with Google-style “today” circle.
 */
export function GroupCalendarDayHeader({ date }: HeaderProps) {
  const isToday = dayjs(date).isSame(dayjs(), "day");
  const weekday = dayjs(date).format("ddd").toUpperCase();
  const dom = dayjs(date).format("D");

  return (
    <div className="flex w-full max-w-full flex-col items-center justify-center gap-0.5 px-0.5 pt-0.5 pb-1.5">
      <span className="text-[10px] font-medium uppercase leading-tight tracking-wide text-[#70757a] sm:text-[11px]">
        {weekday}
      </span>
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full text-base font-normal tabular-nums leading-none sm:size-9 sm:text-lg",
          isToday ? "bg-[#1a73e8] text-white shadow-sm" : "text-[#3c4043]",
        )}
      >
        {dom}
      </span>
    </div>
  );
}
