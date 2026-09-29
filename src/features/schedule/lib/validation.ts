import { isValidDateString, compareDates } from "./date";
import { isValidTimeString, timeToMinutes } from "./meeting-time";
import { timeRangesOverlap } from "./conflicts";
import type { WeeklySession } from "./types";

export interface CourseDraft {
  courseCode: string;
  courseName: string;
  termStart: string;
  termEnd: string;
  sessions: Pick<WeeklySession, "dayOfWeek" | "startTime" | "endTime" | "location">[];
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

// Pure validation — no side effects, no I/O — so it can run in a form and
// in tests identically.
export function validateCourseSchedule(draft: CourseDraft): ValidationResult {
  const errors: Record<string, string> = {};

  if (!draft.courseCode?.trim()) {
    errors.courseCode = "Course code is required.";
  }
  if (!draft.courseName?.trim()) {
    errors.courseName = "Course name is required.";
  }
  if (!isValidDateString(draft.termStart)) {
    errors.termStart = "Term start date is required.";
  }
  if (!isValidDateString(draft.termEnd)) {
    errors.termEnd = "Term end date is required.";
  }
  if (
    isValidDateString(draft.termStart) &&
    isValidDateString(draft.termEnd) &&
    compareDates(draft.termEnd, draft.termStart) < 0
  ) {
    errors.termEnd = "Term end date must be on or after term start date.";
  }

  if (!draft.sessions || draft.sessions.length === 0) {
    errors.sessions = "At least one weekly session is required.";
  } else {
    draft.sessions.forEach((session, index) => {
      const key = `sessions.${index}`;
      if (session.dayOfWeek < 0 || session.dayOfWeek > 6) {
        errors[`${key}.dayOfWeek`] = "Day of week is invalid.";
      }
      if (!isValidTimeString(session.startTime)) {
        errors[`${key}.startTime`] = "Start time is required.";
      }
      if (!isValidTimeString(session.endTime)) {
        errors[`${key}.endTime`] = "End time is required.";
      }
      if (
        isValidTimeString(session.startTime) &&
        isValidTimeString(session.endTime) &&
        timeToMinutes(session.endTime) <= timeToMinutes(session.startTime)
      ) {
        errors[`${key}.endTime`] = "End time must be after start time.";
      }
    });

    // Sessions in the same course must not overlap on the same day.
    const byDay = new Map<number, typeof draft.sessions>();
    draft.sessions.forEach((session) => {
      const list = byDay.get(session.dayOfWeek) ?? [];
      list.push(session);
      byDay.set(session.dayOfWeek, list);
    });
    for (const sessions of byDay.values()) {
      for (let i = 0; i < sessions.length; i += 1) {
        for (let j = i + 1; j < sessions.length; j += 1) {
          const a = sessions[i];
          const b = sessions[j];
          if (
            isValidTimeString(a.startTime) &&
            isValidTimeString(a.endTime) &&
            isValidTimeString(b.startTime) &&
            isValidTimeString(b.endTime) &&
            timeRangesOverlap(a.startTime, a.endTime, b.startTime, b.endTime)
          ) {
            errors.sessions = "Weekly sessions on the same day must not overlap.";
          }
        }
      }
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
