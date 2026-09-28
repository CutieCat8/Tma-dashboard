import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { useApp } from "../AppContext";
import { DropdownRangeDatePicker } from "@/components/ui/dropdown-range-date-picker";

const DAY_START = 8;
const DAY_END = 18;
const HOURS = Array.from({ length: DAY_END - DAY_START + 1 }, (_, index) => DAY_START + index);
const EVENT_COLORS = ["rose", "amber", "blue", "violet", "sage"];

function toISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function fromISO(iso) {
  return new Date(`${iso}T00:00:00`);
}

function addDays(iso, amount) {
  const date = fromISO(iso);
  date.setDate(date.getDate() + amount);
  return toISO(date);
}

function addMonths(iso, amount) {
  const date = fromISO(iso);
  date.setDate(1);
  date.setMonth(date.getMonth() + amount);
  return toISO(date);
}

function formatDate(iso, options) {
  return new Intl.DateTimeFormat("en-US", options).format(fromISO(iso));
}

function parseMeetingTime(value = "") {
  const times = [...value.matchAll(/(\d{1,2}):(\d{2})/g)].map((match) => (
    Number(match[1]) + Number(match[2]) / 60
  ));
  const start = times[0] ?? 9;
  const end = times[1] ?? Math.min(start + 1.5, DAY_END);
  return { start, end: Math.max(end, start + 0.75) };
}

function eventPosition(time) {
  const { start, end } = parseMeetingTime(time);
  const span = DAY_END - DAY_START;
  const clampedStart = Math.max(DAY_START, Math.min(start, DAY_END - 0.75));
  const clampedEnd = Math.max(clampedStart + 0.75, Math.min(end, DAY_END));
  return {
    "--event-start": `${((clampedStart - DAY_START) / span) * 100}%`,
    "--event-width": `${((clampedEnd - clampedStart) / span) * 100}%`,
  };
}

function buildVisibleDays(activeDate, view, meetings, selectedRange) {
  if (selectedRange?.from) {
    const start = toISO(selectedRange.from);
    const end = toISO(selectedRange.to || selectedRange.from);
    const dates = [];
    let cursor = start;
    while (cursor <= end && dates.length < 62) {
      dates.push(cursor);
      cursor = addDays(cursor, 1);
    }
    return dates;
  }

  if (view === "day") return [activeDate];

  if (view === "week") {
    const date = fromISO(activeDate);
    const mondayOffset = date.getDay() === 0 ? -6 : 1 - date.getDay();
    const monday = addDays(activeDate, mondayOffset);
    return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
  }

  const active = fromISO(activeDate);
  const dates = [...new Set(
    meetings
      .filter((meeting) => {
        const date = fromISO(meeting.date);
        return date.getFullYear() === active.getFullYear() && date.getMonth() === active.getMonth();
      })
      .map((meeting) => meeting.date)
  )].sort();

  return dates.length > 0 ? dates : [toISO(new Date(active.getFullYear(), active.getMonth(), 1))];
}

