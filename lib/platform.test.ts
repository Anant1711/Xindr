import { describe, expect, it } from "vitest";
import { shouldShowIosInstallHint } from "./platform";

const IPHONE_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const IPHONE_CHROME =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/129.0 Mobile/15E148 Safari/604.1";
const MAC_SAFARI =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
const ANDROID_CHROME =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36";

const base = { platform: "iPhone", maxTouchPoints: 5, standalone: false };

describe("shouldShowIosInstallHint", () => {
  it("shows in iPhone Safari", () => {
    expect(
      shouldShowIosInstallHint({ ...base, userAgent: IPHONE_SAFARI }),
    ).toBe(true);
  });
  it("hides once installed", () => {
    expect(
      shouldShowIosInstallHint({
        ...base,
        userAgent: IPHONE_SAFARI,
        standalone: true,
      }),
    ).toBe(false);
  });
  it("hides in Chrome on iPhone", () => {
    expect(
      shouldShowIosInstallHint({ ...base, userAgent: IPHONE_CHROME }),
    ).toBe(false);
  });
  it("shows on iPad (reports as a touch Mac)", () => {
    expect(
      shouldShowIosInstallHint({
        userAgent: MAC_SAFARI,
        platform: "MacIntel",
        maxTouchPoints: 5,
        standalone: false,
      }),
    ).toBe(true);
  });
  it("hides on desktop Mac Safari and Android", () => {
    expect(
      shouldShowIosInstallHint({
        userAgent: MAC_SAFARI,
        platform: "MacIntel",
        maxTouchPoints: 0,
        standalone: false,
      }),
    ).toBe(false);
    expect(
      shouldShowIosInstallHint({
        userAgent: ANDROID_CHROME,
        platform: "Linux armv8l",
        maxTouchPoints: 5,
        standalone: false,
      }),
    ).toBe(false);
  });
});
