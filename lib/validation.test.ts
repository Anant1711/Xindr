import { describe, expect, it } from "vitest";
import {
  aboutYouSchema,
  emailSchema,
  feedbackSchema,
  messageSchema,
  otpSchema,
  profileInputSchema,
  reportSchema,
  type ProfileInput,
} from "./validation";

const base: ProfileInput = {
  firstName: "  Priya ",
  lastInitial: "s",
  gender: "woman",
  level: "beginner",
  areaId: 1,
  gymId: null,
  timeOfDay: "evening",
  trainingDays: [4, 0, 2, 2],
  focus: "  ",
  showMe: "anyone",
  womenOnlyVisibility: true,
  confirmed18: true,
};

describe("profileInputSchema", () => {
  it("normalises valid input", () => {
    const out = profileInputSchema.parse(base);
    expect(out.firstName).toBe("Priya");
    expect(out.lastInitial).toBe("S");
    expect(out.trainingDays).toEqual([0, 2, 4]);
    expect(out.focus).toBeNull();
  });

  it("requires the 18+ confirmation", () => {
    expect(
      profileInputSchema.safeParse({ ...base, confirmed18: false }).success,
    ).toBe(false);
  });

  it("rejects women-only visibility for men", () => {
    const r = profileInputSchema.safeParse({ ...base, gender: "man" });
    expect(r.success).toBe(false);
  });

  it("allows women-only visibility for other", () => {
    expect(
      profileInputSchema.safeParse({ ...base, gender: "other" }).success,
    ).toBe(true);
  });
});

describe("aboutYouSchema", () => {
  it.each([
    ["empty first name", { firstName: " " }],
    ["first name over 30", { firstName: "x".repeat(31) }],
    ["two-letter initial", { lastInitial: "Ab" }],
    ["non-letter initial", { lastInitial: "1" }],
    ["no training days", { trainingDays: [] }],
    ["day out of range", { trainingDays: [7] }],
    ["focus over 60", { focus: "x".repeat(61) }],
    ["bad gym id", { gymId: "not-a-uuid" }],
    ["unknown level", { level: "elite" }],
  ])("rejects %s", (_label, patch) => {
    expect(aboutYouSchema.safeParse({ ...base, ...patch }).success).toBe(false);
  });

  it("keeps a real focus and gym id", () => {
    const out = aboutYouSchema.parse({
      ...base,
      focus: " Strength ",
      gymId: "3f2b8c1e-5d4a-4f6b-9c8d-7e6f5a4b3c2d",
    });
    expect(out.focus).toBe("Strength");
    expect(out.gymId).toBe("3f2b8c1e-5d4a-4f6b-9c8d-7e6f5a4b3c2d");
  });
});

describe("email and code", () => {
  it("normalises email", () => {
    expect(emailSchema.parse("  Priya@Example.COM ")).toBe("priya@example.com");
  });
  it("rejects bad email", () => {
    expect(emailSchema.safeParse("priya@").success).toBe(false);
  });
  it("accepts only six digits", () => {
    expect(otpSchema.safeParse("123456").success).toBe(true);
    expect(otpSchema.safeParse("12345").success).toBe(false);
    expect(otpSchema.safeParse("12345a").success).toBe(false);
  });
});

describe("feedbackSchema", () => {
  it("trims and bounds the message", () => {
    expect(feedbackSchema.parse({ message: " Ravet " }).message).toBe("Ravet");
    expect(feedbackSchema.safeParse({ message: "   " }).success).toBe(false);
    expect(
      feedbackSchema.safeParse({ message: "x".repeat(1001) }).success,
    ).toBe(false);
  });
});

describe("reportSchema", () => {
  const id = "3f2b8c1e-5d4a-4f6b-9c8d-7e6f5a4b3c2d";
  it("accepts a reason with blank details as null", () => {
    expect(
      reportSchema.parse({
        reportedId: id,
        reason: "harassment",
        details: "  ",
      }).details,
    ).toBeNull();
  });
  it("rejects unknown reasons and long details", () => {
    expect(
      reportSchema.safeParse({ reportedId: id, reason: "spam", details: "" })
        .success,
    ).toBe(false);
    expect(
      reportSchema.safeParse({
        reportedId: id,
        reason: "other",
        details: "x".repeat(1001),
      }).success,
    ).toBe(false);
  });
});

describe("messageSchema", () => {
  it("trims and bounds message bodies", () => {
    expect(messageSchema.parse("  hi  ")).toBe("hi");
    expect(messageSchema.safeParse("   ").success).toBe(false);
    expect(messageSchema.safeParse("x".repeat(2000)).success).toBe(true);
    expect(messageSchema.safeParse("x".repeat(2001)).success).toBe(false);
  });
});
