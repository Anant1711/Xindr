import { describe, expect, it } from "vitest";
import { fitWithin } from "./encode";

describe("fitWithin", () => {
  it("caps the long side at 1080 and keeps the aspect ratio", () => {
    expect(fitWithin(4032, 3024)).toEqual({ width: 1080, height: 810 });
    expect(fitWithin(3024, 4032)).toEqual({ width: 810, height: 1080 });
  });
  it("never upscales small images", () => {
    expect(fitWithin(640, 480)).toEqual({ width: 640, height: 480 });
  });
});
