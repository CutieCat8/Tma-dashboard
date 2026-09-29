import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ScheduleDatePicker } from "./ScheduleFormControls";

function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
    .format(new Date(`${date}T00:00:00`));
}

export default function CourseExceptionsEditor({ exceptions, onChange }) {
  const [newDate, setNewDate] = useState("");
  const sorted = [...exceptions].sort((a, b) => a.date.localeCompare(b.date));
  const alreadyListed = exceptions.some((exception) => exception.date === newDate);

  const addCancelled = () => {
    if (!newDate || alreadyListed) return;
    onChange([...exceptions, { id: `ex-${Date.now()}`, date: newDate, type: "cancelled", reason: "Cancelled by student" }]);
    setNewDate("");
  };

  return (
    <section className="course-form-section course-exceptions">
      <div className="course-session-head">
        <div>
          <h3>Cancelled and changed dates</h3>
          <p>Days this course does not meet, or meets at a different time or room.</p>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="course-exceptions-empty">No exceptions. The course meets every week in the term.</p>
      ) : (
        <ul className="course-exceptions-list">
          {sorted.map((exception) => (
            <li key={exception.id}>
              <strong>{formatDate(exception.date)}</strong>
              <span className={`course-exception-tag is-${exception.type}`}>
                {exception.type === "cancelled" ? "Cancelled" : `Changed · ${exception.startTime}–${exception.endTime}${exception.location ? ` · ${exception.location}` : ""}`}
              </span>
              <button
                type="button"
                className="course-session-remove"
                onClick={() => onChange(exceptions.filter((item) => item.id !== exception.id))}
                aria-label={`Remove exception on ${exception.date}`}
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="course-exceptions-add">
        <ScheduleDatePicker value={newDate} onChange={setNewDate} placeholder="Pick a date to cancel" />
        <button type="button" className="course-cancel-btn" onClick={addCancelled} disabled={!newDate || alreadyListed}>
          <Plus size={16} /> Cancel this date
        </button>
      </div>
    </section>
  );
}
