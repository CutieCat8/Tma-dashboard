import React from "react";
import { useApp } from "@/app/providers/AppContext";
import { MessageCircle, GraduationCap, Users } from "lucide-react";

export default function StatsRow() {
  const { stats } = useApp();

  const items = [
    { label: "Announcement", value: stats.announcements, icon: MessageCircle },
    { label: "Tasks", value: stats.tasks, icon: GraduationCap },
    { label: "Meeting", value: stats.meetings, icon: Users },
  ];

  return (
    <div className="stats-row fade-in-delay-1">
      {items.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="stat-item">
            <div className="stat-icon"><Icon size={22} /></div>
            <div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
