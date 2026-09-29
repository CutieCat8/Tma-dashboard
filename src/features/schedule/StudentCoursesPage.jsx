import React, { useMemo, useState } from "react";
import { ArrowLeft, BookOpen, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/app/providers/AppContext";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const STATUS_LABEL = { verified: "Verified by teacher", "needs-review": "Needs review", "self-reported": "Self-reported" };
const LIST_PATH = "/student/schedule/courses";

function describeSessions(sessions) {
  return [...sessions]
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime))
    .map((session) => `${DAY_NAMES[session.dayOfWeek]} ${session.startTime}–${session.endTime}`)
    .join(" · ");
}

export default function StudentCoursesPage() {
  const navigate = useNavigate();
  const { studentId, getCoursesForStudent, removeCourse } = useApp();
  const [search, setSearch] = useState("");
  const courses = getCoursesForStudent(studentId);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...courses]
      .filter((course) => !query || `${course.courseCode} ${course.courseName} ${course.defaultLocation}`.toLowerCase().includes(query))
      .sort((a, b) => b.termStart.localeCompare(a.termStart) || a.courseName.localeCompare(b.courseName));
  }, [courses, search]);

  const remove = (course) => {
    if (!window.confirm(`Delete ${course.courseCode} ${course.courseName}?`)) return;
    removeCourse(course.id);
  };

  return (
    <div className="main-wrapper course-form-page">
      <main className="main-content course-form-shell">
        <button className="back-btn" type="button" onClick={() => navigate("/student/schedule/add-course")}>
          <ArrowLeft size={18} /> Back to add course
        </button>

        <header className="course-form-title-row">
          <div>
            <span>Personal timetable</span>
            <h1>My courses</h1>
            <p>{courses.length} registered {courses.length === 1 ? "course" : "courses"}. Open one to edit its details, times and cancelled dates.</p>
          </div>
          <div className="course-form-title-actions">
            <label className="my-courses-search">
              <Search size={16} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search courses" />
            </label>
            <button type="button" className="course-save-btn" onClick={() => navigate("/student/schedule/add-course")}>
              <Plus size={17} /> Add course
            </button>
          </div>
        </header>

        {visible.length === 0 ? (
          <div className="course-form-missing">
            <BookOpen size={32} />
            <h1>{courses.length === 0 ? "No courses yet" : "No matching courses"}</h1>
            <p>{courses.length === 0 ? "Add a course or import an .ics calendar from the schedule page." : "Try a different search."}</p>
          </div>
        ) : (
          <ul className="my-courses-list">
            {visible.map((course) => {
              const changed = course.exceptions.length;
              return (
                <li key={course.id} className="my-course-card" style={{ "--course-color": course.color }}>
                  <div className="my-course-main">
                    <strong>{course.courseCode} · {course.courseName}</strong>
                    <span>{describeSessions(course.sessions)}</span>
                    <small>
                      {course.termStart} to {course.termEnd}
                      {course.defaultLocation ? ` · ${course.defaultLocation}` : ""}
                      {changed ? ` · ${changed} cancelled/changed ${changed === 1 ? "date" : "dates"}` : ""}
                    </small>
                  </div>
                  <div className={`course-verification-pill is-${course.verificationStatus}`}>{STATUS_LABEL[course.verificationStatus]}</div>
                  <div className="my-course-actions">
                    <button
                      type="button"
                      onClick={() => navigate(`/student/schedule/courses/${course.id}/edit`, { state: { from: LIST_PATH } })}
                    >
                      <Pencil size={15} /> Edit
                    </button>
                    <button type="button" className="course-delete-action" onClick={() => remove(course)} aria-label={`Delete ${course.courseCode}`}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
