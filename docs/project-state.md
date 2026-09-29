# TMA Dashboard — Current Project State

Last updated: 2026-09-29

This file is the short handoff for a new agent session. Keep it concise and update it
after a feature changes the current state. Do not turn it into a full session diary;
Git history is the source for detailed historical changes.

## Read order for a new session

1. `AGENTS.md` — user workflow and token-saving preferences
2. This file — current status, limitations, and next decisions
3. `README.md` — architecture, routes, and development commands
4. `git status` and recent `git log`

Repository: `C:\Users\Asus\Documents\Tma-dashboard`

## Product goal

The dashboard supports course 955110. Students see announcements, tasks, meetings,
consistency data, and their personal schedule. Teachers manage announcements and
appointments and can inspect whether students are Busy or Available before scheduling
the whole class or selected students.

## Current implementation

The current application is a frontend prototype using React 18, Vite 5, React Router,
Tailwind CSS, shadcn-compatible UI components, TypeScript checking with incremental
JavaScript support, and `localStorage` persistence.

Implemented scheduling workflow:

- Students can add, edit, and delete recurring courses.
- A course supports a date range and multiple weekly day/time sessions.
- Student Schedule renders course occurrences and teacher meetings on the same timeline.
- Calendar controls can select a day or date range.
- Schedule events open detail dialogs; compact events hide secondary information when
  there is not enough visual space.
- Teachers see per-student Busy/Available status before saving an appointment.
- Busy details show the overlapping course or meeting.
- Conflict calculation covers recurring occurrences and boundary-time cases.
- Teachers can mark schedule verification status and override a Busy warning only with
  an explicit reason; audit entries are retained in prototype data.

Programme structure (the dashboard is built for this programme first): Pre-school
(Apr–May 2025), Y1 Sem 1 (Jun–Oct 2025), Y1 Sem 2 (Nov 2025–Mar 2026), Summer 1
(Apr–May 2026), Y2 Sem 1 (Jun–Sep 2026), Y2 Sem 2 (Oct–Nov 2026, last study term), then
a 16-month internship. Term dates live in `src/features/schedule/lib/academic-terms.ts`.

- `/student/schedule/courses` (My courses) lists registered courses grouped by term on a
  programme timeline; courses are assigned to the term they overlap most.
- Students can import courses from an `.ics` file (weekly rules and hand-added single
  days); re-importing replaces saved self-reported courses of the same code/name.
- Month view in Student Schedule is a calendar grid with a selected-day panel.

The frontend was restructured into feature-first folders:

- `src/app` — application routing, initial data, and providers
- `src/features` — feature pages, components, hooks, and schedule domain logic
- `src/shared/layout` — shared role layouts and sidebars
- `src/components/ui` — shadcn-compatible primitives
- `src/styles` — CSS split by feature; `src/index.css` only controls import order
- `src/assets/images` — imported application images

`AppContext` is now a composition layer. Authentication, sheet data, announcements,
meetings, and course scheduling are separated into focused hooks.

## Verification baseline

At the latest completed feature/refactor baseline:

- `npm run typecheck` passes.
- `npm test` passes: 4 test files, 25 tests.
- `npm run build` passes.
- GitHub Actions runs typecheck, tests, and build.
- The production build has a non-blocking warning because the main JavaScript chunk is
  slightly larger than 500 kB. Route-level lazy loading is a future optimization.
- Browser/Chrome automation was intentionally not used; the user prefers to perform
  visual checks or provide focused screenshots.

Relevant recent commits:

- `aff2222` — pure recurrence and conflict engine
- `b3a5b41` — course persistence and AppContext CRUD
- `411e510` — recurring courses and teacher availability
- `33c993d` — feature-first frontend restructure
- `098cc31` — CI workflow for typecheck, tests, and build
- `3357a8d` — agent working preferences

## Production limitations

- `localStorage` works only in the same browser profile. A teacher on another device
  cannot see a student's schedule.
- Login and role guards are client-side mock behavior, not secure authentication.
- The server does not yet enforce student ownership, class membership, or teacher scope.
- Course verification and audit history are prototype data and can be edited locally.

Do not describe the availability workflow as multi-device or production-ready until a
shared authenticated backend and server-side authorization exist.

## Next major decision

The next production milestone is backend integration. Before implementation, confirm
the backend choice and design:

1. Authentication for students and teachers
2. Classes/sections and membership
3. Courses and recurring weekly sessions
4. Meetings and attendee snapshots
5. Server-side authorization and audit history
6. Optional realtime synchronization

Do not begin a backend migration merely because an older memory file says Supabase is
next; confirm the current priority with the user first.

## Working rules

- Work on one small coherent feature at a time and prefer several focused commits.
- Ask before committing unless the current user request explicitly authorizes it.
- Do not launch Chrome/browser automation unless the user explicitly requests it.
- Preserve unrelated user changes and check `git status` before editing or committing.
- Update this file only when the current project state or next major decision changes.

## Scheduling source of truth

The implemented scheduling rules live beside the feature under
`src/features/schedule`. Treat the domain utilities and their tests as the exact source
for recurrence, validation, date handling, and conflict behavior. Use Git history when
historical implementation details are needed.
