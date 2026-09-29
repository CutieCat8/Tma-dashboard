# Course Availability & Teacher Scheduling — Requirements and Implementation Handoff

> เอกสารนี้เป็น source of truth สำหรับ agent/Claude ที่รับช่วงต่อจาก Codex
>
> Repository: `C:\Users\Asus\Documents\Tma-dashboard`
>
> Branch ณ เวลาส่งต่อ: `main`

## Implementation status (updated 2026-09-29)

The same-browser prototype is implemented end-to-end:

- Student course add/edit/delete routes and weekly-session form
- Recurring occurrences rendered together with teacher meetings
- Course detail dialog with edit/delete and private-note visibility for the owner
- Normalized meeting `startTime` / `endTime`
- Per-attendee Busy/Available summary before a teacher saves a meeting
- Conflict detail popup showing every overlapping course/meeting
- Teacher verification (`verified` / `needs-review`) with audit entries
- Explicit reason required when a teacher overrides a Busy warning
- Pure recurrence/conflict/validation tests: 25 passing
- `npm run typecheck` and `npm run build`: passing

Remaining production gate: replace localStorage with the shared authenticated backend and enforce section-scoped authorization on the server. Until that is done, data is shared only between roles using the same browser storage and the feature must be described as a prototype, not multi-device production-ready.

## 1. เป้าหมายของระบบ

ระบบต้องช่วยให้อาจารย์นัดนักเรียนทั้งห้องหรือรายบุคคลได้ โดยไม่ต้องถามนักเรียนทีละคนว่าเวลาใดติดเรียน นักเรียนต้องเพิ่มตารางเรียนประจำสัปดาห์ของตนเองได้ และระบบต้องคำนวณสถานะ `Busy` / `Available` จากตารางเรียนจริง

อาจารย์เห็นสถานะโดยสรุปก่อน และกดช่วง `Busy` เพื่อดูรายละเอียดวิชาได้ตาม requirement ของผู้ใช้ ไม่ใช่ซ่อนชื่อวิชาอย่างถาวร

## 2. ข้อเท็จจริงของระบบปัจจุบัน

### Stack

- React 18 + Vite 5
- React Router
- Tailwind CSS 3
- TypeScript รองรับแล้วแบบ incremental (`allowJs: true`)
- shadcn-compatible structure ที่ `src/components/ui`
- State หลักอยู่ใน `AppContext.jsx`
- Persistence ปัจจุบันคือ `localStorage` key `tma_955110`
- Role guard เป็น client-side (`student` / `teacher`)

### สิ่งที่ทำเสร็จแล้วใน working tree แต่ยังไม่ได้ commit

ต้องรักษาการแก้ไขเหล่านี้ ห้าม reset หรือเขียนทับทั้งไฟล์โดยไม่ merge:

- หน้า `/student/schedule` ถูกเปลี่ยนเป็น personal timeline แบบ Day/Week/Month
- Event bar วางตามเวลา 08:00–18:00
- Event bar กดดู appointment detail dialog ได้
- Event bar แบบช่วงเวลาสั้นซ่อน metadata รองโดยอัตโนมัติ
- Calendar button ใช้ shadcn range date picker เลือกวันเดียวหรือช่วงวันได้
- เพิ่ม TypeScript, alias `@/`, `components.json`, `src/components/ui/*`, `src/lib/utils.ts`
- ปรับ layout ของ Meeting card หน้า Home ให้ความสูงสอดคล้องกับ New Events
- `npm run typecheck` และ `npm run build` ผ่าน

ไฟล์ modified/untracked สำคัญ:

```text
M  package.json
M  package-lock.json
M  src/index.css
M  src/pages/StudentSchedulePage.jsx
M  tailwind.config.js
M  vite.config.js
?? components.json
?? tsconfig.json
?? src/components/ui/
?? src/lib/utils.ts
```

ก่อนเริ่ม feature ใหม่ ให้ review งานชุดนี้ก่อน และขออนุญาตผู้ใช้ก่อน stage/commit เสมอ ห้าม commit หรือรวม scope เองโดยอัตโนมัติ

