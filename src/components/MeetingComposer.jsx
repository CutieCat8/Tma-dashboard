import React, { useState, useMemo } from "react";
import {
  Send, RotateCcw, Save, X, Search, Users, User, Check,
} from "lucide-react";

export const EMPTY_MEETING = {
  title: "",
  description: "",
  date: "",
  time: "",
  location: "",
  attendeeMode: "all",
  studentIds: [],
};

export default function MeetingComposer({
  form,
  onChange,
  onSubmit,
  onReset,
  students = [],
  error,
  flash,
  isEditing = false,
  onCancelEdit,
}) {
  const [search, setSearch] = useState("");

  const update = (field, value) => onChange({ ...form, [field]: value });

  const submit = (e) => {
    e.preventDefault();
    onSubmit && onSubmit();
  };

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.id.includes(q) ||
        String(s.seat).includes(q)
    );
  }, [students, search]);

  const toggleStudent = (sid) => {
    const already = form.studentIds.includes(sid);
    const next = already
      ? form.studentIds.filter((x) => x !== sid)
      : [...form.studentIds, sid];
    update("studentIds", next);
  };

  return (
    <section className={`t-card meet-composer ${isEditing ? "is-editing" : ""}`}>
      <header className="ann-composer-head">
        <h3 className="t-card-title">
          {isEditing ? "แก้ไขนัดหมาย" : "นัดประชุมใหม่"}
        </h3>
        <p className="t-card-sub">
          {isEditing
            ? "กำลังแก้ไขนัดที่สร้างไว้แล้ว · กดบันทึกเพื่ออัพเดต"
            : <>เลือก <strong>วันและเวลา</strong> + ผู้เข้าร่วม นัด 1:1 หรือทั้งห้องก็ได้</>}
        </p>
      </header>

      {isEditing && (
        <div className="composer-edit-banner">
          <span>โหมดแก้ไข — นักเรียนที่ถูกนัดจะเห็นค่าที่อัพเดตทันที</span>
          {onCancelEdit && (
            <button type="button" onClick={onCancelEdit}>
              <X size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />
              ยกเลิกการแก้ไข
            </button>
          )}
        </div>
      )}

      <form className="ann-form" onSubmit={submit}>
        <div className="ann-form-row">
          <label htmlFor="meet-title" className="ann-label">
            หัวข้อนัดหมาย <span className="ann-required">*</span>
          </label>
          <input
            id="meet-title"
            type="text"
            className="t-input"
            placeholder="เช่น นัดตรวจ Assignment 3"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            maxLength={120}
            autoComplete="off"
          />
        </div>

        <div className="ann-form-grid">
          <div className="ann-form-row">
            <label htmlFor="meet-date" className="ann-label">
              วันที่ <span className="ann-required">*</span>
            </label>
            <input
              id="meet-date"
              type="date"
              className="t-input"
              value={form.date}
              onChange={(e) => update("date", e.target.value)}
            />
          </div>
          <div className="ann-form-row">
            <label htmlFor="meet-time" className="ann-label">เวลา</label>
            <input
              id="meet-time"
              type="text"
              className="t-input"
              placeholder="เช่น 13:00 - 14:00 น."
              value={form.time}
              onChange={(e) => update("time", e.target.value)}
            />
          </div>
        </div>

        <div className="ann-form-row">
          <label htmlFor="meet-loc" className="ann-label">สถานที่</label>
          <input
            id="meet-loc"
            type="text"
            className="t-input"
            placeholder="เช่น ห้อง 6301 ตึก CBB"
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
          />
        </div>

        <div className="ann-form-row">
          <label htmlFor="meet-desc" className="ann-label">รายละเอียดเพิ่มเติม</label>
          <textarea
            id="meet-desc"
            className="t-input ann-textarea"
            placeholder="โน้ต / หัวข้อที่จะคุย / สิ่งที่ต้องเตรียม"
            rows={3}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </div>

        <div className="ann-form-row">
          <label className="ann-label">ผู้เข้าร่วม</label>
          <div className="meet-mode-row">
            <button
              type="button"
              className={`meet-mode-btn ${form.attendeeMode === "all" ? "on" : ""}`}
              onClick={() => update("attendeeMode", "all")}
            >
              <Users size={16} />
              <span>ทั้งห้อง 40 คน</span>
            </button>
            <button
              type="button"
              className={`meet-mode-btn ${form.attendeeMode === "students" ? "on" : ""}`}
              onClick={() => update("attendeeMode", "students")}
            >
              <User size={16} />
              <span>เฉพาะนักเรียนที่เลือก</span>
            </button>
          </div>
        </div>

        {form.attendeeMode === "students" && (
          <div className="ann-form-row">
            <div className="meet-picker-head">
              <span className="ann-label">เลือกนักเรียน ({form.studentIds.length})</span>
              <div className="meet-search">
                <Search size={14} />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ / รหัส / ที่นั่ง"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="meet-picker">
              {filteredStudents.length === 0 ? (
                <div className="meet-picker-empty">ไม่พบนักเรียน</div>
              ) : (
                filteredStudents.map((s) => {
                  const checked = form.studentIds.includes(s.id);
                  return (
                    <label
                      key={s.id}
                      className={`meet-picker-row ${checked ? "on" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleStudent(s.id)}
                      />
                      <span className="meet-picker-check">
                        {checked && <Check size={12} strokeWidth={3} />}
                      </span>
                      <span className="meet-picker-seat">
                        {String(s.seat).padStart(2, "0")}
                      </span>
                      <span className="meet-picker-name">{s.name}</span>
                      <span className="meet-picker-id">{s.id}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        )}

        {error && <div className="ann-error">{error}</div>}
        {flash && <div className="ann-flash">{flash}</div>}

        <div className="ann-form-actions">
          <button type="button" className="t-btn-ghost" onClick={onReset}>
            <RotateCcw size={15} />
            <span>{isEditing ? "รีเซ็ตค่า" : "ล้างฟอร์ม"}</span>
          </button>
          <button type="submit" className="t-btn-primary ann-submit-btn">
            {isEditing ? <Save size={15} /> : <Send size={15} />}
            <span>{isEditing ? "บันทึกการแก้ไข" : "สร้างนัด"}</span>
          </button>
        </div>
      </form>
    </section>
  );
}
