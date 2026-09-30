import { describe, expect, it } from "vitest";
import { AVATAR_COLORS } from "@/lib/constants";
import { avatarColor } from "./Avatar";

describe("avatarColor", () => {
  it("is deterministic for the same id", () => {
    const id = "6f1c2a9e-0b7d-4c1e-9a55-2d3f4e5a6b7c";
    expect(avatarColor(id)).toBe(avatarColor(id));
  });

  it("always picks from the muted palette", () => {
    for (const id of [
      "a",
      "b",
      "zzzz",
      "00000000-0000-0000-0000-000000000000",
    ]) {
      expect(AVATAR_COLORS).toContain(avatarColor(id));
    }
  });
});
