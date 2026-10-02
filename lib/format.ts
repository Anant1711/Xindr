import { formatInTimeZone } from "date-fns-tz";
import { APP_TZ } from "@/lib/constants";

type Level = "beginner" | "intermediate" | "pro";
type Gender = "woman" | "man" | "other";
type TimeOfDay = "morning" | "evening";

const LEVEL_LABEL: Record<Level, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  pro: "Pro",
};
const GENDER_LABEL: Record<Gender, string> = {
  woman: "Woman",
  man: "Man",
  other: "Other",
};
const TIME_LABEL: Record<TimeOfDay, string> = {
  morning: "Mornings",
  evening: "Evenings",
};

export const levelLabel = (level: Level) => LEVEL_LABEL[level];
export const genderLabel = (gender: Gender) => GENDER_LABEL[gender];
export const timeOfDayLabel = (t: TimeOfDay) => TIME_LABEL[t];

/** "Priya S." */
export function displayName(firstName: string, lastInitial: string) {
  return `${firstName} ${lastInitial.toUpperCase()}.`;
}

/** Area-centre to area-centre, so always approximate. */
export function distanceLabel(card: {
  same_gym: boolean;
  distance_km: number;
}) {
  if (card.same_gym) return "Same gym";
  if (card.distance_km < 0.5) return "Same area";
  return `${Number(card.distance_km.toFixed(1))} km`;
}

const dayKey = (d: Date, tz: string) => formatInTimeZone(d, tz, "yyyy-MM-dd");

function dayOffset(date: Date, now: Date, tz: string) {
  const a = Date.parse(dayKey(date, tz));
  const b = Date.parse(dayKey(now, tz));
  return Math.round((a - b) / 86_400_000);
}

/** "Today, 6:30 PM" · "Tomorrow, 7:00 AM" · "Saturday, 7:00 AM" (in APP_TZ). */
export function slotLabel(
  date: Date,
  now: Date = new Date(),
  tz: string = APP_TZ,
) {
  const offset = dayOffset(date, now, tz);
  const day =
    offset === 0
      ? "Today"
      : offset === 1
        ? "Tomorrow"
        : formatInTimeZone(date, tz, "EEEE");
  return `${day}, ${formatInTimeZone(date, tz, "h:mm a")}`;
}

/** Chat list time: "9:41 AM" today, "Yesterday", otherwise "12 Oct" (in APP_TZ). */
export function relativeTime(
  date: Date,
  now: Date = new Date(),
  tz: string = APP_TZ,
) {
  const offset = dayOffset(date, now, tz);
  if (offset === 0) return formatInTimeZone(date, tz, "h:mm a");
  if (offset === -1) return "Yesterday";
  return formatInTimeZone(date, tz, "d MMM");
}

/** Chat day separator: "Today", "Yesterday", else "Mon, 12 Oct" (in APP_TZ). */
export function dayLabel(
  date: Date,
  now: Date = new Date(),
  tz: string = APP_TZ,
) {
  const offset = dayOffset(date, now, tz);
  if (offset === 0) return "Today";
  if (offset === -1) return "Yesterday";
  return formatInTimeZone(date, tz, "EEE, d MMM");
}

/** "6:30 PM" in APP_TZ. */
export function timeLabel(date: Date, tz: string = APP_TZ) {
  return formatInTimeZone(date, tz, "h:mm a");
}

/** Same calendar day in APP_TZ. */
export function sameDay(a: Date, b: Date, tz: string = APP_TZ) {
  return dayOffset(a, b, tz) === 0;
}
