import { useCallback } from "react";
import { expandStudentCourses } from "./lib/course-occurrences";
import { getAvailabilityForStudents } from "./lib/conflicts";
import { validateCourseSchedule } from "./lib/validation";

const COURSE_FIELDS_THAT_RESET_VERIFICATION = ["courseCode", "courseName", "termStart", "termEnd"];

function makeAuditEvent({ entityType, entityId, studentId, action, actorId, actorRole, before, after, reason }) {
  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    entityType, entityId, studentId, action, actorId, actorRole, before, after,
    reason: reason || "",
    createdAt: new Date().toISOString(),
  };
}

function normalizeSessions(sessions) {
  return sessions.map((session, index) => ({
    id: session.id || `session-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
    dayOfWeek: session.dayOfWeek,
    startTime: session.startTime,
    endTime: session.endTime,
    location: session.location?.trim() || "",
  }));
}

export function useCourseSchedule({ data, setData, studentId }) {
  const addCourse = useCallback(
    (payload) => {
      const sessions = Array.isArray(payload.sessions) ? payload.sessions : [];
      const draft = {
        courseCode: payload.courseCode ?? "",
        courseName: payload.courseName ?? "",
        termStart: payload.termStart ?? "",
        termEnd: payload.termEnd ?? "",
        sessions,
      };
      const validation = validateCourseSchedule(draft);
      if (!validation.valid) return { ok: false, errors: validation.errors };

      const now = new Date().toISOString();
      const id = `course-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const course = {
        id,
        studentId,
        courseCode: draft.courseCode.trim(),
        courseName: draft.courseName.trim(),
        color: payload.color?.trim() || "#2563eb",
        defaultLocation: payload.defaultLocation?.trim() || "",
        notes: payload.notes?.trim() || "",
        privateNote: payload.privateNote?.trim() || "",
        sectionId: payload.sectionId?.trim() || "955110",
        termStart: draft.termStart,
        termEnd: draft.termEnd,
        sessions: normalizeSessions(sessions),
        exceptions: [],
        verificationStatus: "self-reported",
        verifiedBy: null,
        verifiedAt: null,
        verificationNote: "",
        verificationSource: null,
        evidenceRef: null,
        createdAt: now,
        updatedAt: now,
      };

      setData((prev) => ({
        ...prev,
        courses: [...prev.courses, course],
        courseAudit: [
          ...prev.courseAudit,
          makeAuditEvent({
            entityType: "course",
            entityId: id,
            studentId,
            action: "create",
            actorId: studentId,
            actorRole: "student",
            before: null,
            after: course,
            reason: "Course created",
          }),
        ],
      }));

      return { ok: true, course };
    },
    [studentId]
  );

  const updateCourse = useCallback(
    (courseId, payload) => {
      let result = { ok: false, errors: { courseId: "Course not found." } };

      setData((prev) => {
        const existing = prev.courses.find((c) => c.id === courseId);
        if (!existing) {
          result = { ok: false, errors: { courseId: "Course not found." } };
          return prev;
        }
        if (existing.studentId !== studentId) {
          result = { ok: false, errors: { courseId: "Not allowed to edit this course." } };
          return prev;
        }

        const nextSessions = Array.isArray(payload.sessions) ? payload.sessions : existing.sessions;
        const draft = {
          courseCode: payload.courseCode ?? existing.courseCode,
          courseName: payload.courseName ?? existing.courseName,
          termStart: payload.termStart ?? existing.termStart,
          termEnd: payload.termEnd ?? existing.termEnd,
          sessions: nextSessions,
        };
        const validation = validateCourseSchedule(draft);
        if (!validation.valid) {
          result = { ok: false, errors: validation.errors };
          return prev;
        }

        const sessionsChanged =
          JSON.stringify(nextSessions) !== JSON.stringify(existing.sessions);
        const scalarFieldChanged = COURSE_FIELDS_THAT_RESET_VERIFICATION.some(
          (field) => draft[field] !== existing[field]
        );
        const scheduleChanged = sessionsChanged || scalarFieldChanged;
        const shouldResetVerification = scheduleChanged && existing.verificationStatus !== "self-reported";

        const updated = {
          ...existing,
          courseCode: draft.courseCode.trim(),
          courseName: draft.courseName.trim(),
          termStart: draft.termStart,
          termEnd: draft.termEnd,
          sessions: normalizeSessions(nextSessions),
          color: payload.color !== undefined ? payload.color.trim() : existing.color,
          defaultLocation:
            payload.defaultLocation !== undefined ? payload.defaultLocation.trim() : existing.defaultLocation,
          notes: payload.notes !== undefined ? payload.notes.trim() : existing.notes,
          privateNote: payload.privateNote !== undefined ? payload.privateNote.trim() : existing.privateNote,
          verificationStatus: shouldResetVerification ? "self-reported" : existing.verificationStatus,
          verifiedBy: shouldResetVerification ? null : existing.verifiedBy,
          verifiedAt: shouldResetVerification ? null : existing.verifiedAt,
          verificationSource: shouldResetVerification ? null : existing.verificationSource,
          evidenceRef: shouldResetVerification ? null : existing.evidenceRef,
          verificationNote: shouldResetVerification ? "" : existing.verificationNote,
          updatedAt: new Date().toISOString(),
        };

        result = { ok: true, course: updated };

        return {
          ...prev,
          courses: prev.courses.map((c) => (c.id === courseId ? updated : c)),
          courseAudit: [
            ...prev.courseAudit,
            makeAuditEvent({
              entityType: "course",
              entityId: courseId,
              studentId,
              action: "update",
              actorId: studentId,
              actorRole: "student",
              before: existing,
              after: updated,
              reason: shouldResetVerification
                ? "Schedule edited; verification reset to self-reported"
                : "Course updated",
            }),
          ],
        };
      });

      return result;
    },
    [studentId]
  );

  const removeCourse = useCallback(
    (courseId) => {
      let result = { ok: false, error: "Course not found." };

      setData((prev) => {
        const existing = prev.courses.find((c) => c.id === courseId);
        if (!existing) return prev;
        if (existing.studentId !== studentId) {
          result = { ok: false, error: "Not allowed to delete this course." };
          return prev;
        }

        result = { ok: true };
        return {
          ...prev,
          courses: prev.courses.filter((c) => c.id !== courseId),
          // Audit history is append-only: deleting the course never deletes its audit trail.
          courseAudit: [
            ...prev.courseAudit,
            makeAuditEvent({
              entityType: "course",
              entityId: courseId,
              studentId,
              action: "delete",
              actorId: studentId,
              actorRole: "student",
              before: existing,
              after: null,
              reason: "Course deleted",
            }),
          ],
        };
      });

      return result;
    },
    [studentId]
  );

  const getCoursesForStudent = useCallback(
    (sid) => data.courses.filter((c) => c.studentId === sid),
    [data.courses]
  );

  const getCourseById = useCallback(
    (courseId) => data.courses.find((c) => c.id === courseId) || null,
    [data.courses]
  );

  const getCourseOccurrencesForStudent = useCallback(
    (sid, rangeStart, rangeEnd) => expandStudentCourses(data.courses, sid, rangeStart, rangeEnd),
    [data.courses]
  );

  // Only a teacher assigned to the student's section may call this
  // (enforced by the calling UI in this prototype; must move server-side
  // for production per handoff section 3).
  const setCourseVerification = useCallback((courseId, status, options = {}) => {
    if (status !== "verified" && status !== "needs-review") {
      return { ok: false, error: "Invalid verification status." };
    }
    if (status === "verified" && !options.source) {
      return { ok: false, error: "Verification source is required to mark a course Verified." };
    }

    let result = { ok: false, error: "Course not found." };

    setData((prev) => {
      const existing = prev.courses.find((c) => c.id === courseId);
      if (!existing) return prev;

      const now = new Date().toISOString();
      const actorId = options.actorId || prev.teacher?.name || "teacher";
      const updated = {
        ...existing,
        verificationStatus: status,
        verifiedBy: actorId,
        verifiedAt: now,
        verificationNote: options.note?.trim() || "",
        verificationSource: status === "verified" ? options.source : existing.verificationSource,
        evidenceRef: options.evidenceRef?.trim() || existing.evidenceRef,
        updatedAt: now,
      };

      result = { ok: true, course: updated };

      return {
        ...prev,
        courses: prev.courses.map((c) => (c.id === courseId ? updated : c)),
        courseAudit: [
          ...prev.courseAudit,
          makeAuditEvent({
            entityType: "verification",
            entityId: courseId,
            studentId: existing.studentId,
            action: "verify",
            actorId,
            actorRole: "teacher",
            before: { verificationStatus: existing.verificationStatus },
            after: { verificationStatus: status },
            reason: options.note || "",
          }),
        ],
      };
    });

    return result;
  }, []);

  const getStudentAvailability = useCallback(
    (sid, date, startTime, endTime, opts = {}) =>
      getAvailabilityForStudents({
        courses: data.courses,
        meetings: data.meetings,
        studentIds: [sid],
        date,
        startTime,
        endTime,
        excludeMeetingId: opts.excludeMeetingId,
      })[0],
    [data.courses, data.meetings]
  );

  const getClassAvailability = useCallback(
    (studentIds, date, startTime, endTime, opts = {}) =>
      getAvailabilityForStudents({
        courses: data.courses,
        meetings: data.meetings,
        studentIds,
        date,
        startTime,
        endTime,
        excludeMeetingId: opts.excludeMeetingId,
      }),
    [data.courses, data.meetings]
  );
  return {
    addCourse, updateCourse, removeCourse,
    getCoursesForStudent, getCourseById, getCourseOccurrencesForStudent,
    setCourseVerification, getStudentAvailability, getClassAvailability,
  };
}
