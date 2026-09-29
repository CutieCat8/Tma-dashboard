import { eachDateInInterval, getWeekdayOfDate, isDateInRange } from "./date";
import type { CourseOccurrence, CourseSchedule } from "./types";

// Recurring rules are stored once (handoff section 7: "should not generate
// and persist hundreds of weekly occurrence records"). Occurrences are
// derived on demand for whatever date range is currently being viewed.
export function expandCourseOccurrences(
  course: CourseSchedule,
  rangeStart: string,
  rangeEnd: string
): CourseOccurrence[] {
  const clampedStart = course.termStart > rangeStart ? course.termStart : rangeStart;
  const clampedEnd = course.termEnd < rangeEnd ? course.termEnd : rangeEnd;
  if (clampedStart > clampedEnd) return [];

  const occurrences: CourseOccurrence[] = [];
  const exceptionsByDate = new Map(course.exceptions.map((ex) => [ex.date, ex]));

  for (const date of eachDateInInterval({ start: clampedStart, end: clampedEnd })) {
    const weekday = getWeekdayOfDate(date);
    const sessionsForDay = course.sessions.filter((s) => s.dayOfWeek === weekday);
    if (sessionsForDay.length === 0) continue;

    const exception = exceptionsByDate.get(date);
    if (exception?.type === "cancelled") continue;

    for (const session of sessionsForDay) {
      const startTime = exception?.type === "replacement" ? exception.startTime : session.startTime;
      const endTime = exception?.type === "replacement" ? exception.endTime : session.endTime;
      const location =
        exception?.type === "replacement"
          ? exception.location
          : session.location || course.defaultLocation;

      occurrences.push({
        courseId: course.id,
        studentId: course.studentId,
        courseCode: course.courseCode,
        courseName: course.courseName,
        color: course.color,
        date,
        startTime,
        endTime,
        location,
        sectionId: course.sectionId,
        verificationStatus: course.verificationStatus,
      });
    }
  }

  return occurrences;
}

export function expandStudentCourses(
  courses: CourseSchedule[],
  studentId: string,
  rangeStart: string,
  rangeEnd: string
): CourseOccurrence[] {
  return courses
    .filter((c) => c.studentId === studentId)
    .flatMap((c) => expandCourseOccurrences(c, rangeStart, rangeEnd));
}

// A single-date convenience helper used by conflict checks; date must
// already lie within the caller's chosen range.
export function courseHasOccurrenceOn(course: CourseSchedule, date: string): boolean {
  return isDateInRange(date, course.termStart, course.termEnd) && expandCourseOccurrences(course, date, date).length > 0;
}
