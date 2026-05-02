import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Clock, MapPin, Users, User, CalendarDays, Search, X,
} from "lucide-react";
import { useApp } from "../AppContext";

const TH_MONTHS_FULL = [
  "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
  "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม",
];
const TH_MONTHS_SHORT = [
  "ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.",
  "ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค.",
];
const TH_WEEKDAYS = ["อา","จ","อ","พ","พฤ","ศ","ส"];

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtDateFull(iso) {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${TH_MONTHS_FULL[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function fmtDateShort(iso) {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${TH_MONTHS_SHORT[d.getMonth()]}`;
}

function dayDiff(iso) {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  const d = new Date(`${iso}T00:00:00`);
  return Math.round((d.getTime() - t.getTime()) / (1000 * 60 * 60 * 24));
}

function diffLabel(diff) {
  if (diff === 0) return { label: "วันนี้", tone: "live" };
  if (diff === 1) return { label: "พรุ่งนี้", tone: "soon" };
  if (diff > 1 && diff <= 7) return { label: `อีก ${diff} วัน`, tone: "soon" };
  if (diff > 7) return { label: `อีก ${diff} วัน`, tone: "future" };
  if (diff === -1) return { label: "เมื่อวานนี้", tone: "ended" };
  return { label: `${Math.abs(diff)} วันที่แล้ว`, tone: "ended" };
}

export default function StudentSchedulePage() {
  const { studentId, getMeetingsForStudent } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState("upcoming"); // upcoming | past | all
  const [search, setSearch] = useState("");

  const today = todayISO();

  const myMeetings = useMemo(
    () => getMeetingsForStudent(studentId),
    [getMeetingsForStudent, studentId]
  );

  const filtered = useMemo(() => {
    let list = [...myMeetings];
    if (tab === "upcoming") list = list.filter((m) => m.date >= today);
    if (tab === "past") list = list.filter((m) => m.date < today);

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((m) =>
        (m.title || "").toLowerCase().includes(q) ||
        (m.location || "").toLowerCase().includes(q) ||
        (m.description || "").toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      const cmp = a.date.localeCompare(b.date);
      if (cmp !== 0) return tab === "past" ? -cmp : cmp;
      return (a.time || "").localeCompare(b.time || "");
    });
    return list;
  }, [myMeetings, tab, search, today]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const m of filtered) {
      if (!map.has(m.date)) map.set(m.date, []);
      map.get(m.date).push(m);
    }
    return Array.from(map.entries()); // [ [date, meetings[]], ... ]
  }, [filtered]);

  const counts = useMemo(() => {
    const upcoming = myMeetings.filter((m) => m.date >= today).length;
    const past = myMeetings.length - upcoming;
    return { upcoming, past, all: myMeetings.length };
  }, [myMeetings, today]);

  const next = useMemo(
    () =>
      myMeetings
        .filter((m) => m.date >= today)
        .sort(
          (a, b) =>
            a.date.localeCompare(b.date) ||
            (a.time || "").localeCompare(b.time || "")
        )[0],
    [myMeetings, today]
  );

  return (
    <div className="main-wrapper sched-page">
      <main className="main-content">
        <button className="back-btn" onClick={() => navigate("/student")}>
          <ArrowLeft size={20} />
          <span>กลับ</span>
        </button>

        <h1 className="page-title">My Schedule</h1>
        <p className="page-date">
          ตารางนัดทั้งหมดของ {studentId} · เห็นเฉพาะนัดที่อาจารย์เลือกคุณ + นัดทั้งห้อง
        </p>

        {next && (
          <div className="sched-next-card fade-in">
            <div className="sched-next-eyebrow">นัดถัดไป</div>
            <h3 className="sched-next-title">{next.title}</h3>
            <ul className="sched-next-meta">
              <li>
                <CalendarDays size={15} />
                <span>{fmtDateFull(next.date)}</span>
              </li>
              {next.time && (
                <li>
                  <Clock size={15} />
                  <span>{next.time}</span>
                </li>
              )}
              {next.location && (
                <li>
                  <MapPin size={15} />
                  <span>{next.location}</span>
                </li>
              )}
              <li>
                {next.attendeeMode === "all" ? (
                  <><Users size={15} /><span>นัดทั้งห้อง</span></>
                ) : (
                  <><User size={15} /><span>นัด 1:1</span></>
                )}
              </li>
            </ul>
            <span className={`sched-next-badge tone-${diffLabel(dayDiff(next.date)).tone}`}>
              {diffLabel(dayDiff(next.date)).label}
            </span>
          </div>
        )}

        <div className="sched-toolbar fade-in-delay-1">
          <div className="t-pill-row">
            <button
              type="button"
              className={`t-tab ${tab === "upcoming" ? "on" : ""}`}
              onClick={() => setTab("upcoming")}
            >
              ที่กำลังจะมาถึง · {counts.upcoming}
            </button>
            <button
              type="button"
              className={`t-tab ${tab === "past" ? "on" : ""}`}
              onClick={() => setTab("past")}
            >
              ที่ผ่านมา · {counts.past}
            </button>
            <button
              type="button"
              className={`t-tab ${tab === "all" ? "on" : ""}`}
              onClick={() => setTab("all")}
            >
              ทั้งหมด · {counts.all}
            </button>
          </div>
          <div className="sched-search">
            <Search size={14} />
            <input
              type="text"
              placeholder="ค้นหาหัวข้อ / สถานที่"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                aria-label="ล้างคำค้น"
                onClick={() => setSearch("")}
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {grouped.length === 0 ? (
          <div className="sched-empty fade-in-delay-2">
            <CalendarDays size={48} strokeWidth={1.2} />
            <p>
              {search
                ? "ไม่พบนัดที่ตรงกับคำค้น"
                : tab === "upcoming"
                ? "ไม่มีนัดที่กำลังจะมาถึง"
                : tab === "past"
                ? "ยังไม่มีประวัตินัดที่ผ่านมา"
                : "ยังไม่มีนัดในระบบ"}
            </p>
          </div>
        ) : (
          <div className="sched-list fade-in-delay-2">
            {grouped.map(([date, items]) => {
              const diff = dayDiff(date);
              const dl = diffLabel(diff);
              const d = new Date(`${date}T00:00:00`);
              return (
                <section key={date} className="sched-day">
                  <header className="sched-day-head">
                    <div className="sched-day-date">
                      <span className="sched-day-num">{d.getDate()}</span>
                      <span className="sched-day-mon">
                        {TH_MONTHS_SHORT[d.getMonth()]}
                      </span>
                      <span className="sched-day-wd">
                        {TH_WEEKDAYS[d.getDay()]}.
                      </span>
                    </div>
                    <div>
                      <h3 className="sched-day-title">{fmtDateFull(date)}</h3>
                      <span className={`sched-day-badge tone-${dl.tone}`}>
                        {dl.label}
                      </span>
                    </div>
                  </header>

                  <ul className="sched-day-items">
                    {items.map((m) => (
                      <li key={m.id} className="sched-item">
                        <div className="sched-item-bar" />
                        <div className="sched-item-body">
                          <div className="sched-item-head">
                            <h4 className="sched-item-title">{m.title}</h4>
                            <span
                              className={`sched-item-tag tone-${
                                m.attendeeMode === "all" ? "all" : "private"
                              }`}
                            >
                              {m.attendeeMode === "all" ? "ทั้งห้อง" : "1:1"}
                            </span>
                          </div>
                          <ul className="sched-item-meta">
                            {m.time && (
                              <li>
                                <Clock size={13} />
                                <span>{m.time}</span>
                              </li>
                            )}
                            {m.location && (
                              <li>
                                <MapPin size={13} />
                                <span>{m.location}</span>
                              </li>
                            )}
                          </ul>
                          {m.description && (
                            <p className="sched-item-desc">{m.description}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
