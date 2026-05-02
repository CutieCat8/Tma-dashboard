# 955110 Dashboard (Tma-dashboard)

> ระบบเว็บแดชบอร์ดสำหรับวิชา **955110** — แทนที่การที่อาจารย์สั่งงาน / ประกาศผ่าน Canva,
> นัดประชุม 1:1 แบบกระจัดกระจาย, และเก็บข้อมูล meditation / journal ผ่าน Google Form
> ให้กลายเป็นหน้าเว็บเดียวที่ทั้งอาจารย์และนักเรียนใช้ร่วมกันได้

---

## 1. โปรเจคนี้คืออะไร และทำขึ้นมาเพื่ออะไร

### ปัญหาที่อยากแก้ (เหตุผลที่เริ่มทำ)

อาจารย์ของวิชา 955110 ใช้ **Canva** เป็นเครื่องมือหลักในการสื่อสารกับห้องเรียน 40 คน ซึ่งทำให้เกิดปัญหา:

1. **ไม่มีระบบแจ้งเตือน** — โพสต์ Canva ใหม่ออกมา นักเรียนไม่รู้
2. **หาข้อมูลย้อนหลังยาก** — บางครั้งอาจารย์ทำสไลด์ประกาศ 20+ slides แล้วต้องไล่ดูเอง
3. **Canva ไม่ได้ออกแบบมาเป็นช่องทางสั่งงาน** — UX ไม่เหมาะกับการประกาศ deadline / นัดหมาย
4. **อาจารย์นัดประชุมเป็นรายคน** — ไม่ใช่นัดทั้งห้องพร้อมกัน → นักเรียนแต่ละคนต้องจำเองว่าตัวเองโดนนัดวันไหน
5. **มีฟอร์มที่ต้องส่งทุกวัน** — Meditation Record + Daily Journal — อาจารย์เก็บเปอร์เซ็นต์ ดังนั้น
   นักเรียนต้องเห็นได้ว่าตัวเองส่งครบหรือยัง สาย / ขาดวันไหน

### เป้าหมายของระบบ

สร้างเว็บแดชบอร์ดเดียวที่:

- **อาจารย์** ใช้ประกาศ / สั่งงาน / นัดหมาย / ดูสถานะการส่งงานของนักเรียนทั้ง 40 คน
- **นักเรียน** เห็นประกาศใหม่ทันที, เห็นเฉพาะนัดของตัวเอง, มีหน้าให้ส่งฟอร์มประจำวัน,
  และดูกราฟ consistency ของตัวเอง (ส่งติดต่อกันกี่วัน, เปอร์เซ็นต์)

---

## 2. ฟีเจอร์ที่ทำเสร็จแล้ว ณ ปัจจุบัน

### 2.1 ฝั่งนักเรียน (`/student/*`)

| หน้า | path | สิ่งที่ทำได้ |
|---|---|---|
| Home | `/student` | สรุปสถิติ, นัดหมายของวันนี้ / ที่เลือก, ปฏิทินเดือน, ฟอรัมประกาศ (ตัวอย่าง 5 รายการ), การ์ด consistency |
| Announcements | `/student/announcements` | ดูประกาศทั้งหมดเป็นการ์ดกริด, กรองตามหมวด, คลิกดูรายละเอียดเต็มในโมดัล (auto mark as read) |
| Tasks | `/student/tasks` | รายการ to-do ของวันนี้, แยกหมวด Assignment / Reading / Daily |
| Analytics | `/student/analytics` | กราฟ meditation / journal — ดึงจาก Google Sheets ตามรหัสนักศึกษา, นับ streak, แสดง heatmap, embed ฟอร์มสองฟอร์ม |

### 2.2 ฝั่งอาจารย์ (`/teacher/*`)