export default function StudentSchedulePage() {
  const { studentId, getMeetingsForStudent } = useApp();
  const navigate = useNavigate();
  const [view, setView] = useState("day");
  const [selectedDate, setSelectedDate] = useState(null);
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState("all");
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [selectedRange, setSelectedRange] = useState(undefined);

  useEffect(() => {
    if (!selectedMeeting) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === "Escape") setSelectedMeeting(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedMeeting]);

  const meetings = useMemo(
    () => getMeetingsForStudent(studentId),
    [getMeetingsForStudent, studentId]
  );

  const firstRelevantDate = useMemo(() => {
    const today = toISO(new Date());
    const sorted = [...meetings].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.find((meeting) => meeting.date >= today)?.date || sorted.at(-1)?.date || today;
  }, [meetings]);

  const activeDate = selectedDate || firstRelevantDate;

  const searchedMeetings = useMemo(() => {
    const query = search.trim().toLowerCase();
    return meetings.filter((meeting) => {
      const matchesScope = scope === "all" || (
        scope === "private" ? meeting.attendeeMode !== "all" : meeting.attendeeMode === "all"
      );
      const matchesSearch = !query || [meeting.title, meeting.location, meeting.description]
        .some((value) => (value || "").toLowerCase().includes(query));
      return matchesScope && matchesSearch;
    });
  }, [meetings, scope, search]);

  const visibleDays = useMemo(
    () => buildVisibleDays(activeDate, view, searchedMeetings, selectedRange),
    [activeDate, view, searchedMeetings, selectedRange]
  );

  const pickerRange = useMemo(
    () => selectedRange || { from: fromISO(activeDate), to: fromISO(activeDate) },
    [activeDate, selectedRange]
  );

  const rows = useMemo(() => visibleDays.map((date) => ({
    date,
    items: searchedMeetings
      .filter((meeting) => meeting.date === date)
      .sort((a, b) => (a.time || "").localeCompare(b.time || "")),
  })), [searchedMeetings, visibleDays]);

  const visibleCount = rows.reduce((total, row) => total + row.items.length, 0);

  const moveDate = (direction) => {
    setSelectedRange(undefined);
    if (view === "month") {
      setSelectedDate(addMonths(activeDate, direction));
      return;
    }
    setSelectedDate(addDays(activeDate, direction * (view === "week" ? 7 : 1)));
  };

  const dateHeading = selectedRange?.from
    ? `${formatDate(toISO(selectedRange.from), { month: "short", day: "numeric" })} – ${formatDate(toISO(selectedRange.to || selectedRange.from), { month: "short", day: "numeric", year: "numeric" })}`
    : view === "month"
    ? formatDate(activeDate, { month: "long", year: "numeric" })
    : view === "week"
    ? `${formatDate(visibleDays[0], { month: "short", day: "numeric" })} – ${formatDate(visibleDays.at(-1), { month: "short", day: "numeric", year: "numeric" })}`
    : formatDate(activeDate, { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const cycleScope = () => {
    setScope((current) => current === "all" ? "class" : current === "class" ? "private" : "all");
  };

  return (
    <div className="main-wrapper sched-page personal-schedule-page">
      <main className="main-content">
        <header className="personal-schedule-header">
          <div>
            <button className="back-btn" onClick={() => navigate("/student")}>
              <ArrowLeft size={18} />
              <span>Back</span>
            </button>
            <h1 className="page-title">My schedule</h1>
            <p className="page-date">Your personal classes, meetings and appointments.</p>
          </div>

          <div className="personal-schedule-actions">
            <label className="personal-schedule-search">
              <Search size={17} />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search schedule"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} aria-label="Clear search">
                  <X size={14} />
                </button>
              )}
            </label>
          </div>
        </header>

        <section className="personal-schedule-board fade-in">
          <div className="personal-schedule-toolbar">
            <div className="personal-date-control">
              <div className="personal-date-nav">
                <button type="button" onClick={() => moveDate(-1)} aria-label="Previous period">
                  <ChevronLeft size={18} />
                </button>
                <button type="button" onClick={() => moveDate(1)} aria-label="Next period">
                  <ChevronRight size={18} />
                </button>
              </div>
              <div className="personal-date-copy">
                <h2>{dateHeading}</h2>
                <span>{visibleCount} {visibleCount === 1 ? "appointment" : "appointments"}</span>
              </div>
            </div>

            <div className="personal-toolbar-controls">
              <div className="personal-view-switch" aria-label="Calendar view">
                {["day", "week", "month"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={view === option ? "active" : ""}
                    onClick={() => {
                      setSelectedRange(undefined);
                      setView(option);
                    }}
                  >
                    {option[0].toUpperCase() + option.slice(1)}
                  </button>
                ))}
              </div>

              <button type="button" className="personal-filter-btn" onClick={cycleScope}>
                {scope === "all" ? "All meetings" : scope === "class" ? "Class" : "1:1"}
                <ChevronDown size={15} />
              </button>

              <DropdownRangeDatePicker
                value={pickerRange}
                onApply={(range) => {
                  if (!range?.from) {
                    setSelectedRange(undefined);
                    return;
                  }

                  const from = toISO(range.from);
                  const to = toISO(range.to || range.from);
                  setSelectedDate(from);
                  setSelectedRange(from === to ? undefined : range);
                  setView("day");
                }}
              />
            </div>
          </div>

          <div className="personal-timeline-scroll">
            <div className="personal-timeline">
              <div className="personal-time-corner">Personal calendar</div>
              <div className="personal-time-axis">
                {HOURS.map((hour) => (
                  <span key={hour}>{hour === 12 ? "Noon" : hour > 12 ? `${hour - 12} pm` : `${hour} am`}</span>
                ))}
              </div>

              {rows.map((row) => (
                <React.Fragment key={row.date}>
                  <div className="personal-row-label">
                    <span className="personal-row-day">
                      {formatDate(row.date, { weekday: "short" })}
                    </span>
                    <strong>{formatDate(row.date, { month: "short", day: "numeric" })}</strong>
                    <span>{row.items.length ? `${row.items.length} scheduled` : "Available"}</span>
                  </div>

                  <div
                    className={`personal-row-track ${row.items.length ? "has-events" : "is-empty"}`}
                    style={{ "--event-rows": Math.max(row.items.length, 1) }}
                  >
                    <div className="personal-grid-lines" aria-hidden="true">
                      {HOURS.map((hour) => <i key={hour} />)}
                    </div>

                    {row.items.length === 0 ? (
                      <div className="personal-empty-slot">
                        <Clock3 size={16} /> No appointments scheduled
                      </div>
                    ) : row.items.map((meeting, index) => (
                      <button
                        type="button"
                        key={meeting.id}
                        className={`personal-event color-${EVENT_COLORS[index % EVENT_COLORS.length]}`}
                        style={{ ...eventPosition(meeting.time), "--event-row": index }}
                        title={`${meeting.title}${meeting.time ? ` · ${meeting.time}` : ""}`}
                        aria-haspopup="dialog"
                        onClick={() => setSelectedMeeting(meeting)}
                      >
                        <div className="personal-event-main">
                          <strong>{meeting.title}</strong>
                          {meeting.time && <span>{meeting.time}</span>}
                        </div>
                        <div className="personal-event-tags">
                          {meeting.location && <span className="location-tag"><MapPin size={12} />{meeting.location}</span>}
                          <span className="type-tag"><UserRound size={12} />{meeting.attendeeMode === "all" ? "Class" : "1:1"}</span>
                        </div>
                        <ChevronRight className="personal-event-open" size={15} aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        {selectedMeeting && (
          <div
            className="schedule-event-overlay"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setSelectedMeeting(null);
            }}
          >
            <section
              className="schedule-event-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="schedule-event-title"
            >
              <header className="schedule-event-dialog-head">
                <div>
                  <span>Appointment details</span>
                  <h2 id="schedule-event-title">{selectedMeeting.title}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMeeting(null)}
                  aria-label="Close appointment details"
                >
                  <X size={18} />
                </button>
              </header>

              <div className="schedule-event-dialog-body">
                <div className="schedule-event-detail">
                  <CalendarDays size={18} />
                  <div><span>Date</span><strong>{formatDate(selectedMeeting.date, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</strong></div>
                </div>
                <div className="schedule-event-detail">
                  <Clock3 size={18} />
                  <div><span>Time</span><strong>{selectedMeeting.time || "Time not specified"}</strong></div>
                </div>
                <div className="schedule-event-detail">
                  <MapPin size={18} />
                  <div><span>Location</span><strong>{selectedMeeting.location || "Location not specified"}</strong></div>
                </div>
                <div className="schedule-event-detail">
                  <UserRound size={18} />
                  <div><span>Meeting type</span><strong>{selectedMeeting.attendeeMode === "all" ? "Class meeting" : "One-to-one meeting"}</strong></div>
                </div>

                {selectedMeeting.description && (
                  <div className="schedule-event-description">
                    <span>Notes</span>
                    <p>{selectedMeeting.description}</p>
                  </div>
                )}
              </div>

              <footer className="schedule-event-dialog-footer">
                <button type="button" onClick={() => setSelectedMeeting(null)}>Close</button>
              </footer>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
