import React, { useState, useMemo } from "react";
import { Eye } from "lucide-react";
import { useApp } from "../AppContext";
import BroadcastComposer, { EMPTY_ANNOUNCEMENT } from "../components/BroadcastComposer";
import AnnouncementCard, { ANNOUNCEMENT_CATEGORIES } from "../components/AnnouncementCard";

const FILTERS = ["ทั้งหมด", ...ANNOUNCEMENT_CATEGORIES];

// Filled into the preview when a field is empty so the card shape stays visible.
const PLACEHOLDER = {
  title: "หัวข้อประกาศของคุณ",
  description: "รายละเอียดสั้นๆ จะปรากฏตรงนี้ตามที่อาจารย์พิมพ์",
};

function buildPreview(form) {
  return {
    id: "preview",
    title: form.title?.trim() || PLACEHOLDER.title,
    description: form.description?.trim() || PLACEHOLDER.description,
    category: form.category || "ประกาศ",
    dateStart: form.dateStart || "",
    dateEnd: form.dateEnd || "",
    time: form.time?.trim() || "",
    location: form.location?.trim() || "",
    attendees: form.attendees?.trim() || "",
    createdAt: new Date().toISOString(),
  };
}

export default function TeacherAnnouncementsPage() {
  const { data, addAnnouncement, removeAnnouncement } = useApp();
  const [form, setForm] = useState(EMPTY_ANNOUNCEMENT);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");
  const [filter, setFilter] = useState("ทั้งหมด");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const onChangeForm = (next) => {
    setForm(next);
    if (error) setError("");
  };

  const onReset = () => {
    setForm(EMPTY_ANNOUNCEMENT);
    setError("");
    setFlash("");
  };

  const onSubmit = () => {
    if (!form.title.trim()) {
      setError("กรุณาใส่หัวข้อประกาศอย่างน้อย");
      return;
    }
    if (form.dateStart && form.dateEnd && form.dateStart > form.dateEnd) {
      setError("วันสิ้นสุดต้องไม่ก่อนวันเริ่ม");
      return;
    }
    addAnnouncement(form);
    setForm(EMPTY_ANNOUNCEMENT);
    setError("");
    setFlash("ประกาศเรียบร้อย — นักเรียนเห็นในหน้าฟีดทันที");
    setTimeout(() => setFlash(""), 3500);
  };

  const previewAnnouncement = useMemo(() => buildPreview(form), [form]);
  const isPreviewEmpty = !form.title.trim() && !form.description.trim();

  const filtered = useMemo(() => {
    if (filter === "ทั้งหมด") return data.announcements;
    return data.announcements.filter((a) => a.category === filter);
  }, [data.announcements, filter]);

  return (
    <div className="t-page-wrap">
      <main className="t-page">
        <header className="t-page-head fade-in">
          <h1 className="t-page-title">ระบบประกาศ</h1>
          <p className="t-page-meta">
            สร้างและจัดการประกาศของห้อง · ดูตัวอย่างประกาศแบบ real-time ก่อนโพสต์
          </p>
        </header>

        <div className="ann-compose-grid fade-in-delay-1">
          <BroadcastComposer
            form={form}
            onChange={onChangeForm}
            onSubmit={onSubmit}
            onReset={onReset}
            error={error}
            flash={flash}
          />

          <aside className="ann-preview-pane">
            <div className="ann-preview-sticky">
              <div className="ann-preview-head">
                <Eye size={16} />
                <span>ตัวอย่างประกาศ</span>
              </div>
              <div className={`ann-preview-card-wrap ${isPreviewEmpty ? "is-empty" : ""}`}>
                <AnnouncementCard announcement={previewAnnouncement} />
              </div>
              <p className="ann-preview-hint">
                การ์ดนี้จะอัพเดตทันทีเมื่อพี่กรอกฟอร์ม — กดปุ่ม &quot;ประกาศ&quot; เมื่อพอใจ
              </p>
            </div>
          </aside>
        </div>

        <section className="ann-list-section fade-in-delay-2">
          <header className="ann-list-head">
            <div>
              <h2 className="t-card-title">ประกาศที่โพสต์แล้ว</h2>
              <p className="t-card-sub">
                ทั้งหมด {data.announcements.length} รายการ
                {filter !== "ทั้งหมด" && ` · กรอง: ${filter}`}
              </p>
            </div>
            <div className="t-pill-row">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`t-tab ${filter === f ? "on" : ""}`}
                  onClick={() => setFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </header>

          {filtered.length === 0 ? (
            <div className="ann-empty">ยังไม่มีประกาศในหมวดนี้</div>
          ) : (
            <div className="ann-grid">
              {filtered.map((a) => (
                <AnnouncementCard
                  key={a.id}
                  announcement={a}
                  onDelete={(x) => setConfirmDelete(x)}
                />
              ))}
            </div>
          )}
        </section>

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
                  <h3 className="t-card-title">ลบประกาศนี้?</h3>
                  <p className="t-card-sub">{confirmDelete.title}</p>
                </div>
              </div>
              <p className="ann-confirm-text">
                การลบจะทำให้นักเรียนไม่เห็นประกาศนี้ในหน้าฟีดอีกต่อไป
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
                    removeAnnouncement(confirmDelete.id);
                    setConfirmDelete(null);
                  }}
                >
                  ลบประกาศ
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
