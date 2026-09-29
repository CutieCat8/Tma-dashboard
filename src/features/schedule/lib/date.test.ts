import { describe, expect, it } from "vitest";
import {
  RangeExceedsMaxError,
  getViewDateInterval,
  getWeekdayOfDate,
  isValidDateString,
} from "./date";

describe("getWeekdayOfDate", () => {
  it("does not shift the date by one day regardless of local timezone parsing quirks", () => {
    // 2026-06-01 is a Monday.
    expect(getWeekdayOfDate("2026-06-01")).toBe(1);
    // 2026-06-07 is a Sunday.
    expect(getWeekdayOfDate("2026-06-07")).toBe(0);
  });
});

describe("isValidDateString", () => {
  it("rejects impossible calendar dates", () => {
    expect(isValidDateString("2026-02-30")).toBe(false);
    expect(isValidDateString("2026-06-01")).toBe(true);
  });
});

describe("getViewDateInterval", () => {
  it("computes week as Monday-Sunday regardless of event presence", () => {
    const interval = getViewDateInterval({ view: "week", activeDate: "2026-06-03" });
    expect(interval).toEqual({ start: "2026-06-01", end: "2026-06-07" });
  });

  it("computes month as first-last day of month", () => {
    const interval = getViewDateInterval({ view: "month", activeDate: "2026-02-15" });
    expect(interval).toEqual({ start: "2026-02-01", end: "2026-02-28" });
  });

  it("throws when a custom range exceeds the max instead of truncating silently", () => {
    expect(() =>
      getViewDateInterval({
        view: "range",
        activeDate: "2026-06-01",
        selectedRange: { from: "2026-01-01", to: "2026-12-31" },
      })
    ).toThrow(RangeExceedsMaxError);
  });
});
