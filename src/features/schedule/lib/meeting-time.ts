// Time-of-day helpers. All times are "HH:mm" 24h local strings (Asia/Bangkok).

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const MINUTE_GRANULARITY = 5;

export function isValidTimeString(value: unknown): value is string {
  return typeof value === "string" && TIME_RE.test(value);
}

export function timeToMinutes(time: string): number {
  if (!isValidTimeString(time)) {
    throw new Error(`Invalid HH:mm time string: ${String(time)}`);
  }
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, Math.round(totalMinutes)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function isOnGranularity(time: string, granularity: number = MINUTE_GRANULARITY): boolean {
  if (!isValidTimeString(time)) return false;
  return timeToMinutes(time) % granularity === 0;
}

// Legacy meetings stored a free-text time such as "09:00 - 12:00 น." or
// "9:00-12:00". Returns null (never a guessed range) when the string can't
// be parsed with confidence — callers must show "Availability unknown" and
// require the user to fix the time rather than assuming Available.
export function parseLegacyMeetingTime(time: string): { startTime: string; endTime: string } | null {
  if (typeof time !== "string") return null;
  const match = time.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const [, sh, sm, eh, em] = match;
  const startTime = `${sh.padStart(2, "0")}:${sm}`;
  const endTime = `${eh.padStart(2, "0")}:${em}`;
  if (!isValidTimeString(startTime) || !isValidTimeString(endTime)) return null;
  if (timeToMinutes(endTime) <= timeToMinutes(startTime)) return null;
  return { startTime, endTime };
}
