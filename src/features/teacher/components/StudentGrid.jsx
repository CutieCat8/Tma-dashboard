import React, { useState, useMemo } from "react";

const FILTERS = ["All", "On time", "Late", "Missing"];

export default function StudentGrid({ students, onPick }) {
  const [filter, setFilter] = useState("All");

  const filtered = useMemo(() => {
    if (filter === "All") return students;
    if (filter === "On time") return students.filter((s) => s.status === "on-time");
    if (filter === "Late") return students.filter((s) => s.status === "late");
    if (filter === "Missing") return students.filter((s) => s.status === "missing");
    return students;
  }, [students, filter]);

  return (
    <section className="t-card">
      <header className="t-card-head">
        <div>
          <h3 className="t-card-title">Class Roster</h3>
          <p className="t-card-sub">{students.length} students · today's form status</p>
        </div>
        <div className="t-pill-row">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              className={`t-tab ${filter === f ? "on" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      <div className="t-grid">
        {filtered.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`t-grid-cell ${s.status}`}
            onClick={() => onPick && onPick(s)}
          >
            <span className="t-grid-avatar">
              {s.name
                .split(" ")
                .map((p) => p[0])
                .join("")
                .slice(0, 2)}
            </span>
            <span className="t-grid-name">{s.name}</span>
            <span className="t-grid-id">{String(s.seat).padStart(2, "0")}</span>
            <span className="t-grid-dots">
              <span className={`t-dot ${s.meditation ? "on" : ""}`} title="Meditation" />
              <span className={`t-dot ${s.journal ? "on" : ""}`} title="Journal" />
              <span className={`t-dot ${s.assignment ? "on" : ""}`} title="Assignment" />
            </span>
          </button>
        ))}
      </div>

      <footer className="t-legend">
        <span><span className="t-dot on" /> Submitted</span>
        <span><span className="t-dot" /> Missing</span>
        <span><span className="t-status-chip on-time">On time</span></span>
        <span><span className="t-status-chip late">Late</span></span>
        <span><span className="t-status-chip missing">Missing</span></span>
      </footer>
    </section>
  );
}
