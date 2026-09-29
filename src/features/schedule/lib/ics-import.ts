import { addDays, compareDates, eachDateInInterval, getWeekdayOfDate } from "./date";
import { timeToMinutes } from "./meeting-time";
import { validateCourseSchedule } from "./validation";
import type { CourseException, WeeklySession } from "./types";

// iCalendar (.ics) import. Two kinds of events become courses:
//  - weekly rules (FREQ=WEEKLY, or DAILY limited by BYDAY), and
//  - single events added by hand one day at a time. Those are grouped by
//    course code (or normalised title) and weekday/time; the weekdays that
//    are missing between the first and last date become cancelled dates, so
//    the course shows exactly the days that were in the calendar.
// All times are converted to Asia/Bangkok (fixed UTC+7).

const BANGKOK_OFFSET_MIN = 7 * 60;
const BANGKOK_TZID = "Asia/Bangkok";
const OPEN_ENDED_WEEKS = 52; // RRULE without UNTIL/COUNT
const COLORS = ["#2563eb", "#db2777", "#d97706", "#7c3aed", "#059669", "#dc2626", "#0891b2"];
const DAY_CODES = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

export interface ImportedSession extends Omit<WeeklySession, "id"> {}

export interface ImportedCourse {
  key: string; // unique per imported entry
  dupKey: string; // matches an already-saved course of the same name/code
  oneTime: boolean; // only one date in the file (e.g. an exam)
  courseCode: string;
  courseName: string;
  termStart: string;
  termEnd: string;
  color: string;
  defaultLocation: string;
  notes: string;
  sessions: ImportedSession[];
  exceptions: CourseException[];
  openEnded: boolean;
}

export interface IcsImportResult {
  courses: ImportedCourse[];
  skipped: { unsupported: number; invalid: number };
}

interface Property {
  name: string;
  params: Record<string, string>;
  value: string;
}

interface RawEvent {
  props: Property[];
}

interface LocalDateTime {
  date: string; // YYYY-MM-DD, Bangkok
  time: string; // HH:mm, Bangkok
  allDay: boolean;
}

export function unfold(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n[ \t]/g, "")
    .split("\n")
    .filter((line) => line.length > 0);
}

function unescapeText(value: string): string {
  return value.replace(/\\n/gi, "\n").replace(/\\([,;\\])/g, "$1");
}

function parseProperty(line: string): Property | null {
  // name[;param=value]*:value — colons inside quoted params are rare; handle quotes anyway.
  let inQuotes = false;
  let colon = -1;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === ":" && !inQuotes) {
      colon = i;
      break;
    }
  }
  if (colon < 0) return null;
  const [name, ...rawParams] = line.slice(0, colon).split(";");
  const params: Record<string, string> = {};
  for (const raw of rawParams) {
    const eq = raw.indexOf("=");
    if (eq > 0) params[raw.slice(0, eq).toUpperCase()] = raw.slice(eq + 1).replace(/"/g, "");
  }
  return { name: name.toUpperCase(), params, value: line.slice(colon + 1) };
}

function parseEvents(text: string): RawEvent[] {
  const events: RawEvent[] = [];
  let current: RawEvent | null = null;
  for (const line of unfold(text)) {
    if (line === "BEGIN:VEVENT") current = { props: [] };
    else if (line === "END:VEVENT") {
      if (current) events.push(current);
      current = null;
    } else if (current) {
      const prop = parseProperty(line);
      if (prop) current.props.push(prop);
    }
  }
  return events;
}

const first = (event: RawEvent, name: string) => event.props.find((p) => p.name === name);
const all = (event: RawEvent, name: string) => event.props.filter((p) => p.name === name);

// Offset (minutes east of UTC) of an IANA zone at a given instant.
function zoneOffsetMinutes(tzid: string, at: Date): number | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tzid,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    }).formatToParts(at);
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
    const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
    return Math.round((asUtc - at.getTime()) / 60000);
  } catch {
    return null; // unknown TZID
  }
}

