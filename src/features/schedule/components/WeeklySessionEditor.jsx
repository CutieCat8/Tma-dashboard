import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { ScheduleDaySelect, ScheduleTimeSelect } from "./ScheduleFormControls";

export function emptySession() {
  return {
    id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "10:30",
    location: "",
  };
}

export default function WeeklySessionEditor({ sessions, onChange, errors = {} }) {
  const update = (index, field, value) => {
    onChange(sessions.map((session, sessionIndex) => (
      sessionIndex === index ? { ...session, [field]: value } : session
    )));
  };

  return (
    <div className="course-session-editor">
      <div className="course-session-head">
        <div>
          <h3>Weekly class times</h3>
          <p>Add every day and time this course meets each week.</p>
        </div>
        <button type="button" onClick={() => onChange([...sessions, emptySession()])}>
          <Plus size={16} /> Add class time
        </button>
      </div>

      {errors.sessions && <div className="course-form-error">{errors.sessions}</div>}

      <div className="course-session-list">
        {sessions.map((session, index) => (
          <div className="course-session-row" key={session.id || index}>
            <label>
              <span>Day</span>
              <ScheduleDaySelect value={session.dayOfWeek} onChange={(value) => update(index, "dayOfWeek", value)} />
            </label>
            <label>
              <span>Starts</span>
              <ScheduleTimeSelect label="Class starts" value={session.startTime} onChange={(value) => update(index, "startTime", value)} />
            </label>
            <label>
              <span>Ends</span>
              <ScheduleTimeSelect label="Class ends" value={session.endTime} onChange={(value) => update(index, "endTime", value)} />
            </label>
            <label className="course-session-location">
              <span>Room / location</span>
              <input value={session.location} onChange={(event) => update(index, "location", event.target.value)} placeholder="Optional" />
            </label>
            <button
              type="button"
              className="course-session-remove"
              onClick={() => onChange(sessions.filter((_, sessionIndex) => sessionIndex !== index))}
              disabled={sessions.length === 1}
              aria-label="Remove class time"
            >
              <Trash2 size={16} />
            </button>
            {(errors[`sessions.${index}.startTime`] || errors[`sessions.${index}.endTime`]) && (
              <div className="course-session-inline-error">
                {errors[`sessions.${index}.startTime`] || errors[`sessions.${index}.endTime`]}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
