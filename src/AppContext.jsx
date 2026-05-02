import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { fetchSheet, SHEETS, clearSheetCache } from "./lib/sheets";
import { buildStudentStats } from "./lib/consistency";

const AppContext = createContext();

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
        addAnnouncement, removeAnnouncement, markAnnouncementRead,
        addMeeting, removeMeeting, getMeetingsForDate, getMeetingsForStudent,
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
