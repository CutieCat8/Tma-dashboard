import React, { useState, useMemo } from "react";
import {
  ChevronLeft, ChevronRight, MapPin, Clock, Users, User,
  Trash2, CalendarPlus, Pencil,
} from "lucide-react";
import { useApp } from "../AppContext";
import { useTeacher } from "../context/TeacherContext";
import MeetingComposer, { EMPTY_MEETING } from "../components/MeetingComposer";
import { parseLegacyMeetingTime } from "../lib/schedule/meeting-time";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS_EN = [
  "JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE",
  "JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER",
];
const MONTHS_TH_FULL = [
  "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
  "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม",
];

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtDateTH(iso) {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${MONTHS_TH_FULL[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function generateDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const days = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ day: daysInPrev - i, otherMonth: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ day: d, otherMonth: false });
  }
  while (days.length % 7 !== 0) {
    days.push({ day: days.length - firstDay - daysInMonth + 1, otherMonth: true });
  }
  return days;
}

export default function TeacherSchedulePage() {
  const { data, addMeeting, removeMeeting, updateMeeting, getClassAvailability, getCourseById, setCourseVerification } = useApp();
  const { students, teacher } = useTeacher();

  const tStr = todayISO();
  const tNow = new Date();
  const [calMonth, setCalMonth] = useState({ year: tNow.getFullYear(), month: tNow.getMonth() });
  const [picked, setPicked] = useState(tStr);
  const [form, setForm] = useState({ ...EMPTY_MEETING, date: tStr });
  const [editingId, setEditingId] = useState(null);
  const [originalForm, setOriginalForm] = useState(null);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [availabilityDetail, setAvailabilityDetail] = useState(null);

  const days = generateDays(calMonth.year, calMonth.month);

  const meetingsByDate = useMemo(() => {
    const map = {};
    for (const m of data.meetings) {
      if (!map[m.date]) map[m.date] = [];
      map[m.date].push(m);
    }
    return map;
  }, [data.meetings]);

  const meetingsOnPicked = picked ? meetingsByDate[picked] || [] : [];

  const attendeeIds = useMemo(
    () => form.attendeeMode === "all" ? students.map((student) => student.id) : form.studentIds,
    [form.attendeeMode, form.studentIds, students]
  );
  const availability = useMemo(
    () => getClassAvailability(attendeeIds, form.date, form.startTime, form.endTime, { excludeMeetingId: editingId || undefined }),
    [attendeeIds, editingId, form.date, form.endTime, form.startTime, getClassAvailability]
  );

  const upcoming = useMemo(() => {
    return [...data.meetings]
      .filter((m) => m.date >= tStr)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || ""));
  }, [data.meetings, tStr]);

  const onChangeForm = (next) => {
    setForm(next);
    if (error) setError("");
  };

  const resetForm = () => {
    if (editingId && originalForm) {
      setForm(originalForm);
    } else {
      setForm({ ...EMPTY_MEETING, date: picked || tStr });
    }
    setError("");
    setFlash("");
  };

  const onCancelEdit = () => {
    setEditingId(null);
    setOriginalForm(null);
    setForm({ ...EMPTY_MEETING, date: picked || tStr });
    setError("");
    setFlash("");
  };

  const onEditMeeting = (m) => {
    const resolvedTime = m.startTime && m.endTime
      ? { startTime: m.startTime, endTime: m.endTime }
      : parseLegacyMeetingTime(m.time || "") || { startTime: "", endTime: "" };
    const next = {
      title: m.title || "",
      description: m.description || "",
      date: m.date || "",
      time: m.time || "",
      ...resolvedTime,
      location: m.location || "",
      attendeeMode: m.attendeeMode === "students" ? "students" : "all",
      studentIds: Array.isArray(m.studentIds) ? [...m.studentIds] : [],
    };
    setForm(next);
    setOriginalForm(next);
    setEditingId(m.id);
    setError("");
    setFlash("");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    const el = document.getElementById("meet-title");
    if (el) el.focus();
  };

  const onSubmit = () => {
    if (!form.title.trim()) return setError("กรุณาใส่หัวข้อนัดหมาย");
    if (!form.date) return setError("กรุณาเลือกวันที่");
    if (!form.startTime || !form.endTime || form.endTime <= form.startTime) {
      return setError("กรุณาระบุเวลาเริ่มและเวลาสิ้นสุดให้ถูกต้อง");
    }
    if (form.attendeeMode === "students" && form.studentIds.length === 0) {
      return setError("กรุณาเลือกนักเรียนอย่างน้อย 1 คน หรือเปลี่ยนเป็นทั้งห้อง");
    }
    const currentAvailability = getClassAvailability(attendeeIds, form.date, form.startTime, form.endTime, { excludeMeetingId: editingId || undefined });
    const busyCount = currentAvailability.filter((item) => item.status === "busy").length;
    let overrideReason = "";
    if (busyCount > 0) {
      overrideReason = window.prompt(`มีนักเรียน ${busyCount} คนไม่ว่าง หากต้องการนัดทับ กรุณาระบุเหตุผล`) || "";
      if (!overrideReason.trim()) return setError("ยกเลิกการสร้างนัด: ต้องระบุเหตุผลเมื่อนัดทับเวลาที่ไม่ว่าง");
    }
    const payload = { ...form, attendeeStudentIds: attendeeIds, overrideReason };
    if (editingId) {
      updateMeeting(editingId, payload);
      setPicked(form.date);
      setEditingId(null);
      setOriginalForm(null);
      setForm({ ...EMPTY_MEETING, date: form.date });
      setFlash("บันทึกการแก้ไขนัดหมายเรียบร้อย");
    } else {
      addMeeting(payload);
      setPicked(form.date);
      setForm({ ...EMPTY_MEETING, date: form.date });
      setFlash("สร้างนัดหมายเรียบร้อย");
    }
    setTimeout(() => setFlash(""), 3500);
  };

  const onPickDay = (cell) => {
    if (cell.otherMonth) return;
    const iso = `${calMonth.year}-${String(calMonth.month + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`;
    setPicked(iso);
    setForm((f) => ({ ...f, date: iso }));
  };

  const prevMonth = () =>
    setCalMonth((p) => (p.month === 0 ? { year: p.year - 1, month: 11 } : { ...p, month: p.month - 1 }));
  const nextMonth = () =>
    setCalMonth((p) => (p.month === 11 ? { year: p.year + 1, month: 0 } : { ...p, month: p.month + 1 }));

  const studentNameById = (id) => {
    const s = students.find((x) => x.id === id);
    return s ? s.name : id;
  };

  return (
    <div className="t-page-wrap">
      <main className="t-page">
        <header className="t-page-head fade-in">
          <h1 className="t-page-title">ตารางนัดหมาย 1:1 และทั้งห้อง</h1>
          <p className="t-page-meta">
            จัดนัดให้นักเรียนเฉพาะคนหรือทั้งห้อง · นักเรียนแต่ละคนเห็นเฉพาะนัดที่เกี่ยวกับตัวเอง
          </p>
        </header>

        <div className="meet-grid fade-in-delay-1">
          {/* ===== Left: month calendar + composer ===== */}
          <div className="meet-left">
            <section className="t-card meet-cal-card">
              <header className="meet-cal-head">
                <div>
                  <h3 className="t-card-title">
                    {MONTHS_EN[calMonth.month]} {calMonth.year}
                  </h3>
                  <p className="t-card-sub">คลิกที่วันเพื่อสร้างหรือดูนัด</p>
                </div>
                <div className="meet-cal-nav">
                  <button type="button" onClick={prevMonth} aria-label="เดือนก่อน">
                    <ChevronLeft size={16} />
                  </button>
                  <button type="button" onClick={nextMonth} aria-label="เดือนถัดไป">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </header>

              <div className="meet-cal-wd">
                {WEEKDAYS.map((w) => (
                  <div key={w}>{w}</div>
                ))}
              </div>
              <div className="meet-cal-grid">
                {days.map((cell, i) => {
                  const iso = cell.otherMonth
                    ? null
                    : `${calMonth.year}-${String(calMonth.month + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`;
                  const list = (iso && meetingsByDate[iso]) || [];
                  const isToday = iso === tStr;
                  const isPicked = iso === picked;
                  return (
                    <button
                      key={i}
                      type="button"
                      className={`meet-cal-d
                        ${cell.otherMonth ? "dim" : ""}
                        ${isToday ? "today" : ""}
                        ${isPicked ? "on" : ""}
                        ${list.length > 0 ? "has" : ""}`}
                      onClick={() => onPickDay(cell)}
                    >
                      <span className="meet-cal-d-num">{cell.day}</span>
                      {list.length > 0 && (
                        <span className="meet-cal-d-dot" aria-label={`${list.length} นัด`}>
                          {list.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            <MeetingComposer
              form={form}
              onChange={onChangeForm}
              onSubmit={onSubmit}
              onReset={resetForm}
              students={students}
              error={error}
              flash={flash}
              isEditing={!!editingId}
              onCancelEdit={onCancelEdit}
              availability={availability}
              onAvailabilityClick={setAvailabilityDetail}
            />
          </div>

          {/* ===== Right: selected day + upcoming ===== */}
          <div className="meet-right">
            <section className="t-card">
              <header className="t-card-head">
                <div>
                  <h3 className="t-card-title">
                    {picked ? fmtDateTH(picked) : "เลือกวัน"}
                  </h3>
                  <p className="t-card-sub">
                    {meetingsOnPicked.length === 0
                      ? "ยังไม่มีนัดหมายในวันนี้"
                      : `${meetingsOnPicked.length} นัดหมาย`}
                  </p>
                </div>
                {picked && (
                  <button
                    type="button"
                    className="t-btn-ghost meet-quick-add"
                    onClick={() => {
                      setForm((f) => ({ ...f, date: picked }));
                      const el = document.getElementById("meet-title");
                      if (el) el.focus();
                    }}
                  >
                    <CalendarPlus size={14} />
                    <span>เพิ่มนัด</span>
                  </button>
                )}
              </header>

              {meetingsOnPicked.length === 0 ? (
                <div className="meet-empty">
                  ใช้ฟอร์มทางซ้ายเพื่อสร้างนัดในวันนี้
                </div>
              ) : (
                <ul className="meet-list">
                  {meetingsOnPicked.map((m) => (
                    <li key={m.id} className="meet-item">
                      <div className="meet-item-head">
                        <h4 className="meet-item-title">{m.title}</h4>
                        <div style={{ display: "inline-flex", gap: 4 }}>
                          <button
                            type="button"
                            className="meet-item-edit"
                            aria-label="แก้ไขนัด"
                            onClick={() => onEditMeeting(m)}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            className="meet-item-del"
                            aria-label="ลบนัด"
                            onClick={() => setConfirmDelete(m)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <ul className="meet-item-meta">
                        {m.time && (
                          <li><Clock size={14} /><span>{m.time}</span></li>
                        )}
                        {m.location && (
                          <li><MapPin size={14} /><span>{m.location}</span></li>
                        )}
                        <li>
                          {m.attendeeMode === "all" ? (
                            <><Users size={14} /><span>ทั้งห้อง 40 คน</span></>
                          ) : (
                            <><User size={14} /><span>{m.studentIds.length} คน</span></>
                          )}
                        </li>
                      </ul>
                      {m.description && <p className="meet-item-desc">{m.description}</p>}
                      {m.attendeeMode === "students" && m.studentIds.length > 0 && (
                        <div className="meet-item-chips">
                          {m.studentIds.map((sid) => (
                            <span key={sid} className="meet-chip">
                              {studentNameById(sid)}
                            </span>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="t-card">
              <header className="t-card-head">
                <div>
                  <h3 className="t-card-title">นัดที่กำลังจะมาถึง</h3>
                  <p className="t-card-sub">{upcoming.length} รายการ ตั้งแต่วันนี้ไปข้างหน้า</p>
                </div>
              </header>

              {upcoming.length === 0 ? (
                <div className="meet-empty">ไม่มีนัดในอนาคต</div>
              ) : (
                <ul className="meet-upcoming">
                  {upcoming.slice(0, 8).map((m) => (
                    <li
                      key={m.id}
                      className={`meet-up-row ${m.date === picked ? "on" : ""}`}
                      onClick={() => setPicked(m.date)}
                    >
                      <div className="meet-up-date">
                        <span className="meet-up-d">
                          {new Date(`${m.date}T00:00:00`).getDate()}
                        </span>
                        <span className="meet-up-m">
                          {MONTHS_TH_FULL[new Date(`${m.date}T00:00:00`).getMonth()].slice(0, 3)}
                        </span>
                      </div>
                      <div className="meet-up-body">
                        <div className="meet-up-title">{m.title}</div>
                        <div className="meet-up-meta">
                          {m.time && <span>{m.time}</span>}
                          {m.time && <span>·</span>}
                          <span>
                            {m.attendeeMode === "all"
                              ? "ทั้งห้อง"
                              : `${m.studentIds.length} คน`}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>

        {confirmDelete && (
          <div
            className="t-modal-backdrop"
            role="dialog"
            aria-modal="true"
            onClick={() => setConfirmDelete(null)}
          >
            <div className="t-modal" onClick={(e) => e.stopPropagation()}>
              <div className="t-modal-head">
                <div>
                  <h3 className="t-card-title">ลบนัดหมายนี้?</h3>
                  <p className="t-card-sub">{confirmDelete.title}</p>
                </div>
              </div>
              <p className="ann-confirm-text">
                นักเรียนที่ถูกนัดจะไม่เห็นนัดนี้ในปฏิทินอีก
              </p>
              <div className="t-modal-actions">
                <button
                  type="button"
                  className="t-btn-ghost"
                  onClick={() => setConfirmDelete(null)}
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  className="t-btn-danger"
                  onClick={() => {
                    removeMeeting(confirmDelete.id);
                    setConfirmDelete(null);
                  }}
                >
                  ลบนัด
                </button>
              </div>
            </div>
          </div>
        )}

        {availabilityDetail && (
          <div className="t-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setAvailabilityDetail(null)}>
            <section className="t-modal availability-detail-modal" role="dialog" aria-modal="true" aria-labelledby="availability-detail-title">
              <div className="t-modal-head">
                <div>
                  <h3 id="availability-detail-title" className="t-card-title">{studentNameById(availabilityDetail.studentId)}</h3>
                  <p className="t-card-sub">{availabilityDetail.status === "busy" ? "ไม่ว่างในช่วงเวลานี้" : "ว่างในช่วงเวลานี้"}</p>
                </div>
                <button type="button" className="t-btn-ghost" onClick={() => setAvailabilityDetail(null)}>ปิด</button>
              </div>
              <div className="availability-conflict-list">
                {availabilityDetail.conflicts.length === 0 ? <p className="meet-empty">ไม่พบรายการที่ชนกัน</p> : availabilityDetail.conflicts.map((conflict, index) => {
                  const course = conflict.type === "course" ? getCourseById(conflict.occurrence.courseId) : null;
                  return (
                    <article className="availability-conflict-card" key={`${conflict.type}-${index}`}>
                      <span>{conflict.type === "course" ? "COURSE" : "MEETING"}</span>
                      <h4>{conflict.type === "course" ? `${conflict.occurrence.courseCode} · ${conflict.occurrence.courseName}` : conflict.meeting.title}</h4>
                      <p>{conflict.startTime} - {conflict.endTime}{conflict.type === "course" && conflict.occurrence.location ? ` · ${conflict.occurrence.location}` : ""}</p>
                      {course && <>
                        <p className={`verification-status is-${course.verificationStatus}`}>{course.verificationStatus === "verified" ? "Verified" : course.verificationStatus === "needs-review" ? "Needs review" : "Self-reported"}</p>
                        {course.notes && <p>{course.notes}</p>}
                        <div className="availability-verify-actions">
                          <button type="button" onClick={() => setCourseVerification(course.id, "verified", { source: "manual-review", actorId: teacher?.name || "teacher", note: "Reviewed from meeting availability" })}>Mark verified</button>
                          <button type="button" onClick={() => setCourseVerification(course.id, "needs-review", { actorId: teacher?.name || "teacher", note: "Flagged from meeting availability" })}>Needs review</button>
                        </div>
                      </>}
                    </article>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
