function migrateMeetings(raw) {
  // New shape is an array. If old shape (dict keyed by date) is in localStorage, migrate it.
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    return Object.entries(raw).map(([date, m], idx) => ({
      id: `legacy-${idx}-${date}`,
      date,
      time: m.time || "",
      title: m.title || "ไม่มีหัวข้อ",
      location: m.location || "",
      description: "",
      attendeeMode: "all",
      studentIds: [],
      createdAt: new Date().toISOString(),
    }));
  }
  return [];
}

export function getInitialData() {
  const defaults = getDefaults();
  const saved = localStorage.getItem("tma_955110");
  if (saved) {
    const parsed = JSON.parse(saved);
    return {
      ...parsed,
      meetings: migrateMeetings(parsed.meetings),
      courses: Array.isArray(parsed.courses) ? parsed.courses : [],
      courseAudit: Array.isArray(parsed.courseAudit) ? parsed.courseAudit : [],
      teacher: defaults.teacher,
    };
  }
  return defaults;
}

function getDefaults() {
  return {
    meetings: [
      {
        id: "seed-1",
        date: "2026-04-28",
        time: "09:00 - 12:00 น.",
        title: "นัดประชุมอัพเดตสถานะโปรเจค",
        location: "ห้อง 6301 ตึก CBB",
        description: "อัพเดตความคืบหน้าโปรเจค + ตอบข้อสงสัย",
        attendeeMode: "all",
        studentIds: [],
        createdAt: "2026-04-25T09:00:00",
      },
      {
        id: "seed-2",
        date: "2026-04-30",
        time: "13:00 - 14:00 น.",
        title: "นัดตรวจ Assignment 3 (1:1)",
        location: "ห้อง Lab 2 ตึก CBB",
        description: "ตรวจงานพร้อม feedback ส่วนตัว",
        attendeeMode: "students",
        studentIds: ["65101000", "65101003", "65101007"],
        createdAt: "2026-04-26T08:00:00",
      },
      {
        id: "seed-3",
        date: "2026-05-05",
        time: "09:00 - 12:00 น.",
        title: "สอบกลางภาค",
        location: "ห้องสอบ 101",
        description: "นำดินสอ + บัตรนักศึกษามาด้วย",
        attendeeMode: "all",
        studentIds: [],
        createdAt: "2026-04-27T10:00:00",
      },
    ],
    courses: [],
    courseAudit: [],
    announcements: [
      {
        id: 1,
        title: "ส่งงาน Assignment 3",
        description: "ส่งไฟล์ผ่าน Google Classroom ตามฟอร์มเดิม ห้ามเลยกำหนด",
        category: "ส่งงาน",
        dateStart: "2026-04-25",
        dateEnd: "2026-04-30",
        time: "ก่อน 23:59 น.",
        location: "Google Classroom",
        attendees: "ทั้งห้อง 40 คน",
        createdAt: "2026-04-25T08:00:00",
        read: false,
      },
      {
        id: 2,
        title: "อ่านบทที่ 5 ก่อนเข้าเรียน",
        description: "เตรียมตัวก่อนคาบเรียนสัปดาห์หน้า มีคำถามให้ตอบในชั้นเรียน",
        category: "ประกาศ",
        dateStart: "2026-04-28",
        dateEnd: "",
        time: "",
        location: "",
        attendees: "",
        createdAt: "2026-04-24T10:30:00",
        read: true,
      },
      {
        id: 3,
        title: "เปลี่ยนห้องเรียนสัปดาห์หน้า",
        description: "ย้ายไปห้อง 6302 ตึก CBB ชั่วคราวเนื่องจากห้องเดิมปรับปรุง",
        category: "ประกาศ",
        dateStart: "2026-04-29",
        dateEnd: "2026-05-03",
        time: "ตามตารางเดิม",
        location: "ห้อง 6302 ตึก CBB",
        attendees: "ทั้งห้อง",
        createdAt: "2026-04-23T09:00:00",
        read: true,
      },
    ],
    todos: [
      { id: 1, title: "ทำ Assignment 3", subject: "955110", type: "Assignment", done: false, dueDate: "2026-04-30" },
      { id: 2, title: "อ่านบทที่ 5 เตรียมตัว", subject: "955110", type: "Reading", done: false, dueDate: "2026-04-28" },
      { id: 3, title: "ส่ง Meditation Record ประจำวัน", subject: "955110", type: "Daily", done: true, dueDate: "2026-04-26" },
      { id: 4, title: "เขียน Daily Journal", subject: "955110", type: "Daily", done: false, dueDate: "2026-04-26" },
    ],
    teacher: {
      name: "ดร.ทมะ ดวงนามล",
      role: "อาจารย์ประจำวิชา 955110",
    },
  };
}

