import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { fetchSheet, SHEETS, clearSheetCache } from "./lib/sheets";
import { buildStudentStats } from "./lib/consistency";
import { expandStudentCourses } from "./lib/schedule/course-occurrences";
import { getAvailabilityForStudents } from "./lib/schedule/conflicts";
import { validateCourseSchedule } from "./lib/schedule/validation";

const AppContext = createContext();

const COURSE_FIELDS_THAT_RESET_VERIFICATION = ["courseCode", "courseName", "termStart", "termEnd"];

function makeAuditEvent({ entityType, entityId, studentId, action, actorId, actorRole, before, after, reason }) {
  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    entityType,
    entityId,
    studentId,
    action,
    actorId,
    actorRole,
    before,
    after,
    reason: reason || "",
    createdAt: new Date().toISOString(),
  };
}

function normalizeSessions(sessions) {
  return sessions.map((s, idx) => ({
    id: s.id || `session-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
    dayOfWeek: s.dayOfWeek,
    startTime: s.startTime,
    endTime: s.endTime,
    location: s.location?.trim() || "",
  }));
}

function migrateMeetings(raw) {
  // New shape is an array. If old shape (dict keyed by date) is in localStorage, migrate it.
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    return Object.entries(raw).map(([date, m], idx) => ({
      id: `legacy-${idx}-${date}`,
      date,
      time: m.time || "",
      title: m.title || "ไม่มีหัวข้อ",
      location: m.location || "",
      description: "",
      attendeeMode: "all",
      studentIds: [],
      createdAt: new Date().toISOString(),
    }));
  }
  return [];
}

function getInitialData() {
  const defaults = getDefaults();
  const saved = localStorage.getItem("tma_955110");
  if (saved) {
    const parsed = JSON.parse(saved);
    return {
      ...parsed,
      meetings: migrateMeetings(parsed.meetings),
      courses: Array.isArray(parsed.courses) ? parsed.courses : [],
      courseAudit: Array.isArray(parsed.courseAudit) ? parsed.courseAudit : [],
      teacher: defaults.teacher,
    };
  }
  return defaults;
}

function getDefaults() {
  return {
    meetings: [
      {
        id: "seed-1",
        date: "2026-04-28",
        time: "09:00 - 12:00 น.",
        title: "นัดประชุมอัพเดตสถานะโปรเจค",
        location: "ห้อง 6301 ตึก CBB",
        description: "อัพเดตความคืบหน้าโปรเจค + ตอบข้อสงสัย",
        attendeeMode: "all",
        studentIds: [],
        createdAt: "2026-04-25T09:00:00",
      },
      {
        id: "seed-2",
        date: "2026-04-30",
        time: "13:00 - 14:00 น.",
        title: "นัดตรวจ Assignment 3 (1:1)",
        location: "ห้อง Lab 2 ตึก CBB",
        description: "ตรวจงานพร้อม feedback ส่วนตัว",
        attendeeMode: "students",
        studentIds: ["65101000", "65101003", "65101007"],
        createdAt: "2026-04-26T08:00:00",
      },
      {
        id: "seed-3",
        date: "2026-05-05",
        time: "09:00 - 12:00 น.",
        title: "สอบกลางภาค",
        location: "ห้องสอบ 101",
        description: "นำดินสอ + บัตรนักศึกษามาด้วย",
        attendeeMode: "all",
        studentIds: [],
        createdAt: "2026-04-27T10:00:00",
      },
    ],
    courses: [],
    courseAudit: [],
    announcements: [
      {
        id: 1,
        title: "ส่งงาน Assignment 3",
        description: "ส่งไฟล์ผ่าน Google Classroom ตามฟอร์มเดิม ห้ามเลยกำหนด",
        category: "ส่งงาน",
        dateStart: "2026-04-25",
        dateEnd: "2026-04-30",
        time: "ก่อน 23:59 น.",
        location: "Google Classroom",
        attendees: "ทั้งห้อง 40 คน",
        createdAt: "2026-04-25T08:00:00",
        read: false,
      },
      {
        id: 2,
        title: "อ่านบทที่ 5 ก่อนเข้าเรียน",
        description: "เตรียมตัวก่อนคาบเรียนสัปดาห์หน้า มีคำถามให้ตอบในชั้นเรียน",
        category: "ประกาศ",
        dateStart: "2026-04-28",
        dateEnd: "",
        time: "",
        location: "",
        attendees: "",
        createdAt: "2026-04-24T10:30:00",
        read: true,
      },
      {
        id: 3,
        title: "เปลี่ยนห้องเรียนสัปดาห์หน้า",
        description: "ย้ายไปห้อง 6302 ตึก CBB ชั่วคราวเนื่องจากห้องเดิมปรับปรุง",
        category: "ประกาศ",
        dateStart: "2026-04-29",
        dateEnd: "2026-05-03",
        time: "ตามตารางเดิม",
        location: "ห้อง 6302 ตึก CBB",
        attendees: "ทั้งห้อง",
        createdAt: "2026-04-23T09:00:00",
        read: true,
      },
    ],
    todos: [
      { id: 1, title: "ทำ Assignment 3", subject: "955110", type: "Assignment", done: false, dueDate: "2026-04-30" },
      { id: 2, title: "อ่านบทที่ 5 เตรียมตัว", subject: "955110", type: "Reading", done: false, dueDate: "2026-04-28" },
      { id: 3, title: "ส่ง Meditation Record ประจำวัน", subject: "955110", type: "Daily", done: true, dueDate: "2026-04-26" },
      { id: 4, title: "เขียน Daily Journal", subject: "955110", type: "Daily", done: false, dueDate: "2026-04-26" },
    ],
    teacher: {
      name: "ดร.ทมะ ดวงนามล",
      role: "อาจารย์ประจำวิชา 955110",
    },
  };
}

export function AppProvider({ children }) {
  const [data, setData] = useState(getInitialData);
  const [selectedDate, setSelectedDate] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const [studentId, setStudentIdState] = useState(() => localStorage.getItem("tma_studentId") || "");
  const [role, setRoleState] = useState(() => localStorage.getItem("tma_role") || "");
  const [medSheet, setMedSheet] = useState(null);
  const [journalSheet, setJournalSheet] = useState(null);
  const [sheetsLoading, setSheetsLoading] = useState(false);
  const [sheetsError, setSheetsError] = useState(null);

  useEffect(() => {
    localStorage.setItem("tma_955110", JSON.stringify(data));
  }, [data]);

  const setStudentId = useCallback((id) => {
    if (id) {
      localStorage.setItem("tma_studentId", id);
      setStudentIdState(id);
    } else {
      localStorage.removeItem("tma_studentId");
      setStudentIdState("");
    }
  }, []);

  const setRole = useCallback((r) => {
    if (r) {
      localStorage.setItem("tma_role", r);
      setRoleState(r);
    } else {
      localStorage.removeItem("tma_role");
      setRoleState("");
    }
  }, []);

  const logout = useCallback(() => {
    setStudentId("");
    setRole("");
  }, [setStudentId, setRole]);

  const refreshSheets = useCallback(async ({ force = false } = {}) => {
    setSheetsLoading(true);
    setSheetsError(null);
    try {
      const [med, jour] = await Promise.all([
        fetchSheet(SHEETS.meditation.id, SHEETS.meditation.gid, { force }),
        fetchSheet(SHEETS.journalTracking.id, SHEETS.journalTracking.gid, { force }),
      ]);
      setMedSheet(med);
      setJournalSheet(jour);
    } catch (err) {
      console.error("Failed to fetch sheets:", err);
      setSheetsError(err.message || "ดึงข้อมูลไม่สำเร็จ");
    } finally {
      setSheetsLoading(false);
    }
  }, []);

  // Auto-fetch sheets once a student is logged in
  useEffect(() => {
    if (studentId && role === "student") refreshSheets();
  }, [studentId, role, refreshSheets]);

  const hardRefresh = useCallback(() => {
    clearSheetCache();
    return refreshSheets({ force: true });
  }, [refreshSheets]);

  const toggleTodo = (id) => {
    setData((prev) => ({
      ...prev,
      todos: prev.todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    }));
  };

  const addAnnouncement = useCallback((payload) => {
    setData((prev) => {
      const id = Date.now();
      const next = {
        id,
        title: payload.title?.trim() || "ประกาศ",
        description: payload.description?.trim() || "",
        category: payload.category || "ประกาศ",
        dateStart: payload.dateStart || "",
        dateEnd: payload.dateEnd || "",
        time: payload.time?.trim() || "",
        location: payload.location?.trim() || "",
        attendees: payload.attendees?.trim() || "",
        createdAt: new Date().toISOString(),
        read: false,
      };
      return { ...prev, announcements: [next, ...prev.announcements] };
    });
  }, []);

  const removeAnnouncement = useCallback((id) => {
    setData((prev) => ({
      ...prev,
      announcements: prev.announcements.filter((a) => a.id !== id),
    }));
  }, []);

  const updateAnnouncement = useCallback((id, payload) => {
    setData((prev) => ({
      ...prev,
      announcements: prev.announcements.map((a) =>
        a.id === id
          ? {
              ...a,
              title: payload.title?.trim() || a.title,
              description: payload.description?.trim() ?? a.description,
              category: payload.category || a.category,
              dateStart: payload.dateStart ?? a.dateStart,
              dateEnd: payload.dateEnd ?? a.dateEnd,
              time: payload.time?.trim() ?? a.time,
              location: payload.location?.trim() ?? a.location,
              attendees: payload.attendees?.trim() ?? a.attendees,
              updatedAt: new Date().toISOString(),
            }
          : a
      ),
    }));
  }, []);

  const markAnnouncementRead = useCallback((id) => {
    setData((prev) => ({
      ...prev,
      announcements: prev.announcements.map((a) =>
        a.id === id ? { ...a, read: true } : a
      ),
    }));
  }, []);

  const addMeeting = useCallback((payload) => {
    setData((prev) => {
      const id = `m-${Date.now()}`;
      const next = {
        id,
        date: payload.date || "",
        time: payload.time?.trim() || "",
        title: payload.title?.trim() || "นัดประชุม",
        location: payload.location?.trim() || "",
        description: payload.description?.trim() || "",
        attendeeMode: payload.attendeeMode === "students" ? "students" : "all",
        studentIds: Array.isArray(payload.studentIds) ? [...payload.studentIds] : [],
        createdAt: new Date().toISOString(),
      };
      return { ...prev, meetings: [...prev.meetings, next] };
    });
  }, []);

  const removeMeeting = useCallback((id) => {
    setData((prev) => ({
      ...prev,
      meetings: prev.meetings.filter((m) => m.id !== id),
    }));
  }, []);

  const updateMeeting = useCallback((id, payload) => {
    setData((prev) => ({
      ...prev,
      meetings: prev.meetings.map((m) =>
        m.id === id
          ? {
              ...m,
              date: payload.date || m.date,
              time: payload.time?.trim() ?? m.time,
              title: payload.title?.trim() || m.title,
              location: payload.location?.trim() ?? m.location,
              description: payload.description?.trim() ?? m.description,
              attendeeMode: payload.attendeeMode === "students" ? "students" : "all",
              studentIds: Array.isArray(payload.studentIds) ? [...payload.studentIds] : m.studentIds,
              updatedAt: new Date().toISOString(),
            }
          : m
      ),
    }));
  }, []);

  const meetingMatchesStudent = (meeting, sid) => {
    if (!sid) return true;
    if (meeting.attendeeMode === "all") return true;
    return Array.isArray(meeting.studentIds) && meeting.studentIds.includes(sid);
  };

  const getMeetingsForDate = useCallback(
    (date, sid = null) =>
      data.meetings.filter(
        (m) => m.date === date && (sid === null || meetingMatchesStudent(m, sid))
      ),
    [data.meetings]
  );

  const getMeetingsForStudent = useCallback(
    (sid) => data.meetings.filter((m) => meetingMatchesStudent(m, sid)),
    [data.meetings]
  );

  // --- Course schedule CRUD (student-owned; prototype localStorage only) ---
  // See plans/course-availability-scheduling-handoff.md section 8 for the API contract.

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

  const consistency = useMemo(() => {
    if (!medSheet || !journalSheet || !studentId) return null;
    return buildStudentStats({ medSheet, journalSheet, studentId });
  }, [medSheet, journalSheet, studentId]);

  const stats = {
    announcements: data.announcements.length,
    tasks: data.todos.length,
    meetings: data.meetings.length,
  };

  return (
    <AppContext.Provider
      value={{
        data, setData,
        selectedDate, setSelectedDate,
        calendarMonth, setCalendarMonth,
        toggleTodo,
        addAnnouncement, removeAnnouncement, updateAnnouncement, markAnnouncementRead,
        addMeeting, removeMeeting, updateMeeting, getMeetingsForDate, getMeetingsForStudent,
        addCourse, updateCourse, removeCourse,
        getCoursesForStudent, getCourseById, getCourseOccurrencesForStudent,
        setCourseVerification, getStudentAvailability, getClassAvailability,
        stats,
        studentId, setStudentId,
        role, setRole,
        logout,
        medSheet, journalSheet, sheetsLoading, sheetsError,
        refreshSheets: hardRefresh,
        consistency,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