function fromUtcMs(ms: number): LocalDateTime {
  const d = new Date(ms + BANGKOK_OFFSET_MIN * 60000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
    time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`,
    allDay: false,
  };
}

export function parseDateTime(prop: Property): LocalDateTime | null {
  const match = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(prop.value.trim());
  if (!match) return null;
  const [, y, mo, d, hh, mm, , z] = match;
  const date = `${y}-${mo}-${d}`;
  if (hh === undefined) return { date, time: "00:00", allDay: true };

  const localMs = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(hh), Number(mm));
  const tzid = prop.params.TZID;

  let utcMs: number;
  if (z) {
    utcMs = localMs;
  } else if (!tzid || tzid === BANGKOK_TZID) {
    utcMs = localMs - BANGKOK_OFFSET_MIN * 60000; // floating time is read as Bangkok local
  } else {
    const offset = zoneOffsetMinutes(tzid, new Date(localMs));
    // Unknown zone: assume Bangkok rather than dropping the event.
    utcMs = localMs - (offset ?? BANGKOK_OFFSET_MIN) * 60000;
  }
  return fromUtcMs(utcMs);
}

function parseRrule(value: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of value.split(";")) {
    const [k, v] = part.split("=");
    if (k && v !== undefined) out[k.toUpperCase()] = v;
  }
  return out;
}

const EXAM_RE = /mid\s?term|final|exam|สอบ/i;
const TAG_RE = /^\s*[([][^)\]]*[)\]]\s*/;
const CODE_RE = /\b\d{5,6}\b/;

function tidy(value: string): string {
  return value
    .replace(/\(\s*sec(?:tion)?\.?\s*\d*\s*\)/gi, "")
    .replace(/\(\s*\)|\[\s*\]/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s\-–:]+|[\s\-–:]+$/g, "");
}

// Groups events of the same course: tag ("Lec"/"Lab") + code + normalised title
// (title matters because two subjects can share one code).
function identify(summary: string) {
  const code = CODE_RE.exec(summary)?.[0] ?? null;
  const tag = (TAG_RE.exec(summary)?.[0] ?? "").toLowerCase().replace(/[\s()[\]]/g, "");
  const body = summary.replace(TAG_RE, "");
  const withoutCode = code ? summary.replace(code, "") : summary;
  const courseName = tidy(withoutCode) || summary.trim();

  const title = tidy(
    body
      .toLowerCase()
      .replace(CODE_RE, "")
      .replace(/\(\s*sec(?:tion)?\.?\s*\d*\s*\)|\bsec(?:tion)?\.?\s*\d+\b/g, "")
      .replace(/\((?:mon|tue|wed|thu|fri|sat|sun)[a-z]*\)/g, "")
      .replace(/\s*-\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*$/g, "")
  );

  const key = EXAM_RE.test(summary) ? `exam|${summary.trim().toLowerCase()}` : `${tag}|${code ?? ""}|${title}`;
  const dupKey = (code ? `${code} ${courseName}` : courseName).toLowerCase();
  return { key, code: code ?? "IMPORT", courseName, dupKey };
}

function dateOfUntil(rrule: Record<string, string>): string | null {
  const until = rrule.UNTIL;
  if (!until) return null;
  const p = parseDateTime({ name: "UNTIL", params: {}, value: until });
  return p?.date ?? null;
}

interface Slot {
  weekday: number;
  start: string;
  end: string;
  location: string;
  dates: string[]; // every day this weekday/time happens (rules are expanded)
  from: string;
  to: string;
  uids: string[];
  openEnded: boolean;
}

interface Replacement {
  date: string;
  startTime: string;
  endTime: string;
  location: string;
}

interface Bucket {
  slots: Slot[];
  replacements: Replacement[];
}

interface Candidate {
  code: string;
  courseName: string;
  dupKey: string;
  description: string;
  slots: Slot[];
}

function firstOnOrAfter(date: string, weekday: number): string {
  return addDays(date, (weekday - getWeekdayOfDate(date) + 7) % 7);
}

function mostCommon(values: string[]): string {
  const counts = new Map<string, number>();
  for (const v of values) if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}

// Put slots of one course into buckets; a bucket becomes one course and can
// hold at most one slot per weekday (cancellations are per date, not per slot).
function bucketize(slots: Slot[]): Bucket[] {
  const sorted = [...slots].sort((a, b) => b.dates.length - a.dates.length || compareDates(a.from, b.from));
  const buckets: Bucket[] = [];

  for (const slot of sorted) {
    const free = buckets.find((b) => !b.slots.some((s) => s.weekday === slot.weekday));
    if (free) {
      free.slots.push(slot);
      continue;
    }

    // Same weekday, different time, only 1-2 days: treat as a moved class.
    const host = buckets.find((b) =>
      b.slots.some((s) => s.weekday === slot.weekday && s.dates.length >= slot.dates.length)
    );
    if (host && slot.dates.length <= 2) {
      for (const date of slot.dates) {
        host.replacements.push({ date, startTime: slot.start, endTime: slot.end, location: slot.location });
      }
      continue;
    }
    buckets.push({ slots: [slot], replacements: [] });
  }
  return buckets;
}

export function parseIcs(text: string): IcsImportResult {
  const events = parseEvents(text);
  const skipped = { unsupported: 0, invalid: 0 };
  const candidates = new Map<string, Candidate>();
  const overrides: { uid: string; date: string; startTime: string; endTime: string; location: string }[] = [];
  const singles = new Map<string, {
    key: string; weekday: number; start: string; end: string;
    dates: string[]; locations: string[]; uids: string[]; openEnded: boolean;
  }>();
  const addToSlot = (
    key: string, weekday: number, start: string, end: string,
    dates: string[], location: string, uid: string, openEnded: boolean
  ) => {
    const slotKey = `${key}|${weekday}|${start}|${end}`;
    const entry = singles.get(slotKey) ?? { key, weekday, start, end, dates: [], locations: [], uids: [], openEnded: false };
    for (const date of dates) if (!entry.dates.includes(date)) entry.dates.push(date);
    entry.locations.push(location);
    if (uid) entry.uids.push(uid);
    entry.openEnded = entry.openEnded || openEnded;
    singles.set(slotKey, entry);
  };

  const candidateFor = (summary: string, description: string) => {
    const id = identify(summary);
    let candidate = candidates.get(id.key);
    if (!candidate) {
      candidate = { code: id.code, courseName: id.courseName, dupKey: id.dupKey, description, slots: [] };
      candidates.set(id.key, candidate);
    }
    if (!candidate.description && description) candidate.description = description;
    return { id, candidate };
  };

  for (const event of events) {
    const dtstart = first(event, "DTSTART");
    const dtend = first(event, "DTEND");
    const summary = unescapeText(first(event, "SUMMARY")?.value ?? "").trim();
    const description = unescapeText(first(event, "DESCRIPTION")?.value ?? "");
    const location = unescapeText(first(event, "LOCATION")?.value ?? "");
    const start = dtstart ? parseDateTime(dtstart) : null;
    const end = dtend ? parseDateTime(dtend) : null;
    if (!start || !summary) {
      skipped.invalid += 1;
      continue;
    }

    const recurrenceId = first(event, "RECURRENCE-ID");
    if (recurrenceId) {
      const original = parseDateTime(recurrenceId);
      if (original && end && !start.allDay && start.date === end.date) {
        overrides.push({ uid: first(event, "UID")?.value ?? "", date: original.date, startTime: start.time, endTime: end.time, location });
      } else {
        skipped.unsupported += 1;
      }
      continue;
    }

    // Sessions are stored as same-day HH:mm ranges.
    if (start.allDay || !end || end.date !== start.date || timeToMinutes(end.time) <= timeToMinutes(start.time)) {
      skipped.invalid += 1;
      continue;
    }

    const rruleProp = first(event, "RRULE");
    if (!rruleProp) {
      const { id } = candidateFor(summary, description);
      addToSlot(id.key, getWeekdayOfDate(start.date), start.time, end.time, [start.date], location, "", false);
      continue;
    }

    const rrule = parseRrule(rruleProp.value);
    const interval = Number(rrule.INTERVAL ?? "1");
    const weeklyLike = rrule.FREQ === "WEEKLY" || (rrule.FREQ === "DAILY" && Boolean(rrule.BYDAY));
    if (!weeklyLike || interval !== 1) {
      skipped.unsupported += 1;
      continue;
    }

    const days = rrule.BYDAY
      ? rrule.BYDAY.split(",")
          .map((code) => DAY_CODES.indexOf(code.replace(/^[-+]?\d+/, "")))
          .filter((d) => d >= 0)
      : [getWeekdayOfDate(start.date)];
    if (days.length === 0) {
      skipped.unsupported += 1;
      continue;
    }

    const until = dateOfUntil(rrule);
    let lastDate: string;
    let openEnded = false;
    if (until) {
      lastDate = until;
    } else if (rrule.COUNT) {
      // Walk forward counting occurrences on the selected weekdays.
      let remaining = Number(rrule.COUNT);
      let cursor = start.date;
      lastDate = start.date;
      while (remaining > 0 && remaining < 5000) {
        if (days.includes(getWeekdayOfDate(cursor))) {
          remaining -= 1;
          lastDate = cursor;
        }
        cursor = addDays(cursor, 1);
      }
    } else {
      lastDate = addDays(start.date, OPEN_ENDED_WEEKS * 7);
      openEnded = true;
    }

    const exdates = all(event, "EXDATE").flatMap((prop) =>
      prop.value
        .split(",")
        .map((value) => parseDateTime({ ...prop, value })?.date)
        .filter((d): d is string => Boolean(d))
    );

    const { id } = candidateFor(summary, description);
    const uid = first(event, "UID")?.value ?? "";
    for (const weekday of days) {
      const from = firstOnOrAfter(start.date, weekday);
      const dates: string[] = [];
      for (let cursor = from; cursor <= lastDate; cursor = addDays(cursor, 7)) {
        if (!exdates.includes(cursor)) dates.push(cursor);
      }
      if (dates.length > 0) addToSlot(id.key, weekday, start.time, end.time, dates, location, uid, openEnded);
    }
  }

  for (const entry of singles.values()) {
    const dates = [...entry.dates].sort(compareDates);
    candidates.get(entry.key)?.slots.push({
      weekday: entry.weekday, start: entry.start, end: entry.end, location: mostCommon(entry.locations),
      dates, from: dates[0], to: dates[dates.length - 1], uids: entry.uids, openEnded: entry.openEnded,
    });
  }

  const courses: ImportedCourse[] = [];
  for (const [key, candidate] of candidates) {
    if (candidate.slots.length === 0) continue;

    bucketize(candidate.slots).forEach((bucket, index) => {
      const starts = [...bucket.slots.map((s) => s.from), ...bucket.replacements.map((r) => r.date)];
      const ends = [...bucket.slots.map((s) => s.to), ...bucket.replacements.map((r) => r.date)];
      const termStart = [...starts].sort(compareDates)[0];
      const termEnd = [...ends].sort(compareDates).reverse()[0];

      const replacementDates = new Set(bucket.replacements.map((r) => r.date));
      const isAllowed = (slot: Slot, date: string) => replacementDates.has(date) || slot.dates.includes(date);

      const exceptions: CourseException[] = [];
      let occurrences = 0;
      for (const date of eachDateInInterval({ start: termStart, end: termEnd })) {
        const slot = bucket.slots.find((s) => s.weekday === getWeekdayOfDate(date));
        if (!slot) continue;
        if (isAllowed(slot, date)) occurrences += 1;
        else exceptions.push({ id: `imp-x-${date}`, date, type: "cancelled", reason: "Not in imported calendar" });
      }

      for (const r of bucket.replacements) {
        exceptions.push({
          id: `imp-r-${r.date}`, date: r.date, type: "replacement",
          startTime: r.startTime, endTime: r.endTime, location: r.location,
          reason: "Different time in imported calendar",
        });
      }
      const taken = new Set(exceptions.map((e) => e.date));
      for (const slot of bucket.slots.filter((s) => s.uids.length > 0)) {
        for (const o of overrides.filter((ov) => slot.uids.includes(ov.uid))) {
          if (taken.has(o.date) || o.date < termStart || o.date > termEnd) continue;
          taken.add(o.date);
          exceptions.push({
            id: `imp-r-${o.date}`, date: o.date, type: "replacement",
            startTime: o.startTime, endTime: o.endTime, location: o.location,
            reason: "Changed in imported calendar",
          });
        }
      }

      const course: ImportedCourse = {
        key: `${key}#${index}`,
        dupKey: candidate.dupKey,
        oneTime: occurrences <= 1,
        courseCode: candidate.code,
        courseName: candidate.courseName,
        termStart,
        termEnd,
        color: COLORS[courses.length % COLORS.length],
        defaultLocation: mostCommon(bucket.slots.map((s) => s.location)),
        notes: candidate.description,
        sessions: bucket.slots.map((s) => ({
          dayOfWeek: s.weekday as WeeklySession["dayOfWeek"],
          startTime: s.start,
          endTime: s.end,
          location: s.location,
        })),
        exceptions,
        openEnded: bucket.slots.some((s) => s.openEnded),
      };

      if (validateCourseSchedule(course).valid) courses.push(course);
      else skipped.invalid += bucket.slots.length;
    });
  }

  return { courses, skipped };
}
