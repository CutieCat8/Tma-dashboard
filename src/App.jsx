import React from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AppProvider, useApp } from "./AppContext";
import { TeacherProvider } from "./context/TeacherContext";
import Sidebar from "./components/Sidebar";
import TSidebar from "./components/TSidebar";
import LoginScreen from "./components/LoginScreen";
import HomePage from "./pages/HomePage";
import TasksPage from "./pages/TasksPage";
import ConsistencyPage from "./pages/ConsistencyPage";
import TeacherHomePage from "./pages/TeacherHomePage";
import TeacherAnnouncementsPage from "./pages/TeacherAnnouncementsPage";
import TeacherSchedulePage from "./pages/TeacherSchedulePage";
import StudentAnnouncementsPage from "./pages/StudentAnnouncementsPage";
import StudentSchedulePage from "./pages/StudentSchedulePage";
import TeacherRosterPage from "./pages/TeacherRosterPage";

function StudentShell() {
  const { studentId, role } = useApp();
  if (!studentId || role !== "student") return <Navigate to="/login" replace />;
  return (
    <div className="app-layout">
      <Sidebar />
      <Outlet />
    </div>
  );
}

function TeacherShell() {
  const { role } = useApp();
  if (role !== "teacher") return <Navigate to="/login" replace />;
  return (
    <TeacherProvider>
      <div className="app-layout">
        <TSidebar />
        <Outlet />
      </div>
    </TeacherProvider>
  );
}

function RoleRedirect() {
  const { role, studentId } = useApp();
  if (role === "teacher") return <Navigate to="/teacher" replace />;
  if (role === "student" && studentId) return <Navigate to="/student" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AppProvider>
      <Routes>
        <Route path="/" element={<RoleRedirect />} />
        <Route path="/login" element={<LoginScreen />} />

        <Route path="/student" element={<StudentShell />}>
          <Route index element={<HomePage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="analytics" element={<ConsistencyPage />} />
          <Route path="announcements" element={<StudentAnnouncementsPage />} />
          <Route path="schedule" element={<StudentSchedulePage />} />
        </Route>

        <Route path="/teacher" element={<TeacherShell />}>
          <Route index element={<TeacherHomePage />} />
          <Route path="announcements" element={<TeacherAnnouncementsPage />} />
          <Route path="schedule" element={<TeacherSchedulePage />} />
          <Route path="roster" element={<TeacherRosterPage />} />
          <Route path="roster/:id" element={<TeacherRosterPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppProvider>
  );
}
