import { describe, expect, it } from "vitest";
import { validateCourseSchedule } from "./validation";

const validDraft = {
  courseCode: "955110",
  courseName: "Digital Technology",
  termStart: "2026-06-01",
  termEnd: "2026-09-30",
  sessions: [
    { dayOfWeek: 1 as const, startTime: "09:00", endTime: "12:00", location: "Room 101" },
    { dayOfWeek: 3 as const, startTime: "13:00", endTime: "15:00", location: "Room 204" },
  ],
};

describe("validateCourseSchedule", () => {
  it("accepts a valid draft", () => {
    expect(validateCourseSchedule(validDraft).valid).toBe(true);
  });

  it("requires at least one session", () => {
    const result = validateCourseSchedule({ ...validDraft, sessions: [] });
    expect(result.valid).toBe(false);
    expect(result.errors.sessions).toBeTruthy();
  });

  it("rejects termEnd before termStart", () => {
    const result = validateCourseSchedule({ ...validDraft, termStart: "2026-09-30", termEnd: "2026-06-01" });
    expect(result.valid).toBe(false);
    expect(result.errors.termEnd).toBeTruthy();
  });

  it("rejects a session where endTime is not after startTime", () => {
    const result = validateCourseSchedule({
      ...validDraft,
      sessions: [{ dayOfWeek: 1, startTime: "10:00", endTime: "10:00", location: "" }],
    });
    expect(result.valid).toBe(false);
  });

  it("rejects overlapping sessions on the same day", () => {
    const result = validateCourseSchedule({
      ...validDraft,
      sessions: [
        { dayOfWeek: 1, startTime: "09:00", endTime: "11:00", location: "" },
        { dayOfWeek: 1, startTime: "10:00", endTime: "12:00", location: "" },
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.sessions).toBeTruthy();
  });
});
