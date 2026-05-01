import React, { useState } from "react";
import { useApp } from "../AppContext";

export default function LoginScreen() {
  const { setStudentId } = useApp();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setError("กรุณาใส่รหัสนักศึกษา");
      return;
    }
    if (!/^\d{6,12}$/.test(trimmed)) {
      setError("รหัสนักศึกษาควรเป็นตัวเลข 6-12 หลัก");
      return;
    }
    setStudentId(trimmed);
  };

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={submit}>
        <div className="login-logo">
          <svg viewBox="0 0 36 36" width="44" height="44">
            <path
              d="M11 6c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v8h8c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2h-8v8c0 1.1-.9 2-2 2h-4c-1.1 0-2-.9-2-2v-8H3c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2h8V6z"
              fill="#111827"
            />
          </svg>
        </div>
        <h1 className="login-title">955110 Dashboard</h1>
        <p className="login-sub">ใส่รหัสนักศึกษาเพื่อเข้าสู่ระบบ</p>
        <input
          type="text"
          inputMode="numeric"
          className="login-input"
          placeholder="เช่น 682110192"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError("");
          }}
          autoFocus
        />
        {error && <div className="login-error">{error}</div>}
        <button type="submit" className="login-btn">เข้าสู่ระบบ</button>
        <p className="login-hint">
          ระบบจะดึงข้อมูล Meditation Record และ Daily Journal จากฟอร์มของวิชาตามรหัสนักศึกษา
        </p>
      </form>
    </div>
  );
}
