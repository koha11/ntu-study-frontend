import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isLeapYear from "dayjs/plugin/isLeapYear";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import localeData from "dayjs/plugin/localeData";
import localizedFormat from "dayjs/plugin/localizedFormat";
import minMax from "dayjs/plugin/minMax";
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

export const calendarLocalizer = dayjsLocalizer(dayjs);