## 3. Production constraint ที่ห้ามมองข้าม

`localStorage` ไม่แชร์ข้อมูลข้าม browser/device/user ดังนั้น implementation แบบ localStorage ทำได้เพียง prototype เท่านั้น

ตัวอย่างปัญหา:

- นักเรียน A กรอก course บนเครื่อง A
- อาจารย์เปิดเว็บบนเครื่อง B
- เครื่อง B จะไม่เห็นข้อมูลจากเครื่อง A

ระบบจริงต้องมี:

1. Shared backend/database
2. Authentication ที่ระบุตัว student/teacher จริง
3. Authorization ฝั่ง server
4. Audit log สำหรับการเพิ่ม แก้ไข ตรวจสอบ และลบตาราง

Identity/access model ขั้นต่ำต้องมี `class/section`, สมาชิกนักเรียนใน section, อาจารย์ที่ได้รับมอบหมายให้ section และ role/claims ที่ตรวจสอบฝั่ง server การมีเพียง `studentId` ใน client ไม่เพียงพอ

ห้ามอ้างว่า feature production-ready หากยังใช้เฉพาะ localStorage

## 4. UX ที่ตกลงแล้ว

### Student schedule

บนหน้า `/student/schedule` เพิ่มปุ่มหลัก `+ Add course` บริเวณ header/toolbar

เมื่อกด ให้ไปหน้าใหม่:

```text
/student/schedule/add-course
```

หน้า Add course เป็น dedicated page ไม่ใช้ modal เพราะฟอร์มมีหลายส่วนและเพิ่มหลาย weekly sessions ได้

หลัง Save สำเร็จ:

```text
Save → navigate('/student/schedule') → เห็น course บน timeline
```

ต้องมีปุ่ม Back กลับ schedule โดยไม่บันทึก และเตือนเมื่อมี unsaved changes

### Course form

Required fields:

- Course code เช่น `955110`
- Course name
- Term start date
- Term end date
- อย่างน้อย 1 weekly session

Optional fields:

- Color
- Default location
- Notes (นักเรียนและอาจารย์ผู้มีสิทธิ์เห็น)

แยก `private student note` ออกจาก `verification evidence/note` โดยเด็ดขาด ค่าเริ่มต้นคืออาจารย์ไม่เห็น private note; อาจารย์เห็นเฉพาะข้อมูลวิชา ตาราง สถานที่ และหลักฐานที่มีไว้ตรวจสอบ

แต่ละ weekly session มี:

- Day of week
- Start time
- End time
- Location override (optional)
- ปุ่ม Remove session

ต้องมีปุ่ม `+ Add another class time`

ตัวอย่าง:

```text
955110 — Digital Technology
Term: 2026-06-01 ถึง 2026-09-30

Monday    09:00–12:00  Room 101
Wednesday 13:00–15:00  Room 204
```

### Student timeline behavior

- Timeline รวม `course occurrences` และ `teacher meetings`
- ใช้ visual treatment แยกกันอย่างชัดเจน
  - Course: สีประจำวิชา + label `Course`
  - Teacher appointment: palette ของ meeting + label `Class` หรือ `1:1`
- กด course event แล้วเปิด popup รายละเอียดรูปแบบเดียวกับ appointment detail dialog
- Popup course ของนักเรียนมี Edit/Delete
- Edit ใช้ route `/student/schedule/courses/:courseId/edit` หรือ reuse form component
- Delete ต้อง confirm

### Teacher availability

เมื่ออาจารย์กำลังสร้างนัดและเลือก `date + startTime + endTime`:

