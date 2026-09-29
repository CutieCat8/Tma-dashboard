import React from "react";

export default function JournalIcon({ size = 16, color = "currentColor", className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* ตัวสมุด */}
      <path
        d="M32 15C29.2386 15 27 17.2386 27 20V80C27 82.7614 29.2386 85 32 85H77C79.7614 85 82 82.7614 82 80V20C82 17.2386 79.7614 15 77 15H32Z"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* ห่วงสมุดด้านซ้าย */}
      <path d="M22 25H32" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M22 35H32" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M22 45H32" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M22 55H32" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M22 65H32" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M22 75H32" stroke={color} strokeWidth="3" strokeLinecap="round" />
      {/* ป้ายชื่อบนหน้าปก */}
      <rect x="42" y="28" width="28" height="18" rx="1" stroke={color} strokeWidth="3" />
      <path d="M49 34H63" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M49 40H59" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* ที่คั่นหนังสือ */}
      <path
        d="M35 85V75L42 80L49 75V85"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
