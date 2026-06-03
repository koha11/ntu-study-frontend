import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isLeapYear from "dayjs/plugin/isLeapYear";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import localeData from "dayjs/plugin/localeData";
import localizedFormat from "dayjs/plugin/localizedFormat";
import minMax from "dayjs/plugin/minMax";
import updateLocale from "dayjs/plugin/updateLocale";
import utc from "dayjs/plugin/utc";
import { dayjsLocalizer } from "react-big-calendar";

dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(localeData);
dayjs.extend(localizedFormat);
dayjs.extend(minMax);
dayjs.extend(utc);
dayjs.extend(isLeapYear);
dayjs.extend(updateLocale);
dayjs.updateLocale("en", { weekStart: 1 });

const localizer = dayjsLocalizer(dayjs);

// dayjsLocalizer.merge() calls .utc(true) which reinterprets local-time strings as UTC,
// shifting every time boundary by the browser's UTC offset (e.g. +7 h in UTC+7).
// Override to stay in local mode so min/max/scrollToTime work at true local times.
// With this fix, getMinutesFromMidnight() returns 0 for a midnight min, so the
// original getSlotDate correctly places slots at 12 AM, 1 AM, 2 AM … without patching.
(localizer as unknown as { merge: (d: Date | null, t: Date | null) => Date | null }).merge = (date: Date | null, time: Date | null): Date | null => {
  if (!date && !time) return null;
  const tm = dayjs(time).format("HH:mm:ss");
  const dt = dayjs(date).startOf("day").format("MM/DD/YYYY");
  return dayjs(`${dt} ${tm}`).toDate();
};

export const calendarLocalizer = localizer;
