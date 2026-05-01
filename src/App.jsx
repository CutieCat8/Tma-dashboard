import React from "react";
import { AppProvider, useApp } from "./AppContext";
import Sidebar from "./components/Sidebar";
import LoginScreen from "./components/LoginScreen";
import HomePage from "./pages/HomePage";
import TasksPage from "./pages/TasksPage";
import ConsistencyPage from "./pages/ConsistencyPage";

function PageRouter() {
  const { currentPage } = useApp();

  switch (currentPage) {
    case "Tasks":
      return <TasksPage />;
    case "Analitics":
      return <ConsistencyPage />;
    case "Home":
    default:
      return <HomePage />;
  }
}

function Shell() {
  const { studentId } = useApp();
  if (!studentId) return <LoginScreen />;
  return (
    <div className="app-layout">
      <Sidebar />
      <PageRouter />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
