import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, X, Calendar, Clock, MapPin, Users } from "lucide-react";
import { useApp } from "@/app/providers/AppContext";
import AnnouncementCard, { ANNOUNCEMENT_CATEGORIES } from "./components/AnnouncementCard";

const FILTERS = ["ทั้งหมด", ...ANNOUNCEMENT_CATEGORIES];

const TH_MONTHS_FULL = [
  "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
  "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม",
];

function fmtFull(iso) {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${TH_MONTHS_FULL[d.getMonth()]} ${d.getFullYear() + 543}`;
}

export default function StudentAnnouncementsPage() {
  const { data, markAnnouncementRead } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("ทั้งหมด");
  const [opened, setOpened] = useState(null);

  const filtered = useMemo(() => {
    if (filter === "ทั้งหมด") return data.announcements;
    return data.announcements.filter((a) => a.category === filter);
  }, [data.announcements, filter]);

  useEffect(() => {
    if (opened && !opened.read) markAnnouncementRead(opened.id);
  }, [opened, markAnnouncementRead]);

  return (
    <div className="main-wrapper ann-page">
      <main className="main-content">
        <button className="back-btn" onClick={() => navigate("/student")}>
          <ArrowLeft size={20} />
          <span>กลับ</span>
        </button>

        <h1 className="page-title">Announcements</h1>
        <p className="page-date">ประกาศจากอาจารย์ทั้งหมด · 955110</p>

        <div className="ann-filter-bar">
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

        {filtered.length === 0 ? (
          <div className="ann-empty">ยังไม่มีประกาศในหมวดนี้</div>
        ) : (
          <div className="ann-grid">
            {filtered.map((a) => (
              <AnnouncementCard
                key={a.id}
                announcement={a}
                onOpen={(x) => setOpened(x)}
              />
            ))}
          </div>
        )}

        {opened && (
          <div
            className="t-modal-backdrop"
            role="dialog"
            aria-modal="true"
            onClick={() => setOpened(null)}
          >
            <div className="t-modal ann-detail" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="ann-detail-close"
                aria-label="ปิด"
                onClick={() => setOpened(null)}
              >
                <X size={18} />
              </button>
              <span className="ann-eyebrow">{opened.category || "ประกาศ"}</span>
              <h3 className="ann-detail-title">{opened.title}</h3>
              {opened.description && (
                <p className="ann-detail-desc">{opened.description}</p>
              )}
              <ul className="ann-meta ann-detail-meta">
                {(opened.dateStart || opened.dateEnd) && (
                  <li>
                    <Calendar size={16} />
                    <span>
                      {fmtFull(opened.dateStart)}
                      {opened.dateEnd && opened.dateEnd !== opened.dateStart
                        ? ` - ${fmtFull(opened.dateEnd)}`
                        : ""}
                    </span>
                  </li>
                )}
                {opened.time && (
                  <li><Clock size={16} /><span>{opened.time}</span></li>
                )}
                {opened.location && (
                  <li><MapPin size={16} /><span>{opened.location}</span></li>
                )}
                {opened.attendees && (
                  <li><Users size={16} /><span>{opened.attendees}</span></li>
                )}
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