| หน้า | path | สิ่งที่ทำได้ |
|---|---|---|
| Overview | `/teacher` | 4 stat tiles (จำนวนนักเรียน / on-time today / pending forms / unread chats), Class Roster grid 40 คน พร้อม dot สถานะการส่ง 3 ฟอร์ม + filter All/On time/Late/Missing, คลิกการ์ดดูสถานะคนๆ เดียว |
| Announcements | `/teacher/announcements` | ฟอร์มสร้างประกาศ + **live preview การ์ดด้านขวา**, หมวดหมู่เลือกด้วย pill cards (ประกาศ / ส่งงาน / ประชุม / กิจกรรม / อื่นๆ), กรอกแค่หัวข้อก็ประกาศได้, รายการประกาศที่โพสต์แล้วพร้อมตัวกรอง, ลบได้ |
| Schedule | `/teacher/schedule` | ปฏิทินรายเดือนแสดงจำนวนนัดในแต่ละวัน, รายการนัดของวันที่เลือก, ฟอร์มสร้างนัดที่เลือกได้ระหว่าง **ทั้งห้อง 40 คน** หรือ **เฉพาะนักเรียน** (multi-select + ช่องค้นหาชื่อ / รหัส / ที่นั่ง), ลบนัดได้, รายการ "นัดที่กำลังจะมาถึง" |

### 2.3 ระบบ Login / Role

- หน้า login เดียว มี **toggle** "นักเรียน" / "อาจารย์"
- นักเรียน: ใส่รหัสนักศึกษา 6-12 หลัก → state เก็บใน `localStorage`
- อาจารย์: รหัสผ่าน mock = `955110` (ดูที่ `src/components/LoginScreen.jsx` คงที่ `TEACHER_PASSCODE`)
- Role / studentId เก็บใน `localStorage` รีเฟรชแล้วยังอยู่หน้าเดิม
- Logout ผ่าน sidebar

### 2.4 ระบบประกาศ (cross-role)

- อาจารย์โพสต์ที่ `/teacher/announcements` → นักเรียนเห็นทันทีที่ `/student/announcements`
- ข้อมูลที่ใส่ได้: หัวข้อ (จำเป็น), รายละเอียด, หมวดหมู่, ช่วงวัน, เวลา, สถานที่, จำนวนคน
- การ์ดประกาศ auto-derive **status pill**: "เร็วๆ นี้" / "กำลังจัด" / "จบแล้ว" / "ใหม่"
- mark as read อัตโนมัติเมื่อนักเรียนเปิดดู

### 2.5 ระบบนัดประชุม (cross-role)

- อาจารย์สร้างที่ `/teacher/schedule` → ระบบกรองให้แต่ละนักเรียนเห็นเฉพาะของตัวเอง (หรือนัดทั้งห้อง)
- ใช้ `getMeetingsForDate(date, studentId)` ที่ AppContext เป็นตัว filter
- ฝั่งนักเรียน: ปฏิทินมี ring สีส้มที่วันที่มีนัด, การ์ด MeetingCard แสดงนัดของวันนั้น

---

## 3. Tech Stack

| ส่วน | ใช้อะไร |
|---|---|
| Framework | React 18 |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 (ใช้น้อยมาก) + Custom CSS ใน `src/index.css` (~3000 บรรทัด, ใช้เป็นหลัก) |
| Routing | react-router-dom 7 (BrowserRouter, Routes, NavLink, useNavigate, Outlet, Navigate) |
| Icons | lucide-react |
| Charts | recharts |
| State | React Context API + `useState` + `localStorage` (ยังไม่มี backend จริง) |
| External data | Google Sheets ผ่าน `gviz/tq` endpoint สำหรับฟอร์ม meditation / journal |

---

## 4. โครงสร้างโปรเจค

