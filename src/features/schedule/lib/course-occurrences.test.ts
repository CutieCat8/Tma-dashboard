import { describe, expect, it } from "vitest";
import { expandCourseOccurrences } from "./course-occurrences";
import { getWeekdayOfDate } from "./date";
import type { CourseSchedule } from "./types";

function makeCourse(overrides: Partial<CourseSchedule> = {}): CourseSchedule {
  return {
    id: "course-1",
    studentId: "65101000",
    courseCode: "955110",
    courseName: "Digital Technology",
    color: "#22c55e",
    defaultLocation: "Room 101",
    notes: "",
    privateNote: "",
    sectionId: "section-1",
    termStart: "2026-06-01",
    termEnd: "2026-09-30",
    sessions: [],
    exceptions: [],
    verificationStatus: "self-reported",
    verifiedBy: null,
    verifiedAt: null,
    verificationNote: "",
    verificationSource: null,
    evidenceRef: null,
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("expandCourseOccurrences", () => {
  it("expands only on the configured weekdays (Monday/Wednesday)", () => {
    const course = makeCourse({
      sessions: [
        { id: "s1", dayOfWeek: 1, startTime: "09:00", endTime: "10:30", location: "Room 101" },
        { id: "s2", dayOfWeek: 3, startTime: "13:00", endTime: "15:00", location: "Room 204" },
      ],
      termStart: "2026-06-01",
      termEnd: "2026-06-14",
    });

    const occurrences = expandCourseOccurrences(course, "2026-06-01", "2026-06-14");
    const weekdays = new Set(occurrences.map((o) => getWeekdayOfDate(o.date)));

    expect(occurrences.every((o) => o.date >= "2026-06-01" && o.date <= "2026-06-14")).toBe(true);
    expect(occurrences.length).toBeGreaterThan(0);
    expect([...weekdays].sort()).toEqual([1, 3]);
  });

  it("never produces an occurrence before termStart or after termEnd", () => {
    const course = makeCourse({
      sessions: [{ id: "s1", dayOfWeek: 1, startTime: "09:00", endTime: "10:00", location: "" }],
      termStart: "2026-06-08", // a Monday
      termEnd: "2026-06-08",
    });

    const occurrences = expandCourseOccurrences(course, "2026-06-01", "2026-06-30");
    expect(occurrences).toHaveLength(1);
    expect(occurrences[0].date).toBe("2026-06-08");
  });

  it("supports multiple sessions on the same day", () => {
    const course = makeCourse({
      sessions: [
        { id: "s1", dayOfWeek: 2, startTime: "08:00", endTime: "09:00", location: "Room A" },
        { id: "s2", dayOfWeek: 2, startTime: "10:00", endTime: "11:00", location: "Room B" },
      ],
      termStart: "2026-06-02", // a Tuesday
      termEnd: "2026-06-02",
    });

    const occurrences = expandCourseOccurrences(course, "2026-06-02", "2026-06-02");
    expect(occurrences).toHaveLength(2);
    expect(occurrences.map((o) => o.location).sort()).toEqual(["Room A", "Room B"]);
  });

  it("skips a cancelled exception date and applies a replacement exception", () => {
    const course = makeCourse({
      sessions: [{ id: "s1", dayOfWeek: 1, startTime: "09:00", endTime: "10:00", location: "Room 101" }],
      termStart: "2026-06-01",
      termEnd: "2026-06-15",
      exceptions: [
        { id: "e1", date: "2026-06-08", type: "cancelled", reason: "Holiday" },
        {
          id: "e2",
          date: "2026-06-15",
          type: "replacement",
          startTime: "14:00",
          endTime: "15:00",
          location: "Room 999",
          reason: "Makeup class",
        },
      ],
    });

    const occurrences = expandCourseOccurrences(course, "2026-06-01", "2026-06-15");
    const dates = occurrences.map((o) => o.date);
    expect(dates).not.toContain("2026-06-08");

    const replaced = occurrences.find((o) => o.date === "2026-06-15");
    expect(replaced).toMatchObject({ startTime: "14:00", endTime: "15:00", location: "Room 999" });
  });
});
