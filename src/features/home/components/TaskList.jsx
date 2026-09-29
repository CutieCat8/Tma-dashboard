import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/app/providers/AppContext";
import { Check, Globe, BookOpen, FileText, Megaphone } from "lucide-react";

const ICONS = {
  Assignment: FileText,
  Reading: BookOpen,
  Daily: Globe,
};

const COLORS = {
  Assignment: "task-blue",
  Reading: "task-green",
  Daily: "task-purple",
};

export default function TaskList() {
  const { data, toggleTodo } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Forum");

  const tabs = ["Forum", "To-do"];

  return (
    <section className="tasks-section fade-in-delay-3">
      <div className="tasks-header">
        <h2>Today's Tasks</h2>
        <a
          className="see-all"
          href="#"
          onClick={(e) => { e.preventDefault(); navigate("/student/tasks"); }}
        >
          SEE ALL
        </a>
      </div>

      <div className="tasks-tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`task-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Forum" && (
        <div className="task-list">
          {data.announcements.slice(0, 5).map((a) => {
            const dateLabel = a.dateStart || a.date || "";
            return (
              <div
                key={a.id}
                className={`task-item ${a.read ? "read" : "unread"}`}
                onClick={() => navigate("/student/announcements")}
                role="button"
              >
                <div className="task-icon task-orange">
                  <Megaphone size={20} />
                </div>
                <div className="task-info">
                  <div className="task-name">{a.title}</div>
                  <div className="task-meta">
                    <span className="subject">{a.category || "955110"}</span>
                    {dateLabel && (
                      <>
                        <span>•</span>
                        <span>{dateLabel}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className={`read-badge ${a.read ? "is-read" : ""}`}>
                  {a.read ? "อ่านแล้ว" : "ใหม่"}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "To-do" && (
        <div className="task-list">
          {data.todos.map((task) => {
            const Icon = ICONS[task.type] || FileText;
            const colorCls = COLORS[task.type] || "task-blue";
            return (
              <div key={task.id} className="task-item">
                <div className={`task-icon ${colorCls}`}>
                  <Icon size={20} />
                </div>
                <div className="task-info">
                  <div className="task-name">{task.title}</div>
                  <div className="task-meta">
                    <span className="subject">{task.subject}</span>
                    <span>•</span>
                    <span>{task.type}</span>
                    <span>•</span>
                    <span>กำหนด {task.dueDate}</span>
                  </div>
                </div>
                <div className="task-check" onClick={() => toggleTodo(task.id)}>
                  <div className={`task-checkbox ${task.done ? "checked" : ""}`}>
                    {task.done && <Check size={14} />}
                  </div>
                  <span>{task.done ? "เสร็จ" : "Done"}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
