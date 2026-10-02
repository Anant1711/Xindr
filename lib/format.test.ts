import { describe, expect, it } from "vitest";
import {
  dayLabel,
  displayName,
  distanceLabel,
  genderLabel,
  levelLabel,
  relativeTime,
  sameDay,
  slotLabel,
  timeLabel,
  timeOfDayLabel,
} from "./format";

// 2026-10-01 is a Thursday. 10:00 IST = 04:30 UTC.
const NOW = new Date("2026-10-01T04:30:00Z");

describe("labels", () => {
  it("maps enums to display text", () => {
    expect(levelLabel("intermediate")).toBe("Intermediate");
    expect(genderLabel("other")).toBe("Other");
    expect(timeOfDayLabel("morning")).toBe("Mornings");
    expect(timeOfDayLabel("evening")).toBe("Evenings");
  });

  it("formats display names", () => {
    expect(displayName("Priya", "s")).toBe("Priya S.");
  });
});

describe("distanceLabel", () => {
  it("prefers same gym", () => {
    expect(distanceLabel({ same_gym: true, distance_km: 3.4 })).toBe(
      "Same gym",
    );
  });
  it("treats under 0.5 km as the same area", () => {
    expect(distanceLabel({ same_gym: false, distance_km: 0 })).toBe(
      "Same area",
    );
    expect(distanceLabel({ same_gym: false, distance_km: 0.49 })).toBe(
      "Same area",
    );
  });
  it("shows kilometres otherwise", () => {
    expect(distanceLabel({ same_gym: false, distance_km: 0.5 })).toBe("0.5 km");
    expect(distanceLabel({ same_gym: false, distance_km: 3 })).toBe("3 km");
    expect(distanceLabel({ same_gym: false, distance_km: 4.6 })).toBe("4.6 km");
  });
});

describe("slotLabel (Asia/Kolkata)", () => {
  it("says Today", () => {
    // 18:30 IST on Oct 1 = 13:00 UTC
    expect(slotLabel(new Date("2026-10-01T13:00:00Z"), NOW)).toBe(
      "Today, 6:30 PM",
    );
  });
  it("says Tomorrow", () => {
    // 07:00 IST on Oct 2 = 01:30 UTC
    expect(slotLabel(new Date("2026-10-02T01:30:00Z"), NOW)).toBe(
      "Tomorrow, 7:00 AM",
    );
  });
  it("uses the weekday further out", () => {
    // 07:00 IST Sat Oct 3
    expect(slotLabel(new Date("2026-10-03T01:30:00Z"), NOW)).toBe(
      "Saturday, 7:00 AM",
    );
  });
  it("uses the IST date, not the UTC date", () => {
    // 00:30 IST on Oct 2 is still Oct 1 in UTC
    expect(slotLabel(new Date("2026-10-01T19:00:00Z"), NOW)).toBe(
      "Tomorrow, 12:30 AM",
    );
  });
});

describe("relativeTime (Asia/Kolkata)", () => {
  it("shows a time for today", () => {
    expect(relativeTime(new Date("2026-10-01T04:11:00Z"), NOW)).toBe("9:41 AM");
  });
  it("says Yesterday", () => {
    expect(relativeTime(new Date("2026-09-30T12:00:00Z"), NOW)).toBe(
      "Yesterday",
    );
  });
  it("shows day and month for older dates", () => {
    expect(relativeTime(new Date("2026-09-12T12:00:00Z"), NOW)).toBe("12 Sep");
  });
});

describe("dayLabel / timeLabel / sameDay (Asia/Kolkata)", () => {
  it("labels today, yesterday and older days", () => {
    expect(dayLabel(new Date("2026-10-01T02:00:00Z"), NOW)).toBe("Today");
    expect(dayLabel(new Date("2026-09-30T15:00:00Z"), NOW)).toBe("Yesterday");
    expect(dayLabel(new Date("2026-09-12T12:00:00Z"), NOW)).toBe("Sat, 12 Sep");
  });
  it("uses the IST day: 23:30 UTC on 30 Sep is 1 Oct in IST", () => {
    expect(dayLabel(new Date("2026-09-30T19:00:00Z"), NOW)).toBe("Today");
    expect(sameDay(new Date("2026-09-30T19:00:00Z"), NOW)).toBe(true);
  });
  it("formats times", () => {
    expect(timeLabel(new Date("2026-10-01T13:00:00Z"))).toBe("6:30 PM");
  });
});
