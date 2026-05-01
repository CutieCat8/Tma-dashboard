import React from "react";
import { useApp } from "../AppContext";
import { CalendarDays, Clock, MapPin, Users, ExternalLink, CalendarX } from "lucide-react";

export default function MeetingCard() {
  const { data, selectedDate } = useApp();

  const meeting = selectedDate ? data.meetings[selectedDate] : null;
  const today = new Date();
  const displayDate = selectedDate
    ? new Date(selectedDate).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })
    : today.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });

  if (!selectedDate || !meeting) {
    return (
      <div className="meeting-card fade-in-delay-2 empty-meeting">
        <div className="meeting-card-header">
          <span className="meeting-badge empty">
            {selectedDate ? displayDate : "วันนี้"}
          </span>
        </div>
        <div className="empty-meeting-body">
          <CalendarX size={48} strokeWidth={1.2} />
          <p className="empty-meeting-text">
            ไม่มีการนัดหมายหรืองานในวันนี้
          </p>
          <p className="empty-meeting-sub">
            กดที่วันในปฏิทินเพื่อดูรายละเอียดการนัดหมาย
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="meeting-card fade-in-delay-2">
      <div className="meeting-card-header">
        <span className="meeting-badge">Up Coming</span>
        <span className="meeting-type">Meeting</span>
      </div>

      <div className="meeting-illustration">
        <svg viewBox="0 0 120 70" fill="none">
          <circle cx="40" cy="22" r="10" fill="#374151" />
          <rect x="28" y="42" width="24" height="28" rx="12" fill="#374151" opacity="0.15" />
          <circle cx="60" cy="18" r="12" fill="#1f2937" />
          <rect x="44" y="36" width="32" height="34" rx="16" fill="#1f2937" opacity="0.2" />
          <circle cx="80" cy="22" r="10" fill="#374151" />
          <rect x="68" y="42" width="24" height="28" rx="12" fill="#374151" opacity="0.15" />
        </svg>
      </div>

      <h3 className="meeting-title">{meeting.title}</h3>

      <div className="meeting-detail">
        <CalendarDays size={16} />
        <span>{meeting.date}</span>
      </div>
      <div className="meeting-detail">
        <Clock size={16} />
        <span>{meeting.time}</span>
      </div>
      <div className="meeting-detail">
        <MapPin size={16} />
        <span>{meeting.location}</span>
      </div>
      <div className="meeting-detail">
        <Users size={16} />
        <span>{meeting.attendees}</span>
      </div>

      <button className="see-more-btn">
        <ExternalLink size={18} />
        See More Details
      </button>
    </div>
  );
}
