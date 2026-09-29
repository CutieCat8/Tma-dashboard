import { describe, expect, it } from "vitest";
import { parseDateTime, parseIcs, unfold } from "./ics-import";

const wrap = (...events: string[]) =>
  ["BEGIN:VCALENDAR", "VERSION:2.0", ...events.flatMap((e) => ["BEGIN:VEVENT", e, "END:VEVENT"]), "END:VCALENDAR"].join("\r\n");

const weekly = (extra = "") =>
  [
    "UID:a1",
    "SUMMARY:955110 Intro to Data",
    "LOCATION:Room 1",
    "DTSTART;TZID=Asia/Bangkok:20260812T090000",
    "DTEND;TZID=Asia/Bangkok:20260812T120000",
    "RRULE:FREQ=WEEKLY;UNTIL=20261204T165959Z",
    extra,
  ]
    .filter(Boolean)
    .join("\r\n");

describe("parseIcs", () => {
  it("turns a weekly recurring event into a course", () => {
    const { courses, skipped } = parseIcs(wrap(weekly()));
    expect(skipped).toEqual({ unsupported: 0, invalid: 0 });
    expect(courses).toHaveLength(1);
    expect(courses[0]).toMatchObject({
      courseCode: "955110",
      courseName: "Intro to Data",
      termStart: "2026-08-12",
      termEnd: "2026-12-02",
      defaultLocation: "Room 1",
      sessions: [{ dayOfWeek: 3, startTime: "09:00", endTime: "12:00", location: "Room 1" }],
    });
  });

  it("expands BYDAY into multiple sessions and merges same-title events", () => {
    const { courses } = parseIcs(
      wrap(
        weekly("RRULE:FREQ=WEEKLY;BYDAY=MO,WE").replace("RRULE:FREQ=WEEKLY;UNTIL=20261204T165959Z\r\n", "")
      )
    );
    expect(courses[0].sessions.map((s) => s.dayOfWeek).sort()).toEqual([1, 3]);
  });

  it("maps EXDATE to cancelled exceptions and RECURRENCE-ID to replacements", () => {
    const override = [
      "UID:a1",
      "SUMMARY:955110 Intro to Data",
      "RECURRENCE-ID;TZID=Asia/Bangkok:20260819T090000",
      "DTSTART;TZID=Asia/Bangkok:20260819T130000",
      "DTEND;TZID=Asia/Bangkok:20260819T150000",
      "LOCATION:Room 9",
    ].join("\r\n");
    const { courses } = parseIcs(wrap(weekly("EXDATE;TZID=Asia/Bangkok:20260826T090000"), override));
    expect(courses[0].exceptions).toEqual([
      expect.objectContaining({ date: "2026-08-26", type: "cancelled" }),
      expect.objectContaining({ date: "2026-08-19", type: "replacement", startTime: "13:00", endTime: "15:00", location: "Room 9" }),
    ]);
  });

  it("skips unsupported repeat rules and all-day events", () => {
    const monthly = ["SUMMARY:Rent", "DTSTART:20260901T030000Z", "DTEND:20260901T040000Z", "RRULE:FREQ=MONTHLY"].join("\r\n");
    const allDay = ["SUMMARY:Holiday", "DTSTART;VALUE=DATE:20260901", "DTEND;VALUE=DATE:20260902"].join("\r\n");
    const result = parseIcs(wrap(monthly, allDay));
    expect(result.courses).toHaveLength(0);
    expect(result.skipped).toEqual({ unsupported: 1, invalid: 1 });
  });

  it("merges hand-added single days of the same course code and cancels the gaps", () => {
    const day = (date: string, start = "133000", end = "163000") =>
      ["SUMMARY:(Lec+Lab) Database 960231", `DTSTART:${date}T${start}`, `DTEND:${date}T${end}`, "LOCATION:B305"].join("\r\n");
    // Mondays 22 Jun, 29 Jun, 20 Jul (13 Jul missing) + a Tuesday.
    const { courses } = parseIcs(wrap(day("20260622"), day("20260629"), day("20260720"), day("20260623")));
    expect(courses).toHaveLength(1);
    const course = courses[0];
    expect(course).toMatchObject({ courseCode: "960231", courseName: "(Lec+Lab) Database", termStart: "2026-06-22", termEnd: "2026-07-20", oneTime: false });
    expect(course.sessions.map((s) => s.dayOfWeek).sort()).toEqual([1, 2]);
    const cancelled = course.exceptions.filter((e) => e.type === "cancelled").map((e) => e.date);
    expect(cancelled).toContain("2026-07-13"); // missing Monday
    expect(cancelled).not.toContain("2026-06-29");
    expect(cancelled).not.toContain("2026-06-23");
  });

  it("turns a 1-2 day time change on the same weekday into a replacement", () => {
    const day = (date: string, start: string, end: string) =>
      ["SUMMARY:Eng4 Sec2", `DTSTART:${date}T${start}`, `DTEND:${date}T${end}`].join("\r\n");
    const { courses } = parseIcs(wrap(day("20260407", "103000", "120000"), day("20260414", "103000", "120000"), day("20260421", "103000", "120000"), day("20260428", "123000", "140000")));
    expect(courses).toHaveLength(1);
    expect(courses[0].exceptions).toEqual([expect.objectContaining({ date: "2026-04-28", type: "replacement", startTime: "12:30" })]);
  });

  it("flags a lone event as one-time and keeps exams separate from the course", () => {
    const lone = ["SUMMARY:(Final) Data Structure 960201", "DTSTART:20260826T053000Z", "DTEND:20260826T083000Z"].join("\r\n");
    const { courses } = parseIcs(wrap(lone));
    expect(courses).toHaveLength(1);
    expect(courses[0]).toMatchObject({ courseCode: "960201", oneTime: true, termStart: "2026-08-26", termEnd: "2026-08-26" });
  });

  it("treats DAILY with BYDAY as weekly on those days", () => {
    const daily = ["SUMMARY:Web Tech (sec2)", "DTSTART;TZID=Asia/Bangkok:20260427T130000", "DTEND;TZID=Asia/Bangkok:20260427T160000", "RRULE:FREQ=DAILY;UNTIL=20260508T060000Z;BYDAY=MO,TU,WE,TH"].join("\r\n");
    const { courses } = parseIcs(wrap(daily));
    expect(courses[0].sessions.map((s) => s.dayOfWeek).sort()).toEqual([1, 2, 3, 4]);
    expect(courses[0].courseName).toBe("Web Tech");
  });

  it("caps an open-ended rule at 52 weeks and flags it", () => {
    const open = ["SUMMARY:Yoga", "DTSTART;TZID=Asia/Bangkok:20260803T180000", "DTEND;TZID=Asia/Bangkok:20260803T190000", "RRULE:FREQ=WEEKLY"].join("\r\n");
    const { courses } = parseIcs(wrap(open));
    expect(courses[0]).toMatchObject({ courseCode: "IMPORT", openEnded: true, termStart: "2026-08-03", termEnd: "2027-08-02" });
  });

  it("computes the end date for COUNT-limited rules", () => {
    const counted = ["SUMMARY:Lab", "DTSTART;TZID=Asia/Bangkok:20260803T100000", "DTEND;TZID=Asia/Bangkok:20260803T110000", "RRULE:FREQ=WEEKLY;COUNT=3"].join("\r\n");
    expect(parseIcs(wrap(counted)).courses[0].termEnd).toBe("2026-08-17");
  });
});

describe("parseDateTime / unfold", () => {
  it("converts UTC and foreign time zones to Bangkok", () => {
    const p = (value: string, params = {}) => parseDateTime({ name: "DTSTART", params, value });
    expect(p("20260812T020000Z")).toMatchObject({ date: "2026-08-12", time: "09:00" });
    expect(p("20260812T220000Z")).toMatchObject({ date: "2026-08-13", time: "05:00" });
    expect(p("20260812T090000", { TZID: "America/New_York" })).toMatchObject({ date: "2026-08-12", time: "20:00" });
    expect(p("20260812")).toMatchObject({ allDay: true });
  });

  it("unfolds continuation lines", () => {
    expect(unfold("SUMMARY:ab\r\n cd\r\nX:1")).toEqual(["SUMMARY:abcd", "X:1"]);
  });
});
