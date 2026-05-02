import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Search, Users, CalendarDays, Megaphone, ClipboardList,
  CheckCircle2, XCircle, Clock, MapPin, BookOpen,
} from "lucide-react";
import { useApp } from "../AppContext";
import { useTeacher } from "../context/TeacherContext";

const TH_MONTHS_SHORT = [
  "ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.",
  "ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค.",
];
const STATUS_LABEL = {
  "on-time": "ส่งตรงเวลา",
  late: "ส่งช้า",
  missing: "ขาดส่ง",
};

function fmtShortDate(iso) {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${TH_MONTHS_SHORT[d.getMonth()]}`;
}

function initialsOf(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p.charAt(0)).join("").toUpperCase();
}

export default function TeacherRosterPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { students } = useTeacher();
  const { data, getMeetingsForStudent } = useApp();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.id.includes(q) ||
        String(s.seat).includes(q)
    );
  }, [students, search]);

  const selected = useMemo(
    () => students.find((s) => s.id === id) || null,
    [students, id]
  );

  const myMeetings = useMemo(
    () => (selected ? getMeetingsForStudent(selected.id) : []),
    [selected, getMeetingsForStudent]
  );

  const todoCount = data.todos.length;
  const todoDone = data.todos.filter((t) => t.done).length;

  return (
    <div className="t-page-wrap">
      <main className="t-page">
        <header className="t-page-head fade-in">
          <h1 className="t-page-title">รายชื่อนักเรียน · Roster</h1>
          <p className="t-page-meta">
            กดเลือกนักเรียนเพื่อดูสถานะการส่งฟอร์ม นัดหมาย และความคืบหน้าทั้งหมด
          </p>
        </header>

        <div className="roster-grid fade-in-delay-1">
          <section className="t-card roster-list-card">
            <div className="roster-search">
              <Search size={14} />
              <input
                type="text"
                placeholder="ค้นหาชื่อ / รหัส / ที่นั่ง"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {filtered.length === 0 ? (
              <div className="meet-empty">ไม่พบนักเรียน</div>
            ) : (
              <ul className="roster-list">
                {filtered.map((s) => (
                  <li
                    key={s.id}
                    className={`roster-row ${selected?.id === s.id ? "on" : ""}`}
                    onClick={() => navigate(`/teacher/roster/${s.id}`)}
                  >
                    <span className="roster-row-seat">
                      {String(s.seat).padStart(2, "0")}
                    </span>
                    <div className="roster-row-info">
                      <div className="roster-row-name">{s.name}</div>
                      <div className="roster-row-id">{s.id}</div>
                    </div>
                    <span
                      className={`roster-row-status ${s.status}`}
                      aria-label={STATUS_LABEL[s.status]}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            {!selected ? (
              <div className="t-card roster-detail-empty">
                <Users size={48} strokeWidth={1.2} />
                <p style={{ marginTop: 12 }}>
                  เลือกนักเรียนจากรายการทางซ้ายเพื่อดูรายละเอียด
                </p>
              </div>
            ) : (
              <RosterDetail
                student={selected}
                meetings={myMeetings}
                announcements={data.announcements}
                todoCount={todoCount}
                todoDone={todoDone}
              />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function RosterDetail({ student, meetings, announcements, todoCount, todoDone }) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const upcomingMeetings = meetings
    .filter((m) => m.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));
  const pastMeetings = meetings
    .filter((m) => m.date < todayStr)
    .sort((a, b) => b.date.localeCompare(a.date));

  const submissionScore = [student.meditation, student.journal, student.assignment].filter(
    Boolean
  ).length;
  const submissionPct = Math.round((submissionScore / 3) * 100);

  const recentAnnouncements = [...announcements]
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    .slice(0, 5);

  return (
    <>
      <div className="roster-hero">
        <div className="roster-hero-avatar">{initialsOf(student.name)}</div>
        <div>
          <h2 className="roster-hero-name">{student.name}</h2>
          <p className="roster-hero-id">
            รหัส {student.id} · ที่นั่ง {String(student.seat).padStart(2, "0")}
          </p>
        </div>
        <span className={`roster-hero-status ${student.status}`}>
          {STATUS_LABEL[student.status]}
        </span>
      </div>

      <div className="roster-stat-row">
        <div className="roster-stat">
          <div className="roster-stat-label">การส่งวันนี้</div>
          <div className="roster-stat-value">{submissionPct}%</div>
          <div className="roster-stat-sub">{submissionScore}/3 ฟอร์ม</div>
        </div>
        <div className="roster-stat">
          <div className="roster-stat-label">นัดทั้งหมด</div>
          <div className="roster-stat-value">{meetings.length}</div>
          <div className="roster-stat-sub">
            {upcomingMeetings.length} กำลังมา · {pastMeetings.length} ผ่านมา
          </div>
        </div>
        <div className="roster-stat">
          <div className="roster-stat-label">งานที่มอบหมาย</div>
          <div className="roster-stat-value">{todoDone}/{todoCount}</div>
          <div className="roster-stat-sub">งานในคลาสที่ active</div>
        </div>
      </div>

      <section className="roster-section">
        <h3>
          <ClipboardList size={15} />
          สถานะการส่งฟอร์มวันนี้
        </h3>
        <div className="roster-checks">
          <CheckRow label="Meditation Record" done={student.meditation} />
          <CheckRow label="Daily Journal" done={student.journal} />
          <CheckRow label="Assignment ล่าสุด" done={student.assignment} />
        </div>
      </section>

      <section className="roster-section">
        <h3>
          <CalendarDays size={15} />
          นัดหมายของนักเรียนคนนี้
          <span className="count">{meetings.length}</span>
        </h3>
        {meetings.length === 0 ? (
          <div className="meet-empty">ยังไม่มีนัดหมายกับนักเรียนคนนี้</div>
        ) : (
          <ul className="roster-meeting-list">
            {[...upcomingMeetings, ...pastMeetings].slice(0, 8).map((m) => (
              <li key={m.id} className="roster-meeting">
                <div>
                  <div className="roster-meeting-title">{m.title}</div>
                  <div className="roster-meeting-meta">
                    {fmtShortDate(m.date)}
                    {m.time && ` · ${m.time}`}
                    {m.location && ` · ${m.location}`}
                  </div>
                </div>
                <span
                  className={`sched-item-tag tone-${
                    m.attendeeMode === "all" ? "all" : "private"
                  }`}
                >
                  {m.attendeeMode === "all" ? "ทั้งห้อง" : "1:1"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="roster-section">
        <h3>
          <Megaphone size={15} />
          ประกาศล่าสุด
          <span className="count">{recentAnnouncements.length}</span>
        </h3>
        {recentAnnouncements.length === 0 ? (
          <div className="meet-empty">ยังไม่มีประกาศ</div>
        ) : (
          <ul className="roster-ann-list">
            {recentAnnouncements.map((a) => (
              <li key={a.id} className="roster-ann">
                <div>
                  <div className="roster-ann-title">{a.title}</div>
                  <div className="roster-ann-meta">
                    {a.category}
                    {a.dateStart && ` · ${fmtShortDate(a.dateStart)}`}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function CheckRow({ label, done }) {
  return (
    <div className={`roster-check ${done ? "done" : "miss"}`}>
      {done ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
      <span>{label}</span>
    </div>
  );
}
