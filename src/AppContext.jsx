import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { fetchSheet, SHEETS, clearSheetCache } from "./lib/sheets";
import { buildStudentStats } from "./lib/consistency";

const AppContext = createContext();

function getInitialData() {
  const defaults = getDefaults();
  const saved = localStorage.getItem("tma_955110");
  if (saved) {
    const parsed = JSON.parse(saved);
    return { ...parsed, teacher: defaults.teacher };
  }
  return defaults;
}

function getDefaults() {
  return {
    meetings: {
      "2026-04-28": {
        title: "นัดประชุมอัพเดตสถานะโปรเจค",
        date: "28 เม.ย. 2026",
        time: "09:00 - 12:00 น.",
        location: "ห้อง 6301 ตึก CBB",
        attendees: "ทั้งห้อง (15+ คน)",
      },
      "2026-04-30": {
        title: "นัดตรวจ Assignment 3",
        date: "30 เม.ย. 2026",
        time: "13:00 - 16:00 น.",
        location: "ห้อง Lab 2 ตึก CBB",
        attendees: "กลุ่ม A (8 คน)",
      },
      "2026-05-05": {
        title: "สอบกลางภาค",
        date: "5 พ.ค. 2026",
        time: "09:00 - 12:00 น.",
        location: "ห้องสอบ 101",
        attendees: "ทั้งห้อง",
      },
    },
    announcements: [
      { id: 1, title: "ส่งงาน Assignment 3 ภายในวันที่ 30 เม.ย.", date: "2026-04-25", read: false },
      { id: 2, title: "อ่านบทที่ 5 ก่อนเข้าเรียนสัปดาห์หน้า", date: "2026-04-24", read: true },
      { id: 3, title: "เปลี่ยนห้องเรียนสัปดาห์หน้า ย้ายไปห้อง 6302", date: "2026-04-23", read: true },
      { id: 4, title: "แจ้งเลื่อนกำหนดส่ง Assignment 2", date: "2026-04-20", read: true },
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
  const [currentPage, setCurrentPage] = useState("Home");
  const [selectedDate, setSelectedDate] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const [studentId, setStudentIdState] = useState(() => localStorage.getItem("tma_studentId") || "");
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

  const logout = useCallback(() => {
    setStudentId("");
  }, [setStudentId]);

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

  // Auto-fetch sheets once a studentId exists
  useEffect(() => {
    if (studentId) refreshSheets();
  }, [studentId, refreshSheets]);

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

  const consistency = useMemo(() => {
    if (!medSheet || !journalSheet || !studentId) return null;
    return buildStudentStats({ medSheet, journalSheet, studentId });
  }, [medSheet, journalSheet, studentId]);

  const stats = {
    announcements: data.announcements.length,
    tasks: data.todos.length,
    meetings: Object.keys(data.meetings).length,
  };

  return (
    <AppContext.Provider
      value={{
        data, setData, currentPage, setCurrentPage,
        selectedDate, setSelectedDate,
        calendarMonth, setCalendarMonth,
        toggleTodo, stats,
        studentId, setStudentId, logout,
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