- แสดงนักเรียนแต่ละคนเป็น `Available` หรือ `Busy`
- ถ้านัดทั้งห้อง แสดง summary เช่น `7 of 40 students are busy`
- ถ้านัดเฉพาะคน แสดงเฉพาะนักเรียนที่เลือกหรือ candidate list ที่ค้นหาได้
- กด `Busy` แล้วเปิด popup รายละเอียด course
- Busy ต้องคำนวณจากทั้ง course occurrences และ teacher meetings เดิม โดยไม่นับ meeting ตัวเองขณะแก้ไข
- ถ้ามีหลาย conflict popup ต้องแสดงทุกรายการ ไม่เลือกแสดงเพียงรายการแรก
- จำนวน Busy ของทั้งห้องนับ unique students ไม่ใช่จำนวน conflict records
- Popup แสดง:
  - Student name / ID
  - Course code / name
  - Day and time
  - Location
  - Term start/end
  - Verification status
  - Created at / updated at
- อาจารย์ยังสร้างนัดที่ชนได้ แต่ต้องเห็น warning และยืนยัน override
- หาก override ควรเก็บ `overrideReason` ใน meeting audit metadata

วัน เวลาเริ่ม และเวลาสิ้นสุดต้องเป็น required สำหรับการสร้างนัดใหม่ที่เข้าระบบ availability ห้ามตีความเวลาที่ parse ไม่ได้ว่า Available ให้แสดง `Availability unknown` และบังคับแก้เวลาก่อนบันทึก

`All class` ต้องอ้างถึง `sectionId` และ authoritative roster ห้าม hardcode 40 คน สำหรับ MVP ให้ snapshot attendee IDs ตอนสร้างนัด เพื่อให้ประวัตินัดไม่เปลี่ยนเมื่อ roster เปลี่ยน พร้อมเก็บ `sectionId` ไว้ด้วย

## 5. Verification และการป้องกัน Busy ปลอม

การกรอกชื่อวิชาเองไม่ใช่หลักฐานว่าเรียนจริง จึงต้องมีสถานะ:

```ts
type VerificationStatus = "self-reported" | "verified" | "needs-review"
```

กติกา:

- Course ใหม่เริ่มเป็น `self-reported`
- เฉพาะอาจารย์ที่ได้รับมอบหมายให้ section ของนักเรียนจึงเปลี่ยนเป็น `verified` หรือ `needs-review` ได้
- การตั้ง `verified` ต้องมี verification source (`registrar`, `document`, `manual-review`) และ evidence reference/note
- เมื่อนักเรียนแก้ course code/name, term dates หรือ weekly sessions ของ course ที่ verified แล้ว ให้ reset เป็น `self-reported`; การเปลี่ยนสีหรือ private note ไม่ reset
- เก็บ `verifiedBy`, `verifiedAt`, `verificationNote`
- ทุกการเปลี่ยนสถานะต้องมี audit event
- Verification มีผลเฉพาะ term/date range ของ course นั้น ไม่ใช่ยืนยันถาวรทุกภาคเรียน

Production recommendation:

- ทางดีที่สุดคือ import จากระบบทะเบียน
- หากยังเชื่อมทะเบียนไม่ได้ อาจเพิ่มหลักฐาน เช่น section number หรือไฟล์/ลิงก์ตารางเรียน
- UI ต้องแยก `Self-reported` กับ `Verified` ชัดเจน ห้ามใช้คำว่า Verified โดยไม่มี actor/timestamp

## 6. Canonical data model

ไม่ควรสร้าง occurrence แยกเก็บทุกสัปดาห์ ให้เก็บ recurring rule แล้ว derive occurrence ตามช่วงวันที่ที่กำลังดู

```ts
type CourseSchedule = {
  id: string
  studentId: string
  courseCode: string
  courseName: string
  color: string
  defaultLocation: string
  notes: string
  privateNote: string      // student only; never shown to teacher
  sectionId: string
  termStart: string       // YYYY-MM-DD, local calendar date
  termEnd: string         // YYYY-MM-DD, inclusive
  sessions: WeeklySession[]
  exceptions: CourseException[]
  verificationStatus: "self-reported" | "verified" | "needs-review"
  verifiedBy: string | null
  verifiedAt: string | null
  verificationNote: string
  verificationSource: "registrar" | "document" | "manual-review" | null
  evidenceRef: string | null
  createdAt: string       // ISO timestamp
  updatedAt: string       // ISO timestamp
}

type CourseException =
  | { id: string; date: string; type: "cancelled"; reason: string }
  | { id: string; date: string; type: "replacement"; startTime: string; endTime: string; location: string; reason: string }

type WeeklySession = {
  id: string
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6
  startTime: string       // HH:mm
  endTime: string         // HH:mm
  location: string
}
```