```
Tma-dashboard/
├── icon/                        # icon assets (PNG)
│   ├── Charticon.png
│   └── lotus.png
├── src/
│   ├── main.jsx                 # entry point — wrap ด้วย <BrowserRouter>
│   ├── App.jsx                  # Routes — login / student / teacher
│   ├── index.css                # custom CSS ทั้งหมด (~3000 บรรทัด)
│   ├── teacher_profile.png      # รูปอาจารย์
│   │
│   ├── AppContext.jsx           # Global state: data, auth, sheets, helpers
│   │                            # actions: addAnnouncement, removeAnnouncement,
│   │                            #          markAnnouncementRead, addMeeting,
│   │                            #          removeMeeting, getMeetingsForDate,
│   │                            #          getMeetingsForStudent, toggleTodo
│   │
│   ├── context/
│   │   └── TeacherContext.jsx   # Teacher-only state: 40 mock students roster
│   │                            # (deterministic seed; index 31 = student "วีรชิต มงคล (ซี)" 682110192)
│   │
│   ├── lib/
│   │   ├── sheets.js            # Google Sheets fetcher + cache
│   │   └── consistency.js       # คำนวณ streak / on-time จาก sheet rows
│   │
│   ├── components/
│   │   │  # ↓ student-shared
│   │   ├── Sidebar.jsx          # NavLink-based, สำหรับ /student/*
│   │   ├── LoginScreen.jsx      # role toggle (student / teacher)
│   │   ├── StatsRow.jsx         # 3 stat tiles หน้า home
│   │   ├── MeetingCard.jsx      # การ์ดนัดของวันที่เลือก (filter ด้วย studentId)
│   │   ├── MiniCalendar.jsx     # ปฏิทินเดือน + ring เมื่อมีนัด (filter ด้วย studentId)
│   │   ├── TaskList.jsx         # Forum / To-do tabs
│   │   ├── TeacherCard.jsx      # การ์ดอาจารย์ขวาบน
│   │   ├── ConsistencyCard.jsx  # การ์ดสีดำ + chart meditation / journal
│   │   ├── JournalIcon.jsx      # SVG icon
│   │   │
│   │   │  # ↓ teacher-shared
│   │   ├── TSidebar.jsx         # NavLink-based, สำหรับ /teacher/*
│   │   ├── StudentGrid.jsx      # 40-student roster grid + filter
│   │   │
│   │   │  # ↓ cross-role
│   │   ├── AnnouncementCard.jsx # การ์ดประกาศ (export ANNOUNCEMENT_CATEGORIES, deriveStatus)
│   │   ├── BroadcastComposer.jsx# ฟอร์มสร้างประกาศ (controlled component)
│   │   └── MeetingComposer.jsx  # ฟอร์มสร้างนัด + multi-select students
│   │
│   └── pages/
│       │  # ↓ student
│       ├── HomePage.jsx
│       ├── TasksPage.jsx
│       ├── ConsistencyPage.jsx
│       ├── StudentAnnouncementsPage.jsx
│       │  # ↓ teacher
│       ├── TeacherHomePage.jsx
│       ├── TeacherAnnouncementsPage.jsx
│       └── TeacherSchedulePage.jsx
│
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

---

## 5. การติดตั้งและรัน

```bash
# install
npm install

# dev (Vite hot reload)
npm run dev

# production build
npm run build

# preview build ที่ build แล้ว
npm run preview
```

โดย default Vite จะรันที่ `http://localhost:5173` (หรือ 5174 ถ้าพอร์ตเดิมไม่ว่าง)

---

## 6. การ Login (mock)

| Role | สิ่งที่ใส่ | ข้อมูลที่จะเห็น |
|---|---|---|
| นักเรียน | รหัสนักศึกษา 6-12 หลัก เช่น `682110192` | dashboard ตัวเอง — ปฏิทินเฉพาะนัดของตัวเอง, กราฟจาก Google Sheets ตาม id |
| นักเรียน (mock) | `65101000` ถึง `65101039` | ใช้ทดสอบ — เป็น id ของ 40 คนใน TeacherContext |
| อาจารย์ | passcode `955110` (ดูใน `src/components/LoginScreen.jsx`) | dashboard ฝั่งอาจารย์ทั้งหมด |

> ⚠️ **mock auth เท่านั้น** — ตอนนี้ไม่มีการตรวจสอบรหัสผ่านนักเรียน, ใครพิมพ์รหัสไหนก็ login ได้
> เป็นรหัสนั้น เพราะยังไม่ได้ต่อ backend

