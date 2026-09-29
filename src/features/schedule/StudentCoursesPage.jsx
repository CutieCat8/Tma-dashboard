import React, { useMemo, useState } from "react";
import { ArrowLeft, BookOpen, Briefcase, Check, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/app/providers/AppContext";
import { ACADEMIC_TERMS, getDefaultTermId, getTermState, groupCoursesByTerm } from "./lib/academic-terms";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const STATUS_LABEL = { verified: "Verified by teacher", "needs-review": "Needs review", "self-reported": "Self-reported" };
const LIST_PATH = "/student/schedule/courses";
const OTHER = "other";

function toISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthYear(iso, withYear) {
  return new Intl.DateTimeFormat("en-US", withYear ? { month: "short", year: "numeric" } : { month: "short" })
    .format(new Date(`${iso}T00:00:00`));
}

function formatRange(term) {
  const sameYear = term.start.slice(0, 4) === term.end.slice(0, 4);
  return `${monthYear(term.start, !sameYear)} – ${monthYear(term.end, true)}`;
}

function describeSessions(sessions) {
  return [...sessions]
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime))
    .map((session) => `${DAY_NAMES[session.dayOfWeek]} ${session.startTime}–${session.endTime}`)
    .join(" · ");
}

export default function StudentCoursesPage() {
  const navigate = useNavigate();
  const { studentId, getCoursesForStudent, removeCourse } = useApp();
  const today = toISO(new Date());
  const [selectedId, setSelectedId] = useState(() => getDefaultTermId(today));
  const [search, setSearch] = useState("");
  const courses = getCoursesForStudent(studentId);

  const { byTerm, unassigned } = useMemo(() => groupCoursesByTerm(courses), [courses]);
  const term = ACADEMIC_TERMS.find((item) => item.id === selectedId) || null;
  const termCourses = selectedId === OTHER ? unassigned : byTerm.get(selectedId) || [];

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...termCourses]
      .filter((course) => !query || `${course.courseCode} ${course.courseName} ${course.defaultLocation}`.toLowerCase().includes(query))
      .sort((a, b) => a.termStart.localeCompare(b.termStart) || a.courseName.localeCompare(b.courseName));
  }, [termCourses, search]);

  const remove = (course) => {
    if (!window.confirm(`Delete ${course.courseCode} ${course.courseName}?`)) return;
    removeCourse(course.id);
  };

  const addToTerm = () => navigate("/student/schedule/add-course", {
    state: { from: LIST_PATH, term: term ? { start: term.start, end: term.end } : undefined },
  });

  const verifiedCount = termCourses.filter((course) => course.verificationStatus === "verified").length;

  return (
    <div className="main-wrapper course-form-page">
      <main className="main-content course-form-shell">
        <button className="back-btn" type="button" onClick={() => navigate("/student/schedule")}>
          <ArrowLeft size={18} /> Back to schedule
        </button>

        <header className="course-form-title-row">
          <div>
            <span>Programme timeline</span>
            <h1>My courses</h1>
            <p>{courses.length} registered {courses.length === 1 ? "course" : "courses"} across your 3-year programme.</p>
          </div>
          <div className="course-form-title-actions">
            <button type="button" className="course-save-btn" onClick={addToTerm}>
              <Plus size={17} /> Add course
            </button>
          </div>
        </header>

        <nav className="term-timeline" aria-label="Programme terms">
          <ol>
            {ACADEMIC_TERMS.map((item) => {
              const state = getTermState(item, today);
              const count = (byTerm.get(item.id) || []).length;
              return (
                <li key={item.id} className={`is-${state}`}>
                  <button
                    type="button"
                    className={`term-node${selectedId === item.id ? " is-selected" : ""}`}
                    aria-current={selectedId === item.id ? "true" : undefined}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <span className="term-node-dot" aria-hidden="true">
                      {state === "past" ? <Check size={12} /> : item.kind === "internship" ? <Briefcase size={12} /> : null}
                    </span>
                    <strong>{item.short}</strong>
                    <small>{formatRange(item)}</small>
                    <span className="term-node-meta">
                      {state === "current" && <em>Now</em>}
                      {item.kind === "study" && <b>{count} {count === 1 ? "course" : "courses"}</b>}
                    </span>
                  </button>
                </li>
              );
            })}
            {unassigned.length > 0 && (
              <li className="is-other">
                <button
                  type="button"
                  className={`term-node${selectedId === OTHER ? " is-selected" : ""}`}
                  onClick={() => setSelectedId(OTHER)}
                >
                  <span className="term-node-dot" aria-hidden="true" />
                  <strong>Other dates</strong>
                  <small>Outside the programme</small>
                  <span className="term-node-meta"><b>{unassigned.length} {unassigned.length === 1 ? "course" : "courses"}</b></span>
                </button>
              </li>
            )}
          </ol>
        </nav>

        <section className="term-panel" aria-live="polite">
          <header className="term-panel-head">
            <div>
              <h2>{term ? term.label : "Courses outside the programme terms"}</h2>
              <p>
                {term
                  ? `${formatRange(term)}${term.kind === "study" ? ` · ${termCourses.length} ${termCourses.length === 1 ? "course" : "courses"}${verifiedCount ? ` · ${verifiedCount} verified` : ""}` : " · 16 months"}`
                  : "These courses do not fall inside any programme term."}
              </p>
            </div>
            <label className="my-courses-search">
              <Search size={16} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search this term" />
            </label>
          </header>

          {term?.kind === "internship" && (
            <div className="term-internship-note">
              <Briefcase size={20} />
              <div>
                <strong>Internship until graduation</strong>
                <span>Year 3 is a 16-month internship, so there are no classes to register in this period.</span>
              </div>
            </div>
          )}

          {visible.length === 0 ? (
            term?.kind === "internship" && termCourses.length === 0 ? null : (
              <div className="course-form-missing">
                <BookOpen size={32} />
                <h1>{termCourses.length === 0 ? "No courses in this term yet" : "No matching courses"}</h1>
                <p>{termCourses.length === 0 ? "Add a course here, or import an .ics calendar from the schedule page." : "Try a different search."}</p>
                {termCourses.length === 0 && (
                  <button type="button" className="course-save-btn" onClick={addToTerm}><Plus size={17} /> Add course to this term</button>
                )}
              </div>
            )
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
        </section>
      </main>
    </div>
  );
}
