"use client";

/**
 * Tiny label above the time column (Google Calendar shows local offset).
 */
export function GroupTimeGutterHeader() {
  const offsetMin = -new Date().getTimezoneOffset();
  const sign = offsetMin >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMin);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const label =
    m === 0 ? `GMT${sign}${h}` : `GMT${sign}${h}:${String(m).padStart(2, "0")}`;

  return (
    <div className="flex min-h-[84px] items-end justify-center self-stretch pb-2 text-[10px] font-medium leading-tight text-[#70757a] dark:text-[#94a3b8]">
      {label}
    </div>
  );
}