---

## 7. Data flow ปัจจุบัน

### State ทั้งหมดอยู่ใน browser ของผู้ใช้แต่ละคน

```
┌──────────────────────────────────────────────┐
│  localStorage  (key: tma_955110)             │
│  - meetings[]                                │
│  - announcements[]                           │
│  - todos[]                                   │
│  - teacher (display only)                    │
└──────────────────────────────────────────────┘
            ↑↓ JSON serialize/deserialize
┌──────────────────────────────────────────────┐
│  AppContext (data state)                     │
│  + studentId, role, sheetsLoading, ...       │
│  + actions (add/remove/mark/...)             │
└──────────────────────────────────────────────┘
            ↑↓
   Components (Sidebar, MeetingCard, ...)
```

### หมายเหตุสำคัญ

- **state ไม่ sync ข้ามเครื่อง / browser** → อาจารย์โพสต์ใน chrome ของตัวเอง
  นักเรียนใน chrome ของอีกเครื่องไม่เห็น
- ใช้ทดสอบใน browser เดียวกันได้ (เช่น เปิด tab อื่นเป็น role อื่น)
- **Google Sheets** เป็น external data ที่ดึงจริงได้ทั้งเครื่อง — แต่เป็น read-only

### Schema สำคัญ

#### Announcement
```js
{
  id: number,
  title: string,            // required
  description: string,
  category: 'ประกาศ' | 'ส่งงาน' | 'ประชุม' | 'กิจกรรม' | 'อื่นๆ',
  dateStart: 'YYYY-MM-DD',  // optional
  dateEnd: 'YYYY-MM-DD',    // optional
  time: string,             // free text
  location: string,
  attendees: string,        // free text เช่น "ทั้งห้อง 40 คน"
  createdAt: ISO string,
  read: boolean,
}
```

#### Meeting
```js
{
  id: string,
  date: 'YYYY-MM-DD',
  time: string,
  title: string,
  location: string,
  description: string,
  attendeeMode: 'all' | 'students',
  studentIds: string[],     // ใช้เมื่อ attendeeMode === 'students'
  createdAt: ISO string,
}
```

ตอน student login มา ระบบจะ filter:
```
match = m.attendeeMode === 'all'
     || m.studentIds.includes(currentStudentId)
```

---

## 8. ที่มาของ design system

โปรเจคนี้เริ่มจาก **handoff bundle จาก claude.ai/design** ซึ่งมี:

- `colors_and_type.css` — token: สี, radius, shadow, type scale
- `SKILL.md` — guidance สำหรับการขยายระบบ
- `ui_kits/student/` + `ui_kits/teacher/` — JSX prototypes (HTML/CSS/JS)

token / pattern พื้นฐาน:
- **Sidebar สีเข้ม** `#1a1a1a` กว้าง 200px fixed
- **Cards** radius 18-20px, border `#e5e7eb`, shadow `0 1px 3px rgba(0,0,0,.04)`
- **CTA สีดำ** `#111827`, gradient ใช้เฉพาะ stat tiles ฝั่ง teacher
- **Type**: Inter + IBM Plex Sans Thai (mix ไทย-อังกฤษได้ในประโยคเดียวกัน)
- **ไม่ใช้ emoji** บน student surface, ใช้ได้บน teacher stat tiles

---

## 9. Roadmap (สิ่งที่ยังต้องทำ)

### Phase 1 — Frontend mock (ส่วนใหญ่เสร็จแล้ว)

- [x] Login + role toggle
- [x] Routing (react-router)
- [x] Student Home + Tasks + Analytics + Forms (Google Sheets)
- [x] Teacher Overview + StudentGrid 40 คน
- [x] Announcement system + live preview composer
- [x] Schedule system + per-student filtering
- [ ] **Student Schedule page** (`/student/schedule`) — ตอนนี้นักเรียนเห็นนัดได้แค่ผ่านปฏิทิน home, อยากให้มีรายการเต็มๆ
- [ ] **Edit announcement / meeting** — ตอนนี้แค่สร้าง / ลบ
- [ ] **Roster page** (`/teacher/roster`) — ดูนักเรียนคนเดียวลึกๆ (timeline ส่งงาน, %, history)
- [ ] **Chat 1:1** — รอ realtime backend

