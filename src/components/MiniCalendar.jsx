import React from "react";
import { useApp } from "../AppContext";
import { ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

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

const MONTHS_TH = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

const MONTHS_EN = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
];

export default function MiniCalendar() {
  const { data, selectedDate, setSelectedDate, calendarMonth, setCalendarMonth } = useApp();
  const { year, month } = calendarMonth;
  const days = generateDays(year, month);
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const prevMonth = () => {
    setCalendarMonth((p) =>
      p.month === 0 ? { year: p.year - 1, month: 11 } : { ...p, month: p.month - 1 }
    );
  };
  const nextMonth = () => {
    setCalendarMonth((p) =>
      p.month === 11 ? { year: p.year + 1, month: 0 } : { ...p, month: p.month + 1 }
    );
  };

  const handleDayClick = (cell) => {
    if (cell.otherMonth) return;
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`;
    setSelectedDate(dateStr === selectedDate ? null : dateStr);
  };

  return (
    <div className="calendar-card fade-in-delay-1">
      <div className="calendar-title">New Events</div>

      <div className="calendar-month-header">
        <div className="calendar-month">{MONTHS_EN[month]} {year}</div>
        <div className="calendar-nav">
          <button onClick={prevMonth} aria-label="Previous month"><ChevronLeft size={14} /></button>
          <button onClick={nextMonth} aria-label="Next month"><ChevronRight size={14} /></button>
        </div>
      </div>

      <div className="calendar-weekdays">
        {WEEKDAYS.map((d) => (<div key={d} className="calendar-weekday">{d}</div>))}
      </div>

      <div className="calendar-days">
        {days.map((cell, i) => {
          const dateStr = cell.otherMonth
            ? null
            : `${year}-${String(month + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`;
          const hasMeeting = dateStr && data.meetings[dateStr];
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;

          let cls = "calendar-day";
          if (cell.otherMonth) cls += " other-month";
          if (isToday) cls += " today";
          if (isSelected) cls += " selected";
          if (hasMeeting && !isSelected) cls += " has-meeting";

          return (
            <div
              key={i}
              className={cls}
              onClick={() => handleDayClick(cell)}
            >
              {hasMeeting && <span className="meeting-day-ring" />}
              <span className="day-number">{cell.day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
