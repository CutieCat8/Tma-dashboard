import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, BookOpenCheck } from "lucide-react";
import { useApp } from "@/app/providers/AppContext";

const TEACHER_PASSCODE = "955110";

export default function LoginScreen() {
  const { setStudentId, setRole } = useApp();
  const navigate = useNavigate();

  const [mode, setMode] = useState("student");
  const [studentValue, setStudentValue] = useState("");
  const [teacherValue, setTeacherValue] = useState("");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    setError("");

    if (mode === "student") {
      const trimmed = studentValue.trim();
      if (!trimmed) return setError("กรุณาใส่รหัสนักศึกษา");
      if (!/^\d{6,12}$/.test(trimmed)) {
        return setError("รหัสนักศึกษาควรเป็นตัวเลข 6-12 หลัก");
      }
      setStudentId(trimmed);
      setRole("student");
      navigate("/student", { replace: true });
      return;
    }

    if (mode === "teacher") {
      if (teacherValue.trim() !== TEACHER_PASSCODE) {
        return setError("รหัสผ่านอาจารย์ไม่ถูกต้อง");
      }
      setStudentId("");
      setRole("teacher");
      navigate("/teacher", { replace: true });
    }
  };

  const onChangeMode = (next) => {
    setMode(next);
    setError("");
  };

  return (
    <div className="login-screen">
      <form className="login-card login-card-wide" onSubmit={submit}>
        <div className="login-logo">
          <svg viewBox="0 0 36 36" width="44" height="44">
            <path
              d="M11 6c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v8h8c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2h-8v8c0 1.1-.9 2-2 2h-4c-1.1 0-2-.9-2-2v-8H3c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2h8V6z"
              fill="#111827"
            />
          </svg>
        </div>
        <h1 className="login-title">955110 Dashboard</h1>
        <p className="login-sub">เลือกบทบาทเพื่อเข้าสู่ระบบ</p>

        <div className="login-role-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "student"}
            className={`login-role-tab ${mode === "student" ? "on" : ""}`}
            onClick={() => onChangeMode("student")}
          >
            <GraduationCap size={18} />
            <span>นักเรียน</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "teacher"}
            className={`login-role-tab ${mode === "teacher" ? "on" : ""}`}
            onClick={() => onChangeMode("teacher")}
          >
            <BookOpenCheck size={18} />
            <span>อาจารย์</span>
          </button>
        </div>

        {mode === "student" && (
          <>
            <label className="login-label" htmlFor="login-student">
              รหัสนักศึกษา
            </label>
            <input
              id="login-student"
              type="text"
              inputMode="numeric"
              className="login-input"
              placeholder="เช่น 682110192"
              value={studentValue}
              onChange={(e) => {
                setStudentValue(e.target.value);
                setError("");
              }}
              autoFocus
            />
          </>
        )}

        {mode === "teacher" && (
          <>
            <label className="login-label" htmlFor="login-teacher">
              รหัสผ่านอาจารย์
            </label>
            <input
              id="login-teacher"
              type="password"
              className="login-input"
              placeholder="ใส่รหัสผ่าน"
              value={teacherValue}
              onChange={(e) => {
                setTeacherValue(e.target.value);
                setError("");
              }}
              autoFocus
            />
          </>
        )}

        {error && <div className="login-error">{error}</div>}

        <button type="submit" className="login-btn">
          เข้าสู่ระบบ
        </button>

        <p className="login-hint">
          {mode === "student"
            ? "ระบบจะดึงข้อมูล Meditation Record และ Daily Journal จากฟอร์มของวิชาตามรหัสนักศึกษา"
            : "เข้าสู่ระบบเพื่อจัดการประกาศ นัดประชุม และดูสถานะการส่งงานของนักเรียนทั้งห้อง"}
        </p>
      </form>
    </div>
  );
}
