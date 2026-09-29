import React from "react";
import {
  Send, RotateCcw, Save, X,
  Megaphone, FileText, Video, Sparkles, Info,
} from "lucide-react";
import { ANNOUNCEMENT_CATEGORIES } from "./AnnouncementCard";

export const EMPTY_ANNOUNCEMENT = {
  title: "",
  description: "",
  category: "ประกาศ",
  dateStart: "",
  dateEnd: "",
  time: "",
  location: "",
  attendees: "",
};

const CAT_ICON = {
  ประกาศ:   Megaphone,
  ส่งงาน:   FileText,
  ประชุม:   Video,
  กิจกรรม:  Sparkles,
  อื่นๆ:    Info,
};

const CAT_TONE = {
  ประกาศ: "blue",
  ส่งงาน: "orange",
  ประชุม: "purple",
  กิจกรรม: "green",
  อื่นๆ: "slate",
};

export default function BroadcastComposer({
  form,
  onChange,
  onSubmit,
  onReset,
  error,
  flash,
  isEditing = false,
  onCancelEdit,
}) {
  const update = (field, value) => onChange({ ...form, [field]: value });

  const submit = (e) => {
    e.preventDefault();
    onSubmit && onSubmit();
  };

  return (
    <section className={`t-card ann-composer ${isEditing ? "is-editing" : ""}`}>
      <header className="ann-composer-head">
        <h3 className="t-card-title">
          {isEditing ? "แก้ไขประกาศ" : "สร้างประกาศใหม่"}
        </h3>
        <p className="t-card-sub">
          {isEditing
            ? "กำลังแก้ไขประกาศที่โพสต์ไปแล้ว · กดบันทึกเพื่ออัพเดต"
            : <>กรอกอย่างน้อย <strong>หัวข้อ</strong> — ช่องอื่นจะใส่หรือไม่ใส่ก็ได้</>}
        </p>
      </header>

      {isEditing && (
        <div className="composer-edit-banner">
          <span>โหมดแก้ไข — การเปลี่ยนแปลงจะแทนที่ประกาศเดิม</span>
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
          <label className="ann-label">หมวดหมู่ประกาศ</label>
          <div className="ann-cat-pills">
            {ANNOUNCEMENT_CATEGORIES.map((c) => {
              const Icon = CAT_ICON[c] || Info;
              const tone = CAT_TONE[c] || "slate";
              const active = form.category === c;
              return (
                <button
                  key={c}
                  type="button"
                  className={`ann-cat-pill ann-tone-${tone} ${active ? "on" : ""}`}
                  onClick={() => update("category", c)}
                  aria-pressed={active}
                >
                  <span className="ann-cat-pill-icon">
                    <Icon size={20} strokeWidth={1.8} />
                  </span>
                  <span className="ann-cat-pill-label">{c}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="ann-form-row">
          <label htmlFor="ann-title" className="ann-label">
            หัวข้อประกาศ <span className="ann-required">*</span>
          </label>
          <input
            id="ann-title"
            type="text"
            className="t-input"
            placeholder="เช่น แจ้งเลื่อนกำหนดส่ง Assignment 3"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            maxLength={120}
            autoComplete="off"
          />
        </div>

        <div className="ann-form-row">
          <label htmlFor="ann-desc" className="ann-label">รายละเอียดสั้นๆ</label>
          <textarea
            id="ann-desc"
            className="t-input ann-textarea"
            placeholder="คำอธิบายเพิ่มเติม"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={3}
            maxLength={400}
          />
        </div>

        <div className="ann-form-grid">
          <div className="ann-form-row">
            <label htmlFor="ann-start" className="ann-label">วันที่เริ่ม</label>
            <input
              id="ann-start"
              type="date"
              className="t-input"
              value={form.dateStart}
              onChange={(e) => update("dateStart", e.target.value)}
            />
          </div>
          <div className="ann-form-row">
            <label htmlFor="ann-end" className="ann-label">วันที่สิ้นสุด</label>
            <input
              id="ann-end"
              type="date"
              className="t-input"
              value={form.dateEnd}
              onChange={(e) => update("dateEnd", e.target.value)}
            />
          </div>
        </div>

        <div className="ann-form-row">
          <label htmlFor="ann-time" className="ann-label">เวลา</label>
          <input
            id="ann-time"
            type="text"
            className="t-input"
            placeholder="เช่น 09:00 - 12:00 น."
            value={form.time}
            onChange={(e) => update("time", e.target.value)}
          />
        </div>

        <div className="ann-form-row">
          <label htmlFor="ann-loc" className="ann-label">สถานที่</label>
          <input
            id="ann-loc"
            type="text"
            className="t-input"
            placeholder="เช่น ห้อง 6301 ตึก CBB"
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
          />
        </div>

        <div className="ann-form-row">
          <label htmlFor="ann-att" className="ann-label">จำนวนคน / ผู้เข้าร่วม</label>
          <input
            id="ann-att"
            type="text"
            className="t-input"
            placeholder="เช่น ทั้งห้อง 40 คน หรือ กลุ่ม A"
            value={form.attendees}
            onChange={(e) => update("attendees", e.target.value)}
          />
        </div>

        {error && <div className="ann-error">{error}</div>}
        {flash && <div className="ann-flash">{flash}</div>}

        <div className="ann-form-actions">
          <button type="button" className="t-btn-ghost" onClick={onReset}>
            <RotateCcw size={15} />
            <span>{isEditing ? "รีเซ็ตค่า" : "ล้างฟอร์ม"}</span>
          </button>
          <button type="submit" className="t-btn-primary ann-submit-btn">
            {isEditing ? <Save size={15} /> : <Send size={15} />}
            <span>{isEditing ? "บันทึกการแก้ไข" : "ประกาศ"}</span>
          </button>
        </div>
      </form>
    </section>
  );
}
