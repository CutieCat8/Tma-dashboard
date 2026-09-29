import { compareDates, eachDateInInterval } from "./date";

// Term structure of the programme this dashboard is built for. This is the
// single place to change when term dates move or another programme is added
// (a Supabase-backed table can replace ACADEMIC_TERMS later without touching
// the UI).

export interface AcademicTerm {
  id: string;
  label: string; // full name
  short: string; // compact name for the timeline
  start: string; // YYYY-MM-DD inclusive
  end: string; // YYYY-MM-DD inclusive
  kind: "study" | "internship";
}

export const ACADEMIC_TERMS: AcademicTerm[] = [
  { id: "preschool", label: "Pre-school", short: "Pre-school", start: "2025-04-01", end: "2025-05-31", kind: "study" },
  { id: "y1s1", label: "Year 1 · Semester 1", short: "Y1 · Sem 1", start: "2025-06-01", end: "2025-10-31", kind: "study" },
  { id: "y1s2", label: "Year 1 · Semester 2", short: "Y1 · Sem 2", start: "2025-11-01", end: "2026-03-31", kind: "study" },
  { id: "summer1", label: "Summer 1", short: "Summer 1", start: "2026-04-01", end: "2026-05-31", kind: "study" },
  { id: "y2s1", label: "Year 2 · Semester 1", short: "Y2 · Sem 1", start: "2026-06-01", end: "2026-09-30", kind: "study" },
  { id: "y2s2", label: "Year 2 · Semester 2", short: "Y2 · Sem 2", start: "2026-10-01", end: "2026-11-30", kind: "study" },
  // Year 3 is a 16-month internship until graduation; there are no classes.
  { id: "internship", label: "Year 3 · Internship", short: "Internship", start: "2026-12-01", end: "2028-03-31", kind: "internship" },
];

export type TermState = "past" | "current" | "upcoming";

export function getTermState(term: AcademicTerm, today: string): TermState {
  if (compareDates(term.end, today) < 0) return "past";
  if (compareDates(term.start, today) > 0) return "upcoming";
  return "current";
}

export function findTermForDate(date: string, terms: AcademicTerm[] = ACADEMIC_TERMS): AcademicTerm | null {
  return terms.find((term) => date >= term.start && date <= term.end) ?? null;
}

// The term to open first: the running one, else the next upcoming, else the last.
export function getDefaultTermId(today: string, terms: AcademicTerm[] = ACADEMIC_TERMS): string {
  return (
    findTermForDate(today, terms)?.id ??
    terms.find((term) => term.start > today)?.id ??
    terms[terms.length - 1].id
  );
}

function overlapDays(aStart: string, aEnd: string, bStart: string, bEnd: string): number {
  const start = aStart > bStart ? aStart : bStart;
  const end = aEnd < bEnd ? aEnd : bEnd;
  if (start > end) return 0;
  return eachDateInInterval({ start, end }).length;
}

// A course belongs to the term it overlaps the most (ties go to the earlier
// term). Courses outside every term return null.
export function assignCourseToTerm(
  course: { termStart: string; termEnd: string },
  terms: AcademicTerm[] = ACADEMIC_TERMS
): AcademicTerm | null {
  let best: AcademicTerm | null = null;
  let bestDays = 0;
  for (const term of terms) {
    const days = overlapDays(course.termStart, course.termEnd, term.start, term.end);
    if (days > bestDays) {
      best = term;
      bestDays = days;
    }
  }
  return best;
}

export function groupCoursesByTerm<T extends { termStart: string; termEnd: string }>(
  courses: T[],
  terms: AcademicTerm[] = ACADEMIC_TERMS
): { byTerm: Map<string, T[]>; unassigned: T[] } {
  const byTerm = new Map<string, T[]>(terms.map((term) => [term.id, []]));
  const unassigned: T[] = [];
  for (const course of courses) {
    const term = assignCourseToTerm(course, terms);
    if (term) byTerm.get(term.id)?.push(course);
    else unassigned.push(course);
  }
  return { byTerm, unassigned };
}
