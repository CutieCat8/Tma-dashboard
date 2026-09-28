import { describe, expect, it } from "vitest";
import { getAvailabilityForStudents, getStudentConflicts, timeRangesOverlap } from "./conflicts";
import type { CourseSchedule, Meeting } from "./types";

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
    sessions: [{ id: "s1", dayOfWeek: 1, startTime: "09:00", endTime: "10:30", location: "Room 101" }],
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

describe("timeRangesOverlap", () => {
  it("does not conflict when one range ends exactly as the other starts", () => {
    expect(timeRangesOverlap("10:00", "11:00", "11:00", "12:00")).toBe(false);
  });

  it("conflicts on partial overlap", () => {
    expect(timeRangesOverlap("09:00", "10:30", "10:00", "11:00")).toBe(true);
  });

  it("conflicts when one range is nested inside another", () => {
    expect(timeRangesOverlap("09:00", "12:00", "10:00", "10:30")).toBe(true);
  });
});

describe("getStudentConflicts", () => {
  it("marks the student Busy with the conflicting course (Scenario B)", () => {
    // Course on Monday 09:00-10:30; 2026-06-08 is a Monday.
    const course = makeCourse();
    const conflicts = getStudentConflicts({
      courses: [course],
      meetings: [],
      studentId: "65101000",
      date: "2026-06-08",
      startTime: "10:00",
      endTime: "11:00",
    });

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].type).toBe("course");
    expect(conflicts[0].occurrence?.courseCode).toBe("955110");
  });

  it("is Available when the meeting starts exactly as the course ends (Scenario C)", () => {
    const course = makeCourse();
    const conflicts = getStudentConflicts({
      courses: [course],
      meetings: [],
      studentId: "65101000",
      date: "2026-06-08",
      startTime: "10:30",
      endTime: "11:30",
    });

    expect(conflicts).toHaveLength(0);
  });

  it("does not conflict with itself when editing the same meeting", () => {
    const meeting: Meeting = {
      id: "m-1",
      date: "2026-06-08",
      startTime: "10:00",
      endTime: "11:00",
      title: "1:1",
      location: "",
      description: "",
      attendeeMode: "students",
      studentIds: ["65101000"],
      createdAt: "2026-06-01T00:00:00.000Z",
    };

    const conflicts = getStudentConflicts({
      courses: [],
      meetings: [meeting],
      studentId: "65101000",
      date: "2026-06-08",
      startTime: "10:00",
      endTime: "11:00",
      excludeMeetingId: "m-1",
    });

    expect(conflicts).toHaveLength(0);
  });

  it("returns every conflicting item, not just the first", () => {
    const course = makeCourse();
    const meeting: Meeting = {
      id: "m-2",
      date: "2026-06-08",
      startTime: "09:30",
      endTime: "10:00",
      title: "Another 1:1",
      location: "",
      description: "",
      attendeeMode: "all",
      studentIds: [],
      createdAt: "2026-06-01T00:00:00.000Z",
    };

    const conflicts = getStudentConflicts({
      courses: [course],
      meetings: [meeting],
      studentId: "65101000",
      date: "2026-06-08",
      startTime: "09:00",
      endTime: "10:30",
    });

    expect(conflicts).toHaveLength(2);
  });

  it("treats unparseable legacy meeting times as unknown, never a false conflict", () => {
    const meeting: Meeting = {
      id: "m-3",
      date: "2026-06-08",
      time: "TBD",
      title: "Legacy meeting",
      location: "",
      description: "",
      attendeeMode: "all",
      studentIds: [],
      createdAt: "2026-06-01T00:00:00.000Z",
    };

    const conflicts = getStudentConflicts({
      courses: [],
      meetings: [meeting],
      studentId: "65101000",
      date: "2026-06-08",
      startTime: "09:00",
      endTime: "10:00",
    });

    expect(conflicts).toHaveLength(0);
  });
});

describe("getAvailabilityForStudents", () => {
  it("computes whole-class Busy/Available correctly (Scenario D)", () => {
    const busyCourse = makeCourse({ studentId: "s-busy" });
    const availability = getAvailabilityForStudents({
      courses: [busyCourse],
      meetings: [],
      studentIds: ["s-busy", "s-free-1", "s-free-2"],
      date: "2026-06-08",
      startTime: "10:00",
      endTime: "11:00",
    });

    const busy = availability.filter((a) => a.status === "busy");
    const available = availability.filter((a) => a.status === "available");
    expect(busy.map((a) => a.studentId)).toEqual(["s-busy"]);
    expect(available).toHaveLength(2);
  });

  it("reports Availability unknown instead of guessing when time cannot be parsed", () => {
    const availability = getAvailabilityForStudents({
      courses: [],
      meetings: [],
      studentIds: ["s-1"],
      date: "2026-06-08",
      startTime: "",
      endTime: "",
    });

    expect(availability[0].status).toBe("unknown");
  });
});

describe("Thai local dates do not shift by one day", () => {
  it("keeps a Monday course on the same calendar date across a DST-free Asia/Bangkok-style offset", () => {
    // 2026-06-01 is a Monday. Regression guard against `new Date(dateStr)`
    // UTC-string parsing, which can shift the derived weekday/date by one
    // day depending on the runtime's local timezone.
    const course = makeCourse({ termStart: "2026-06-01", termEnd: "2026-06-01" });
    const conflicts = getStudentConflicts({
      courses: [course],
      meetings: [],
      studentId: "65101000",
      date: "2026-06-01",
      startTime: "09:00",
      endTime: "09:30",
    });
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].date).toBe("2026-06-01");
  });
});
