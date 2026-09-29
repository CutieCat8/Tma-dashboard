// Canonical schedule domain types (handoff section 6).

export type VerificationStatus = "self-reported" | "verified" | "needs-review";
export type VerificationSource = "registrar" | "document" | "manual-review";

export interface WeeklySession {
  id: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  location: string;
}

export type CourseException =
  | { id: string; date: string; type: "cancelled"; reason: string }
  | {
      id: string;
      date: string;
      type: "replacement";
      startTime: string;
      endTime: string;
      location: string;
      reason: string;
    };

export interface CourseSchedule {
  id: string;
  studentId: string;
  courseCode: string;
  courseName: string;
  color: string;
  defaultLocation: string;
  notes: string;
  privateNote: string; // student only; never shown to teacher
  sectionId: string;
  termStart: string; // YYYY-MM-DD, local calendar date
  termEnd: string; // YYYY-MM-DD, inclusive
  sessions: WeeklySession[];
  exceptions: CourseException[];
  verificationStatus: VerificationStatus;
  verifiedBy: string | null;
  verifiedAt: string | null;
  verificationNote: string;
  verificationSource: VerificationSource | null;
  evidenceRef: string | null;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface Meeting {
  id: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm, normalized (may be absent on legacy records)
  endTime?: string; // HH:mm, normalized
  time?: string; // legacy free-text fallback, e.g. "09:00 - 12:00 น."
  title: string;
  location: string;
  description: string;
  attendeeMode: "all" | "students";
  studentIds: string[];
  sectionId?: string;
  attendeeStudentIds?: string[]; // snapshot for an all-class meeting
  createdAt: string;
  updatedAt?: string;
}

export interface CourseOccurrence {
  courseId: string;
  studentId: string;
  courseCode: string;
  courseName: string;
  color: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  location: string;
  sectionId: string;
  verificationStatus: VerificationStatus;
}

export interface TimeConflict {
  type: "course" | "meeting";
  studentId: string;
  date: string;
  startTime: string;
  endTime: string;
  // present when type === "course"
  occurrence?: CourseOccurrence;
  // present when type === "meeting"
  meeting?: Meeting;
}

export interface ScheduleAuditEvent {
  id: string;
  entityType: "course" | "meeting" | "verification";
  entityId: string;
  studentId?: string;
  action: "create" | "update" | "delete" | "verify" | "flag" | "override";
  actorId: string;
  actorRole: "student" | "teacher" | "system";
  before: unknown | null;
  after: unknown | null;
  reason: string;
  createdAt: string;
}
