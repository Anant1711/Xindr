import { describe, expect, it } from "vitest";
import { slotLabel } from "./format";
import { suggestSlots } from "./slots";

// Day index: 0 = Monday ... 6 = Sunday.
const MON = 0,
  TUE = 1,
  WED = 2,
  THU = 3,
  FRI = 4,
  SAT = 5,
  SUN = 6;

// Times are given in UTC; IST = UTC + 5:30.
const iso = (d: Date) => d.toISOString();

describe("suggestSlots", () => {
  it("uses shared days and returns the earliest 3, sorted", () => {
    // Thu 1 Oct 2026, 10:00 IST
    const now = new Date("2026-10-01T04:30:00Z");
    const { slots, overlap } = suggestSlots({
      now,
      sharedDays: [MON, WED, FRI, SAT],
      targetDays: [MON, WED, FRI, SAT, SUN],
      timeOfDay: "evening",
    });
    expect(overlap).toBe(true);
    // Fri 2 Oct, Sat 3 Oct, Mon 5 Oct at 18:30 IST (13:00 UTC). Wed is next week, so it is 4th.
    expect(slots.map(iso)).toEqual([
      "2026-10-02T13:00:00.000Z",
      "2026-10-03T13:00:00.000Z",
      "2026-10-05T13:00:00.000Z",
    ]);
  });

  it("wraps from Sunday to Monday", () => {
    // Sun 4 Oct 2026, 20:00 IST — today's slot has passed.
    const now = new Date("2026-10-04T14:30:00Z");
    const { slots } = suggestSlots({
      now,
      sharedDays: [MON, SUN],
      targetDays: [MON, SUN],
      timeOfDay: "morning",
    });
    // Mon 5 Oct 07:00 IST, then next Sun 11 Oct 07:00 IST.
    expect(slots.map(iso)).toEqual([
      "2026-10-05T01:30:00.000Z",
      "2026-10-11T01:30:00.000Z",
    ]);
  });

  it("skips today when the slot is less than 3 hours away", () => {
    // Thu 1 Oct, 16:00 IST: 18:30 today is only 2.5 h away.
    const now = new Date("2026-10-01T10:30:00Z");
    const { slots } = suggestSlots({
      now,
      sharedDays: [THU],
      targetDays: [THU],
      timeOfDay: "evening",
    });
    expect(slots.map(iso)).toEqual(["2026-10-08T13:00:00.000Z"]);
  });

  it("keeps today when the slot is exactly 3 hours away or more", () => {
    // Thu 1 Oct, 15:30 IST: 18:30 is exactly 3 h away.
    const now = new Date("2026-10-01T10:00:00Z");
    const { slots } = suggestSlots({
      now,
      sharedDays: [THU],
      targetDays: [THU],
      timeOfDay: "evening",
    });
    expect(slots.map(iso)).toEqual(["2026-10-01T13:00:00.000Z"]);
  });

  it("converts IST correctly across the UTC date line", () => {
    // Thu 1 Oct, 23:00 IST is 17:30 UTC the same day; Friday 07:00 IST is 01:30 UTC Friday.
    const now = new Date("2026-10-01T17:30:00Z");
    const { slots } = suggestSlots({
      now,
      sharedDays: [FRI],
      targetDays: [FRI],
      timeOfDay: "morning",
    });
    expect(slots.map(iso)).toEqual(["2026-10-02T01:30:00.000Z"]);
    expect(slotLabel(slots[0], now)).toBe("Tomorrow, 7:00 AM");
  });

  it("returns a single slot for a single candidate day", () => {
    const now = new Date("2026-10-01T04:30:00Z");
    const { slots } = suggestSlots({
      now,
      sharedDays: [TUE],
      targetDays: [TUE, THU],
      timeOfDay: "evening",
    });
    expect(slots).toHaveLength(1);
    expect(iso(slots[0])).toBe("2026-10-06T13:00:00.000Z");
  });

  it("falls back to the target's days when there is no overlap", () => {
    const now = new Date("2026-10-01T04:30:00Z");
    const { slots, overlap } = suggestSlots({
      now,
      sharedDays: [],
      targetDays: [SAT, SUN],
      timeOfDay: "morning",
    });
    expect(overlap).toBe(false);
    expect(slots.map(iso)).toEqual([
      "2026-10-03T01:30:00.000Z",
      "2026-10-04T01:30:00.000Z",
    ]);
  });

  it("with no days at all, offers the next 3 calendar days", () => {
    // Thu 1 Oct, 17:00 IST: 18:30 today is too soon, so Fri, Sat, Sun.
    const now = new Date("2026-10-01T11:30:00Z");
    const { slots, overlap } = suggestSlots({
      now,
      sharedDays: [],
      targetDays: [],
      timeOfDay: "evening",
    });
    expect(overlap).toBe(false);
    expect(slots.map(iso)).toEqual([
      "2026-10-02T13:00:00.000Z",
      "2026-10-03T13:00:00.000Z",
      "2026-10-04T13:00:00.000Z",
    ]);
  });

  it("returns unique slots", () => {
    const now = new Date("2026-10-01T04:30:00Z");
    const { slots } = suggestSlots({
      now,
      sharedDays: [WED, WED, WED],
      targetDays: [WED],
      timeOfDay: "evening",
    });
    expect(slots).toHaveLength(1);
  });
});
