import React from "react";
import { BookOpen, CalendarDays, Clock3, MapPin, Pencil, Trash2, UserRound, X } from "lucide-react";

function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function DialogShell({ children, labelledBy, onClose, className = "" }) {
  return (
    <div className="schedule-event-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`schedule-event-dialog ${className}`} role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
        {children}
      </section>
    </div>
  );
}

export function MeetingDetailDialog({ meeting, onClose }) {
  if (!meeting) return null;
  return (
    <DialogShell labelledBy="schedule-event-title" onClose={onClose}>
      <header className="schedule-event-dialog-head">
        <div><span>Appointment details</span><h2 id="schedule-event-title">{meeting.title}</h2></div>
        <button type="button" onClick={onClose} aria-label="Close appointment details"><X size={18} /></button>
      </header>
      <div className="schedule-event-dialog-body">
        <div className="schedule-event-detail"><CalendarDays size={18} /><div><span>Date</span><strong>{formatDate(meeting.date)}</strong></div></div>
        <div className="schedule-event-detail"><Clock3 size={18} /><div><span>Time</span><strong>{meeting.time || "Time not specified"}</strong></div></div>
        <div className="schedule-event-detail"><MapPin size={18} /><div><span>Location</span><strong>{meeting.location || "Location not specified"}</strong></div></div>
        <div className="schedule-event-detail"><UserRound size={18} /><div><span>Meeting type</span><strong>{meeting.attendeeMode === "all" ? "Class meeting" : "One-to-one meeting"}</strong></div></div>
        {meeting.description && <div className="schedule-event-description"><span>Notes</span><p>{meeting.description}</p></div>}
      </div>
      <footer className="schedule-event-dialog-footer"><button type="button" onClick={onClose}>Close</button></footer>
    </DialogShell>
  );
}

export function CourseDetailDialog({ course, onClose, onDelete, onEdit }) {
  if (!course) return null;
  return (
    <DialogShell labelledBy="course-detail-title" onClose={onClose} className="course-detail-dialog">
      <header className="schedule-event-dialog-head">
        <div><span>Course details</span><h2 id="course-detail-title">{course.courseCode} · {course.courseName}</h2></div>
        <button type="button" onClick={onClose} aria-label="Close course details"><X size={18} /></button>
      </header>
      <div className="schedule-event-dialog-body">
        <div className="schedule-event-detail"><CalendarDays size={18} /><div><span>Date</span><strong>{formatDate(course.occurrence.date)}</strong></div></div>
        <div className="schedule-event-detail"><Clock3 size={18} /><div><span>Time</span><strong>{course.occurrence.startTime} - {course.occurrence.endTime}</strong></div></div>
        <div className="schedule-event-detail"><MapPin size={18} /><div><span>Location</span><strong>{course.occurrence.location || "Location not specified"}</strong></div></div>
        <div className="schedule-event-detail"><BookOpen size={18} /><div><span>Term</span><strong>{course.termStart} to {course.termEnd}</strong></div></div>
        <div className={`course-verification-pill is-${course.verificationStatus}`}>{course.verificationStatus === "verified" ? "Verified by teacher" : course.verificationStatus === "needs-review" ? "Needs review" : "Self-reported course"}</div>
        {course.privateNote && <div className="schedule-event-description"><span>Private note</span><p>{course.privateNote}</p></div>}
      </div>
      <footer className="schedule-event-dialog-footer course-detail-actions">
        <button type="button" className="course-delete-action" onClick={onDelete}><Trash2 size={16} /> Delete</button>
        <button type="button" onClick={onEdit}><Pencil size={16} /> Edit course</button>
      </footer>
    </DialogShell>
  );
}
