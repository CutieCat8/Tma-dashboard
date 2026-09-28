import { expandStudentCourses } from "./course-occurrences";
import { timeToMinutes, parseLegacyMeetingTime } from "./meeting-time";
import type { CourseSchedule, Meeting, TimeConflict } from "./types";

// Strict overlap: touching boundaries (course ends 10:30, meeting starts
// 10:30) do NOT conflict — see handoff Scenario C.
export function timeRangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  const aS = timeToMinutes(aStart);
  const aE = timeToMinutes(aEnd);
  const bS = timeToMinutes(bStart);
  const bE = timeToMinutes(bEnd);
  return aS < bE && bS < aE;
}

function resolveMeetingTime(meeting: Meeting): { startTime: string; endTime: string } | null {
  if (meeting.startTime && meeting.endTime) {
    return { startTime: meeting.startTime, endTime: meeting.endTime };
  }
  if (meeting.time) {
    return parseLegacyMeetingTime(meeting.time);
  }
  return null;
}

function meetingAttendsStudent(meeting: Meeting, studentId: string): boolean {
  if (meeting.attendeeMode === "all") return true;
  const ids = meeting.attendeeStudentIds ?? meeting.studentIds ?? [];
  return ids.includes(studentId);
}

export interface GetStudentConflictsInput {
  courses: CourseSchedule[];
  meetings: Meeting[];
  studentId: string;
  date: string;
  startTime: string;
  endTime: string;
  excludeMeetingId?: string;
}

// Returns every conflicting course occurrence and meeting — never just the
// first — so a caller can render the full list (handoff: "if there are
// multiple conflicts the popup must show all of them").
export function getStudentConflicts({
  courses,
  meetings,
  studentId,
  date,
  startTime,
  endTime,
  excludeMeetingId,
}: GetStudentConflictsInput): TimeConflict[] {
  const conflicts: TimeConflict[] = [];

  const occurrences = expandStudentCourses(courses, studentId, date, date);
  for (const occurrence of occurrences) {
    if (timeRangesOverlap(startTime, endTime, occurrence.startTime, occurrence.endTime)) {
      conflicts.push({
        type: "course",
        studentId,
        date,
        startTime: occurrence.startTime,
        endTime: occurrence.endTime,
        occurrence,
      });
    }
  }

  for (const meeting of meetings) {
    if (meeting.id === excludeMeetingId) continue;
    if (meeting.date !== date) continue;
    if (!meetingAttendsStudent(meeting, studentId)) continue;
    const resolved = resolveMeetingTime(meeting);
    if (!resolved) continue; // unparseable legacy time: never treated as Available or Busy
    if (timeRangesOverlap(startTime, endTime, resolved.startTime, resolved.endTime)) {
      conflicts.push({
        type: "meeting",
        studentId,
        date,
        startTime: resolved.startTime,
        endTime: resolved.endTime,
        meeting,
      });
    }
  }

  return conflicts;
}

export interface StudentAvailability {
  studentId: string;
  status: "available" | "busy" | "unknown";
  conflicts: TimeConflict[];
}

export interface GetAvailabilityInput {
  courses: CourseSchedule[];
  meetings: Meeting[];
  studentIds: string[];
  date: string;
  startTime: string;
  endTime: string;
  excludeMeetingId?: string;
}

// Availability is "unknown" (never silently "available") when the proposed
// time cannot be evaluated, e.g. missing/invalid startTime or endTime.
export function getAvailabilityForStudents({
  courses,
  meetings,
  studentIds,
  date,
  startTime,
  endTime,
  excludeMeetingId,
}: GetAvailabilityInput): StudentAvailability[] {
  const timeIsUsable = Boolean(date) && isParsableTime(startTime) && isParsableTime(endTime) && timeToMinutes(endTime) > timeToMinutes(startTime);

  return studentIds.map((studentId) => {
    if (!timeIsUsable) {
      return { studentId, status: "unknown", conflicts: [] };
    }
    const conflicts = getStudentConflicts({
      courses,
      meetings,
      studentId,
      date,
      startTime,
      endTime,
      excludeMeetingId,
    });
    return {
      studentId,
      status: conflicts.length > 0 ? "busy" : "available",
      conflicts,
    };
  });
}

function isParsableTime(value: unknown): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}
