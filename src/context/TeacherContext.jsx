import React, { createContext, useContext, useMemo } from "react";

const TeacherContext = createContext(null);

const FIRST = [
  "Achara","Boon","Chai","Dao","Eak","Fah","Gun","Hatai","Inthira","Jariya",
  "Kanya","Lalita","Manat","Nan","Orn","Piti","Quan","Rapee","Somchai","Thida",
  "Ubon","Veera","Wanida","Yada","Anong","Boonsri","Chompoo","Duangjai","Ekkachai","Fahsai",
];
const LAST = [
  "Suk","Phong","Wong","Chai","Mali","Boon","Sri","Kham","Tong","Naree",
  "Phan","Ratta","Saen","Thong","Vora",
];
const STATUS_POOL = [
  "on-time","on-time","on-time","on-time","on-time","late","late","missing",
];

// Deterministic LCG so the roster is identical across reloads.
function makeRng(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function buildStudents(count) {
  const rng = makeRng(42);
  const list = [];
  for (let i = 0; i < count; i++) {
    const f = FIRST[Math.floor(rng() * FIRST.length)];
    const l = LAST[Math.floor(rng() * LAST.length)];
    const status = STATUS_POOL[Math.floor(rng() * STATUS_POOL.length)];
    const meditation = status !== "missing" && rng() > 0.15;
    const journal = status === "on-time" && rng() > 0.20;
    const assignment = status === "on-time" && rng() > 0.40;
    list.push({
      id: `6510${String(1000 + i).padStart(4, "0")}`,
      seat: i + 1,
      name: `${f} ${l}`,
      status,
      meditation,
      journal,
      assignment,
    });
  }
  if (list[31]) {
    list[31] = {
      ...list[31],
      id: "682110192",
      name: "วีรชิต มงคล (ซี)",
    };
  }
  return list;
}

export function TeacherProvider({ children }) {
  const value = useMemo(() => {
    const students = buildStudents(40);
    const onTime = students.filter((s) => s.status === "on-time").length;
    const pending = students.filter((s) => !s.meditation || !s.journal);
    return {
      teacher: {
        name: "ดร.ทมะ ดวงนามล",
        course: "955110 · Literature",
      },
      students,
      stats: {
        total: students.length,
        onTimeRate: Math.round((onTime / students.length) * 100),
        pendingCount: pending.length,
        unreadChats: 3,
      },
      pending,
    };
  }, []);

  return (
    <TeacherContext.Provider value={value}>{children}</TeacherContext.Provider>
  );
}

export function useTeacher() {
  const ctx = useContext(TeacherContext);
  if (!ctx) throw new Error("useTeacher must be used inside <TeacherProvider>");
  return ctx;
}
