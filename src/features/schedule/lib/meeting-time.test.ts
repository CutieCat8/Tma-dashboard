import { describe, expect, it } from "vitest";
import { parseLegacyMeetingTime } from "./meeting-time";

describe("parseLegacyMeetingTime", () => {
  it("parses a legacy range that uses colons", () => {
    expect(parseLegacyMeetingTime("13:00 - 14:00 น.")).toEqual({
      startTime: "13:00",
      endTime: "14:00",
    });
  });

  it("parses a legacy range that uses dots", () => {
    expect(parseLegacyMeetingTime("13.00 - 14.00 น.")).toEqual({
      startTime: "13:00",
      endTime: "14:00",
    });
  });

  it("rejects an invalid or reversed range", () => {
    expect(parseLegacyMeetingTime("เวลาไม่ระบุ")).toBeNull();
    expect(parseLegacyMeetingTime("14.00 - 13.00")).toBeNull();
  });
});
