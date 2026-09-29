# 955110 Learning Dashboard

เว็บแดชบอร์ดสำหรับอาจารย์และนักเรียนในรายวิชา 955110 สร้างด้วย React, Vite,
TypeScript/TSC, Tailwind CSS และ shadcn/ui

ระบบปัจจุบันครอบคลุมประกาศ งาน นัดหมาย ตารางเรียนส่วนตัว และการตรวจช่วงเวลาว่าง
ของนักเรียนก่อนที่อาจารย์จะสร้างนัดหมาย

## เริ่มต้นใช้งาน

```bash
npm install
npm run dev
```

คำสั่งตรวจสอบโปรเจกต์:

```bash
npm run typecheck
npm test
npm run build
```

## หน้าหลัก

### นักเรียน

- `/student` — ภาพรวม งาน นัดหมาย และปฏิทิน
- `/student/schedule` — ตารางส่วนตัว นัดหมาย และวิชาเรียน
- `/student/schedule/add-course` — เพิ่มวิชาเรียนแบบเกิดซ้ำรายสัปดาห์
- `/student/schedule/courses/:courseId/edit` — แก้ไขวิชาเรียน
- `/student/announcements` — ประกาศ
- `/student/tasks` — งาน
- `/student/analytics` — สถิติ consistency

### อาจารย์

- `/teacher` — ภาพรวมห้องเรียน
- `/teacher/schedule` — ดู Busy/Available ของนักเรียนและสร้างนัดหมาย
- `/teacher/announcements` — สร้างและจัดการประกาศ
- `/teacher/roster` — รายชื่อนักเรียน
- `/teacher/roster/:id` — รายละเอียดนักเรียน

## โครงสร้างโปรเจกต์

```text
.
├─ index.html                 # HTML entry ของ Vite (ควรอยู่ที่ root)
├─ plans/                     # เอกสาร requirement และ handoff
└─ src/
   ├─ app/
   │  ├─ App.jsx              # routes และ application shells
   │  ├─ data/                # initial/mock data และ migration
   │  └─ providers/           # context และ hooks ระดับแอป
   ├─ assets/images/          # รูปที่ import ใช้งานจริง
   ├─ components/ui/          # primitive components ของ shadcn/ui
   ├─ features/
   │  ├─ announcements/
   │  ├─ auth/
   │  ├─ consistency/
   │  ├─ home/
   │  ├─ schedule/
   │  ├─ tasks/
   │  └─ teacher/
   ├─ lib/                    # utilities ที่ใช้ร่วมกัน
   ├─ shared/layout/          # layout/sidebar ที่ใช้ข้าม feature
   ├─ styles/                 # CSS แยกตามขอบเขตหน้าจอและ feature
   ├─ index.css               # import styles ตามลำดับ cascade
   └─ main.jsx                # React entry
```

หลักการวางไฟล์:

- โค้ดเฉพาะฟีเจอร์ให้อยู่ใน `src/features/<feature>`
- component ที่ใช้เฉพาะฟีเจอร์ให้อยู่ในโฟลเดอร์ `components` ของฟีเจอร์นั้น
- shadcn/ui primitives ให้อยู่ใน `src/components/ui`
- layout ที่ใช้หลายบทบาทให้อยู่ใน `src/shared/layout`
- CSS ใหม่ให้เพิ่มในไฟล์ของฟีเจอร์ภายใต้ `src/styles` แล้ว import ผ่าน
  `src/index.css` เพื่อควบคุมลำดับ cascade

## ตารางเรียนและการตรวจเวลาว่าง

นักเรียนเพิ่มวิชาได้โดยกำหนดชื่อวิชา ช่วงวันที่เรียน และคาบเรียนหนึ่งรายการหรือ
หลายรายการต่อสัปดาห์ ระบบสร้าง occurrence ตามช่วงวันที่และใช้ข้อมูลนี้ตรวจชนกับ
นัดหมาย

ฝั่งอาจารย์จะแสดงสถานะ Busy/Available ของนักเรียน สามารถเปิดดูรายละเอียดวิชา
ที่ทำให้ไม่ว่าง และตรวจ conflict ก่อนสร้างนัดทั้งห้องหรือรายบุคคลได้

รายละเอียด requirement และแนวทางพัฒนาต่ออยู่ที่
[`plans/course-availability-scheduling-handoff.md`](plans/course-availability-scheduling-handoff.md)

## ข้อมูลและข้อจำกัดของเวอร์ชันปัจจุบัน

- ข้อมูลส่วนใหญ่เป็น prototype และเก็บใน `localStorage`
- การ login และสิทธิ์การเข้าถึงยังเป็น mock ฝั่ง client ไม่ใช่ระบบยืนยันตัวตนจริง
- ข้อมูล consistency บางส่วนอ่านจาก Google Sheets
- ก่อนใช้งานจริงควรมี backend, database, authentication และ authorization
  เพื่อให้นักเรียนแก้ได้เฉพาะตารางของตนเอง และให้อาจารย์อ่านข้อมูลตามสิทธิ์

## เพิ่มหน้าหรือฟีเจอร์ใหม่

1. สร้างหน้าใน `src/features/<feature>`
2. เพิ่ม route ใน `src/app/App.jsx`
3. เพิ่ม style ในไฟล์ที่ตรงกับ feature ภายใต้ `src/styles`
4. เพิ่ม unit test ใกล้โมดูล logic โดยใช้ชื่อ `*.test.ts` หรือ `*.test.js`
5. รัน typecheck, tests และ build ก่อนส่งงาน
