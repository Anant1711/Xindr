import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { APP_TZ } from "@/lib/constants";

export const DEFAULT_TIME = { morning: "07:00", evening: "18:30" } as const;
const MIN_LEAD_MS = 3 * 60 * 60 * 1000;
const SLOT_COUNT = 3;

type Input = {
  now: Date;
  /** Days both people train, 0 = Monday ... 6 = Sunday. */
  sharedDays: readonly number[];
  /** The other person's usual days. */
  targetDays: readonly number[];
  timeOfDay: "morning" | "evening";
  tz?: string;
};

/** Local calendar date `offset` days after today's date in tz, as yyyy-MM-dd plus its weekday (0 = Monday). */
function localDay(now: Date, offset: number, tz: string) {
  const [y, m, d] = formatInTimeZone(now, tz, "yyyy-MM-dd")
    .split("-")
    .map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + offset));
  const weekday = (date.getUTCDay() + 6) % 7;
  return { iso: date.toISOString().slice(0, 10), weekday };
}

export function suggestSlots({
  now,
  sharedDays,
  targetDays,
  timeOfDay,
  tz = APP_TZ,
}: Input): {
  slots: Date[];
  overlap: boolean;
} {
  const overlap = sharedDays.length > 0;
  const candidates = new Set(overlap ? sharedDays : targetDays);
  const cutoff = now.getTime() + MIN_LEAD_MS;
  const at = (iso: string) =>
    fromZonedTime(`${iso}T${DEFAULT_TIME[timeOfDay]}:00`, tz);

  const slots: Date[] = [];
  if (candidates.size === 0) {
    // No usual days: the next 3 calendar days at the default time.
    for (let offset = 0; slots.length < SLOT_COUNT; offset++) {
      const slot = at(localDay(now, offset, tz).iso);
      if (slot.getTime() >= cutoff) slots.push(slot);
    }
    return { slots, overlap };
  }

  // The next occurrence of each candidate weekday that is at least 3 hours away.
  const pending = new Set(candidates);
  for (let offset = 0; pending.size > 0 && offset < 14; offset++) {
    const { iso, weekday } = localDay(now, offset, tz);
    if (!pending.has(weekday)) continue;
    const slot = at(iso);
    if (slot.getTime() < cutoff) continue;
    slots.push(slot);
    pending.delete(weekday);
  }

  slots.sort((a, b) => a.getTime() - b.getTime());
  return { slots: slots.slice(0, SLOT_COUNT), overlap };
}
