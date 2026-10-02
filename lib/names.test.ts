import { describe, expect, it } from "vitest";
import { initialOf, nameFor, namesFromMetadata } from "./names";

describe("namesFromMetadata", () => {
  it("prefers given and family names", () => {
    expect(
      namesFromMetadata({
        given_name: "Anant",
        family_name: "Chauhan",
        full_name: "x y",
      }),
    ).toEqual({
      firstName: "Anant",
      lastName: "Chauhan",
    });
  });
  it("splits Google's full_name on the first space", () => {
    expect(namesFromMetadata({ full_name: "  Priya  Van der Berg " })).toEqual({
      firstName: "Priya",
      lastName: "Van der Berg",
    });
  });
  it("handles a single name and missing metadata", () => {
    expect(namesFromMetadata({ name: "Madonna" })).toEqual({
      firstName: "Madonna",
      lastName: "",
    });
    expect(namesFromMetadata(null)).toEqual({ firstName: "", lastName: "" });
    expect(namesFromMetadata({ full_name: 42 })).toEqual({
      firstName: "",
      lastName: "",
    });
  });
  it("trims to the length limits", () => {
    const out = namesFromMetadata({
      given_name: "a".repeat(50),
      family_name: "b".repeat(50),
    });
    expect(out.firstName).toHaveLength(30);
    expect(out.lastName).toHaveLength(40);
  });
});

describe("initialOf / nameFor", () => {
  it("derives an uppercase initial, including non-Latin", () => {
    expect(initialOf(" chauhan")).toBe("C");
    expect(initialOf("çelik")).toBe("Ç");
  });
  it("shows the full name only when the last name is visible", () => {
    expect(nameFor("Anant", "c", "Chauhan")).toBe("Anant Chauhan");
    expect(nameFor("Anant", "c", null)).toBe("Anant C.");
  });
});