### Phase 2 — Backend จริง

วางแผนใช้ **Supabase** เพราะ:

- Free tier เพียงพอสำหรับ 40 คน + ปริมาณ chat เบาๆ
- มี Auth สำเร็จรูป (รองรับ role ผ่าน `user_metadata.role` หรือตาราง `profiles`)
- มี Realtime สำหรับ chat / presence
- PostgreSQL + Row Level Security — กำหนดได้ว่านักเรียนเห็นเฉพาะของตัวเอง
- มี Storage สำหรับแนบรูป (ถ้าต้องการ in future)

ลำดับ migrate ที่วางไว้:

1. ตั้ง Supabase project + schema (`announcements`, `meetings`, `meeting_attendees`, `profiles`)
2. แทน mock auth ด้วย Supabase Auth (email + password หรือ magic link)
3. Migrate `announcements` จาก localStorage → Supabase ก่อน (schema ตรงไปตรงมา + ไม่ critical)
4. Migrate `meetings` + `meeting_attendees` (junction table สำหรับ per-student)
5. Add RLS policies
6. Realtime subscription (อัพเดต UI ทันทีเมื่อมีคนโพสต์)
7. Chat 1:1 (`messages` table + Realtime channel ต่อคู่ teacher↔student)

### Phase 3 — Polish

- การแจ้งเตือน push (Web Push API หรือ email)
- ส่งออกรายงานสรุปการส่งงานให้อาจารย์
- mobile-first review

---

## 10. ปัญหาที่รู้อยู่ / ข้อจำกัด

1. **ไม่มี real auth** — ใครพิมพ์ teacher passcode `955110` ได้ก็เข้าเป็นอาจารย์, ใครพิมพ์รหัสนักศึกษา
   อะไรก็เข้าเป็นนักเรียนคนนั้น
2. **state ไม่ sync ข้ามเครื่อง** — ดูส่วน 7
3. **Google Sheets fetch** ใช้ public sharing link, ถ้าอาจารย์ปิด share จะดึงไม่ได้
4. **localStorage มี quota ~5MB** — ถ้าประกาศ / นัดเยอะมากอาจชน limit (แต่ไม่น่าถึงในการใช้จริง)
5. **ยังไม่ responsive เต็มที่** — ใช้งานได้ดีบนจอ desktop, mobile breakpoint บางหน้ายังต้องปรับ

---

## 11. การพัฒนาต่อ — เคล็ดลับ

### เพิ่มหน้าใหม่

1. สร้างไฟล์ใน `src/pages/`
2. import + เพิ่ม `<Route>` ใน `src/App.jsx` ให้อยู่ใต้ `StudentShell` หรือ `TeacherShell`
3. เพิ่ม link ใน `Sidebar.jsx` หรือ `TSidebar.jsx`
4. ใช้ `<div className="t-page-wrap"><main className="t-page">` (teacher) หรือ
   `<div className="main-wrapper"><main className="main-content">` (student) เป็น layout outer

### เพิ่ม action ใน AppContext

1. เขียน `useCallback` ที่อ่าน + setData (อย่าแก้ตรงๆ — ใช้ functional update)
2. เพิ่ม key ใน `<AppContext.Provider value={{ ... }}>`
3. ใช้ผ่าน `const { newAction } = useApp()` ในคอมโพเนนต์

### เปลี่ยน design tokens

แก้ที่ `src/index.css` ส่วนบนสุดของไฟล์ — แต่ระวัง custom CSS อีกราว 3000 บรรทัดด้านล่างยัง hard-code
สีบางจุดอยู่ — search & replace ตามต้องการ

---

## 12. License / สิทธิ์การใช้งาน

โปรเจคส่วนตัวสำหรับวิชา 955110 — ยังไม่มี license สาธารณะ