Meeting model ควร migrate จาก `time: "09:00 - 12:00 น."` ไปเป็น normalized fields:

```ts
type Meeting = {
  // existing fields...
  date: string
  startTime: string
  endTime: string
  sectionId?: string
  attendeeStudentIds: string[] // snapshot for an all-class meeting
}
```

ระหว่าง migration ให้รองรับ `time` เดิมชั่วคราวด้วย parser เพื่อไม่ทำลายข้อมูลเก่า

Prototype localStorage shape:

```js
data = {
  meetings: [],
  courses: [],
  courseAudit: [],
  announcements: [],
  todos: []
}
```

Canonical audit event:

```ts
type ScheduleAuditEvent = {
  id: string
  entityType: "course" | "meeting" | "verification"
  entityId: string
  studentId?: string
  action: "create" | "update" | "delete" | "verify" | "flag" | "override"
  actorId: string
  actorRole: "student" | "teacher" | "system"
  before: unknown | null
  after: unknown | null
  reason: string
  createdAt: string
}
```

Audit events ต้อง append-only สำหรับ client ทั่วไป การลบ course ต้องไม่ลบ audit history และ production ต้องบังคับ immutability ฝั่ง server

## 7. Domain utilities ที่ควรสร้างก่อน UI

แนะนำไฟล์:

```text
src/lib/schedule/date.ts
src/lib/schedule/course-occurrences.ts
src/lib/schedule/conflicts.ts
src/lib/schedule/meeting-time.ts
src/lib/schedule/validation.ts
```

Pure functions ที่ต้องมี:

```ts
expandCourseOccurrences(course, rangeStart, rangeEnd)
expandStudentCourses(courses, studentId, rangeStart, rangeEnd)
timeRangesOverlap(aStart, aEnd, bStart, bEnd)
getStudentConflicts({ courses, meetings, studentId, date, startTime, endTime, excludeMeetingId })
getAvailabilityForStudents({ courses, meetings, studentIds, date, startTime, endTime, excludeMeetingId })
validateCourseSchedule(courseDraft)
parseLegacyMeetingTime(time)
getViewDateInterval({ view, activeDate, selectedRange })
```

กฎเวลา:

- ใช้ timezone `Asia/Bangkok`
- Date-only values ต้องไม่ผ่าน `new Date('YYYY-MM-DD')` แบบ UTC โดยไม่ตั้งใจ
- `endTime` ต้องมากกว่า `startTime`
- `termEnd >= termStart`
- session ใน course เดียวกันห้ามซ้อนกันในวันเดียวกัน
- occurrence มีเฉพาะวันที่อยู่ใน term range แบบ inclusive
- cancelled exception ไม่สร้าง occurrence; replacement exception ใช้เวลา/สถานที่ใหม่
- Course schedule ไม่ควรถูกนับเป็น conflict กับตัวมันเองขณะ edit
- Meeting ที่กำลัง edit ไม่ควร conflict กับตัวเอง
- Busy รวม course และ meeting conflicts และคืน conflicts ทั้งหมด
- เวลา meeting/course เป็น same-day เท่านั้นใน MVP; ไม่รองรับ overnight range
- กำหนด minute granularity (แนะนำ 5 นาที) และ validate `HH:mm`

View-range rule:

1. คำนวณ date interval จาก view ก่อน โดยไม่อิงว่ามี event หรือไม่
2. Day = วันเดียว, Week = Monday–Sunday, Month = วันแรก–วันสุดท้ายของเดือน, custom range = from–to
3. จากนั้นจึง expand courses และ filter meetings ใน interval
4. ห้าม derive month rows จาก meeting dates อย่างเดียว

