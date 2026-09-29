import React, { useState } from "react";
import { X } from "lucide-react";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function describeSessions(sessions) {
  return sessions.map((s) => `${DAY_NAMES[s.dayOfWeek]} ${s.startTime}–${s.endTime}`).join(", ");
}

const isLocked = (matches) => matches.some((course) => course.verificationStatus !== "self-reported");

export function IcsImportDialog({ result, existingByKey, onImport, onClose }) {
  const [selected, setSelected] = useState(
    () => new Set(result.courses.filter((c) => !isLocked(existingByKey.get(c.dupKey) || []) && !c.oneTime).map((c) => c.key))
  );
  const { courses, skipped } = result;
  const skippedTotal = skipped.unsupported + skipped.invalid;

  const toggle = (key) => setSelected((current) => {
    const next = new Set(current);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  });

  return (
    <div className="schedule-event-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="schedule-event-dialog ics-import-dialog" role="dialog" aria-modal="true" aria-labelledby="ics-import-title">
        <header className="schedule-event-dialog-head">
          <div><span>Import calendar</span><h2 id="ics-import-title">{courses.length} {courses.length === 1 ? "course" : "courses"} found</h2></div>
          <button type="button" onClick={onClose} aria-label="Close import"><X size={18} /></button>
        </header>

        <div className="schedule-event-dialog-body">
          {courses.length === 0 && (
            <p className="ics-import-note">No importable events were found in this file.</p>
          )}
          {courses.map((course) => {
            const matches = existingByKey.get(course.dupKey) || [];
            const locked = isLocked(matches);
            return (
              <label key={course.key} className={`ics-import-row${locked ? " is-duplicate" : ""}`}>
                <input
                  type="checkbox"
                  checked={selected.has(course.key)}
                  disabled={locked}
                  onChange={() => toggle(course.key)}
                />
                <span className="ics-import-swatch" style={{ background: course.color }} aria-hidden="true" />
                <span className="ics-import-copy">
                  <strong>{course.courseCode === "IMPORT" ? course.courseName : `${course.courseCode} · ${course.courseName}`}</strong>
                  <small>{describeSessions(course.sessions)}</small>
                  <small>
                    {course.termStart} to {course.termEnd}
                    {course.openEnded ? " (no end date in calendar, capped at 1 year)" : ""}
                    {course.exceptions.length ? ` · ${course.exceptions.length} changed/cancelled` : ""}
                  </small>
                  {course.oneTime && <small>One-time event (not selected by default)</small>}
                  {matches.length > 0 && !locked && <small>Replaces your saved course of the same name (colour and private note are kept)</small>}
                  {locked && <small>Verified by a teacher, so it can't be replaced</small>}
                </span>
              </label>
            );
          })}
          {skippedTotal > 0 && (
            <p className="ics-import-note">
              Skipped {skippedTotal} other {skippedTotal === 1 ? "event" : "events"}
              {skipped.unsupported ? ` (${skipped.unsupported} with unsupported repeat rules)` : ""}
              {skipped.invalid ? ` (${skipped.invalid} invalid or spanning midnight)` : ""}.
            </p>
          )}
        </div>

        <footer className="schedule-event-dialog-footer">
          <button type="button" disabled={selected.size === 0} onClick={() => onImport(courses.filter((c) => selected.has(c.key)))}>
            Import {selected.size || ""}
          </button>
        </footer>
      </section>
    </div>
  );
}
