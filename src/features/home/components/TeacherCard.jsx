import React from "react";
import { useApp } from "@/app/providers/AppContext";
import { Phone, Mail, MessageSquare, Tv } from "lucide-react";
import teacherImg from "@/assets/images/teacher-profile.png";

export default function TeacherCard() {
  const { data } = useApp();
  const { teacher } = data;

  return (
    <div className="profile-card fade-in-delay-2">
      <div className="profile-avatar">
        <img src={teacherImg} alt={teacher.name} />
      </div>
      <div className="profile-name">{teacher.name}</div>
      <div className="profile-role">{teacher.role}</div>

      <div className="profile-socials">
        <button className="profile-social-btn" aria-label="Phone"><Phone size={16} /></button>
        <button className="profile-social-btn" aria-label="Email"><Mail size={16} /></button>
        <button className="profile-social-btn" aria-label="Chat"><MessageSquare size={16} /></button>
        <button className="profile-social-btn" aria-label="Screen"><Tv size={16} /></button>
      </div>

      <button className="connect-btn">Message</button>
    </div>
  );
}