Timeline ปัจจุบัน clamp ที่ 08:00–18:00 และ custom range ตัดเงียบที่ 62 วัน ต้องเปลี่ยนเป็น policy ที่ชัดเจน:

- Course/meeting ก่อน 08:00 หรือหลัง 18:00 ต้องยังมองเห็นได้ โดยขยาย axis ตาม earliest/latest event หรือมี horizontal scrolling ที่ครอบคลุมเวลานั้น
- หากจำกัด custom range ให้ระบุ max ใน UI และ validation ห้าม truncate เงียบ ๆ
- แนะนำ max custom range 62 วันใน prototype แต่ต้องแสดงข้อความเมื่อเกิน limit

## 8. AppContext API ที่ควรเพิ่ม

Prototype API:

```ts
addCourse(payload)
updateCourse(courseId, payload)
removeCourse(courseId)
getCoursesForStudent(studentId)
getCourseById(courseId)
getCourseOccurrencesForStudent(studentId, rangeStart, rangeEnd)
setCourseVerification(courseId, status, note)
getStudentAvailability(studentId, date, startTime, endTime)
getClassAvailability(studentIds, date, startTime, endTime)
```

Ownership rule:

- Student อ่าน/แก้/ลบเฉพาะ course ที่ `course.studentId === loggedInStudentId`
- Teacher อ่าน course ของนักเรียนใน roster ที่ตนได้รับสิทธิ์
- Production enforcement ต้องอยู่ server ไม่ใช่ตรวจเฉพาะ React route

## 9. Suggested component and route structure

```text
src/
  components/
    schedule/
      CourseEvent.jsx
      MeetingEvent.jsx
      CourseDetailsDialog.jsx
      AvailabilityBadge.jsx
      AvailabilityList.jsx
      WeeklySessionEditor.jsx
      ScheduleLegend.jsx
    ui/
      ...existing shadcn components
  pages/
    StudentSchedulePage.jsx                 # existing; merge course occurrences
    StudentCourseFormPage.jsx               # add/edit course
    TeacherSchedulePage.jsx                 # existing; add conflict preview
  lib/
    schedule/
      course-occurrences.ts
      conflicts.ts
      meeting-time.ts
      validation.ts
  AppContext.jsx
  App.jsx
```

Routes:

```jsx
<Route path="schedule" element={<StudentSchedulePage />} />
<Route path="schedule/add-course" element={<StudentCourseFormPage />} />
<Route path="schedule/courses/:courseId/edit" element={<StudentCourseFormPage />} />
```

## 10. Implementation blueprint

### Step 0 — Protect the current working tree

Context:
The current schedule redesign and shadcn integration are uncommitted and must not be lost.

Tasks:

1. Review `git diff` file by file
2. Run current verification
3. Commit as a checkpoint before course work

Verification:

```powershell
npm run typecheck
npm run build
git status --short
```

Exit criteria:

- Current Student Schedule still renders
- Calendar range picker works
- Appointment dialog works
- Working tree is understood; no unrelated changes discarded

Rollback:

- Revert only the new checkpoint commit; never use `git reset --hard` against user work

### Step 1 — Add schedule domain model and pure conflict engine

Context:
All later UI depends on correct recurrence and overlap logic. Implement and test without React first.

Tasks:

1. Add TypeScript domain types
2. Implement occurrence expansion
3. Implement time overlap and availability functions
4. Implement course validation
5. Add unit tests (recommend Vitest)

Required test cases:

- Monday/Wednesday course expands only to those weekdays
- No occurrence before termStart or after termEnd
- Adjacent `10:00–11:00` and `11:00–12:00` do not conflict
- Nested and partial overlaps do conflict
- Multiple sessions same day work
- Thai local dates do not shift by one day

Exit criteria:

- Pure functions pass tests
- No UI code contains duplicate overlap logic

Rollback:

- Remove isolated `src/lib/schedule` additions and test files

