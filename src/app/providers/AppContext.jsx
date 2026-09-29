import React, { createContext, useContext, useEffect, useState } from "react";
import { getInitialData } from "@/app/data/initial-data";
import { useAuthState } from "./useAuthState";
import { useSheetData } from "./useSheetData";
import { useAnnouncements } from "@/features/announcements/useAnnouncements";
import { useMeetings } from "@/features/schedule/useMeetings";
import { useCourseSchedule } from "@/features/schedule/useCourseSchedule";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [data, setData] = useState(getInitialData);
  const [selectedDate, setSelectedDate] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const auth = useAuthState();
  const sheets = useSheetData(auth);
  const announcements = useAnnouncements(setData);
  const meetings = useMeetings({ data, setData });
  const courses = useCourseSchedule({ data, setData, studentId: auth.studentId });

  useEffect(() => {
    localStorage.setItem("tma_955110", JSON.stringify(data));
  }, [data]);

  const toggleTodo = (id) => {
    setData((previous) => ({
      ...previous,
      todos: previous.todos.map((todo) => todo.id === id ? { ...todo, done: !todo.done } : todo),
    }));
  };

  const stats = {
    announcements: data.announcements.length,
    tasks: data.todos.length,
    meetings: data.meetings.length,
  };

  const value = {
    data,
    setData,
    selectedDate,
    setSelectedDate,
    calendarMonth,
    setCalendarMonth,
    toggleTodo,
    ...announcements,
    ...meetings,
    ...courses,
    ...auth,
    ...sheets,
    stats,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
