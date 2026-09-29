import React from "react";
import { NavLink } from "react-router-dom";
import { useApp } from "@/app/providers/AppContext";
import {
  Home, Megaphone, CheckSquare, BarChart3, CalendarDays,
  Settings, HelpCircle, LogOut,
} from "lucide-react";

const NAV = [
  { name: "Home", icon: Home, to: "/student", end: true },
  { name: "Schedule", icon: CalendarDays, to: "/student/schedule" },
  { name: "Announcements", icon: Megaphone, to: "/student/announcements" },
  { name: "Tasks", icon: CheckSquare, to: "/student/tasks" },
  { name: "Analitics", icon: BarChart3, to: "/student/analytics" },
];

export default function Sidebar() {
  const { logout } = useApp();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <svg viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="10" fill="white" fillOpacity="0.12" />
          <path d="M12 14C12 12.895 12.895 12 14 12H20C21.105 12 22 12.895 22 14V20C22 21.105 21.105 22 20 22H14C12.895 22 12 21.105 12 20V14Z" fill="white" />
          <path d="M18 18C18 16.895 18.895 16 20 16H26C27.105 16 28 16.895 28 18V26C28 27.105 27.105 28 26 28H20C18.895 28 18 27.105 18 26V18Z" fill="white" fillOpacity="0.5" />
        </svg>
      </div>

      <nav className="sidebar-nav">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `sidebar-nav-item ${isActive ? "active" : ""}`
              }
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <button className="sidebar-nav-item" type="button">
          <HelpCircle size={20} />
          <span>Support</span>
        </button>
        <button className="sidebar-nav-item" type="button" onClick={logout}>
          <LogOut size={20} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