### Step 2 — Add course persistence and AppContext API

Depends on: Step 1

Tasks:

1. Add `courses` and `courseAudit` defaults/migration in `getInitialData`
2. Add scoped CRUD methods
3. Reset verification on student edits
4. Add availability selectors backed by pure utilities
5. Preserve existing meeting/announcement/todo data

Migration requirement:

```js
courses: Array.isArray(parsed.courses) ? parsed.courses : []
```

Exit criteria:

- Refresh preserves courses
- Student ownership filtering works
- Old localStorage without `courses` still loads

Rollback:

- Remove course fields/API while leaving old state intact

### Step 3 — Build Add/Edit Course page

Depends on: Step 2

Tasks:

1. Add routes in `App.jsx`
2. Add `StudentCourseFormPage`
3. Add reusable `WeeklySessionEditor`
4. Validate required fields and weekly sessions
5. Add unsaved-change guard
6. Navigate back after Save
7. Reuse the existing design system; do not introduce a new palette/framework

Exit criteria:

- Student can add a course with multiple weekly sessions
- Edit route pre-fills data
- Invalid date/time ranges cannot be saved
- Back and Save return to schedule correctly
- Responsive at desktop and mobile sizes

Rollback:

- Remove the two routes and page/components; course data remains harmless

### Step 4 — Merge course occurrences into Student Schedule

Depends on: Steps 1–3

Tasks:

1. Add `+ Add course` button
2. Query occurrences for visible Day/Week/Month/range
3. Merge and sort courses with meetings
4. Render distinct `CourseEvent`
5. Add `CourseDetailsDialog` matching existing appointment dialog
6. Add Edit/Delete actions
7. Add legend for Course / Class meeting / 1:1

Exit criteria:

- Course appears on correct dates/times only
- Range picker includes course occurrences
- Clicking course opens full details
- Delete removes all future derived occurrences because the recurring rule is removed
- Meeting behavior is unchanged

Rollback:

- Remove course rendering/selectors; existing meeting timeline remains functional

### Step 5 — Normalize meeting time inputs

Depends on: Step 1

Can begin in parallel with Steps 3–4 if files do not overlap, but merge carefully because `TeacherSchedulePage` and `AppContext` are shared.

Tasks:

1. Replace free-text time entry with start/end time inputs
2. Migrate/parse legacy `time` values
3. Keep display compatibility
4. Reject end <= start

Exit criteria:

- New meetings always have normalized time
- Existing seeded meetings still render
- Conflict engine receives reliable HH:mm values

### Step 6 — Add Teacher Busy/Available preview

Depends on: Steps 1, 2, 5

Tasks:

1. Add availability preview to meeting composer
2. Compute based on intended attendee scope
3. Show counts for whole class
4. Add Busy/Available badge per student
5. Busy badge opens course detail popup
6. Add conflict warning before submit
7. Allow explicit override with reason

Exit criteria:

- A known overlapping course marks the student Busy
- Non-overlap marks Available
- Whole-class summary count is correct
- Teacher can inspect which course causes Busy
- Creating conflicting appointment requires acknowledgement

Rollback:

- Remove preview/override UI; meeting CRUD remains intact

### Step 7 — Add verification workflow and audit trail

Depends on: Steps 2 and 6

Tasks:

1. Display verification badge in teacher popup
2. Add teacher actions Verified / Needs review
3. Store actor, timestamp, note
4. Reset verified course after student edit
5. Display update timestamps to teacher

Exit criteria:

- Verification transitions follow allowed rules
- Audit event records previous/new status
- UI never labels a course Verified without verifier and timestamp

### Step 8 — Production backend gate

Depends on: stable prototype behavior

This step is mandatory before real multi-device use.

Tasks:

1. Select backend (existing institutional API preferred; otherwise Supabase/Firebase/custom API)
2. Add real user identity mapping
3. Move courses, meetings, verification, audit logs to shared storage
4. Enforce ownership/teacher access server-side
5. Add database constraints and indexes
6. Add optimistic UI/error recovery
7. Migrate or explicitly discard prototype localStorage data

Minimum tables/collections:

```text
users
course_schedules
course_sessions
meetings
meeting_attendees
course_verification_events
```

Exit criteria:

- Student enters course on one device; authorized teacher sees it on another
- Unauthorized users cannot fetch or edit another student's schedule
- Audit records are immutable to students

### Step 9 — QA and release documentation

Depends on: all selected scope steps

Tasks:

1. Add unit tests for recurrence/conflicts
2. Add component/integration tests for form and dialogs
3. Add end-to-end student→teacher scenario
4. Check keyboard focus, Escape, labels, contrast
5. Check desktop/mobile and timezone edge cases
6. Document prototype limitations or production readiness honestly

Verification baseline:

```powershell
npm run typecheck
npm run build
```

Add test commands once a runner is installed.

## 11. Dependency graph

```text
Step 0
  └─ Step 1
      ├─ Step 2
      │   ├─ Step 3 ─ Step 4
      │   ├─ Step 6 ─ Step 7
      │   └─ Step 8
      └─ Step 5 ─ Step 6

Step 4 + Step 7 + Step 8
  └─ Step 9
```

Parallel work that is reasonably safe:

- After Step 1: Step 3 UI skeleton and Step 5 meeting-time normalization can proceed separately
- After Step 2: Student course rendering and teacher verification UI can be designed separately, but shared context changes must be coordinated
- Pure utility tests can run parallel with page styling

Avoid parallel edits to:

- `AppContext.jsx`
- `StudentSchedulePage.jsx`
- `TeacherSchedulePage.jsx`
- the same blocks of `src/index.css`

## 12. Acceptance scenarios

### Scenario A — Add recurring course

Given student `65101000`
When they add Monday and Wednesday 09:00–10:30 between June 1 and September 30
Then occurrences appear only on those weekdays within the term

### Scenario B — Single-student conflict

Given that student has a Monday course 09:00–10:30
When teacher proposes Monday 10:00–11:00
Then student is Busy and popup shows the conflicting course

### Scenario C — No false overlap at boundary

Given course ends at 10:30
When meeting starts at 10:30
Then student is Available

### Scenario D — Whole-class warning

Given 7 of 40 students conflict
When teacher creates all-class meeting
Then summary shows 7 Busy / 33 Available and teacher can inspect each conflict

### Scenario E — Verification reset

Given a course is Verified
When student changes its schedule
Then status becomes Self-reported and an audit event is created

### Scenario F — Cross-device production check

Given a student saves from device A
When teacher loads from device B
Then the same schedule is visible only after the shared backend step is complete

## 13. Anti-patterns to avoid

- Do not generate and persist hundreds of weekly occurrence records
- Do not duplicate conflict logic inside React components
- Do not treat course name alone as proof of enrollment
- Do not claim localStorage is multi-user persistence
- Do not silently block teacher scheduling without explaining conflicts
- Do not let students set their own `verified` status
- Do not expose all students' schedules to other students
- Do not parse date-only strings through UTC in ways that shift dates
- Do not overwrite the current uncommitted schedule/shadcn work
- Do not run destructive git commands against the working tree

## 14. Recommended first prompt for Claude

```text
Read plans/course-availability-scheduling-handoff.md completely.
Inspect the current dirty working tree and preserve all existing changes.
Start with Step 0 and Step 1 only: checkpoint/review the current schedule work,
then implement and test the pure recurring-course occurrence and conflict engine.
Do not build UI or claim multi-user support yet. Run npm run typecheck and npm run build.
```

## 15. Definition of done for the complete product goal

The feature is complete only when:

- Student can CRUD recurring courses
- Student timeline renders courses and teacher appointments together
- Teacher sees accurate Busy/Available for intended attendees
- Teacher can inspect course details causing Busy
- Verification/audit rules work
- Cross-device data works through shared backend
- Authorization is server-enforced
- Recurrence/conflict tests pass
- Typecheck/build pass and responsive UI is verified
