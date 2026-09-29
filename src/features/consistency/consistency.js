// gviz Date strings look like "Date(2026,2,12,4,45,49)" — month is 0-indexed.
function parseGvizDate(v) {
  if (v == null) return null;
  if (v instanceof Date) return v;
  if (typeof v === "string") {
    const m = v.match(/^Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),(\d+))?/);
    if (m) {
      return new Date(+m[1], +m[2], +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
    }
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function rowMatchesStudent(label, studentId) {
  if (!label || !studentId) return false;
  return String(label).includes(String(studentId).trim());
}

// ===== Meditation sheet (timestamp / name / status) =====
// Returns Set of dateKeys when student submitted (any answer counts).
export function meditationSubmittedDays(sheet, studentId) {
  const set = new Set();
  if (!sheet || !sheet.rows) return set;
  for (const row of sheet.rows) {
    if (!rowMatchesStudent(row[1], studentId)) continue;
    const d = parseGvizDate(row[0]);
    if (d) set.add(dateKey(d));
  }
  return set;
}

// Streak series: walks day-by-day from first submission (or today-N) through today.
// streak resets to 0 when a day is missed.
export function meditationStreakSeries(sheet, studentId, days = 14) {
  const submitted = meditationSubmittedDays(sheet, studentId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (submitted.size === 0) {
    const out = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      out.push({ key: dateKey(d), date: new Date(d), streak: 0 });
    }
    return out;
  }

  const sortedKeys = [...submitted].sort();
  const startD = new Date(sortedKeys[0] + "T00:00:00");

  const all = [];
  let streak = 0;
  for (let d = new Date(startD); d <= today; d.setDate(d.getDate() + 1)) {
    const k = dateKey(d);
    if (submitted.has(k)) streak += 1;
    else streak = 0;
    all.push({ key: k, date: new Date(d), streak });
  }
  return all.slice(-days);
}

export function currentMeditationStreak(sheet, studentId) {
  const series = meditationStreakSeries(sheet, studentId, 365);
  return series.length ? series[series.length - 1].streak : 0;
}

// ===== Journal tracking matrix (rows = students, cols = dates) =====
// Cell encoding: "/" = 1 submission, "//" = 2, ... empty = none, "หยุด" = holiday (skip).
function findStudentRow(sheet, studentId) {
  if (!sheet || !sheet.rows) return null;
  return sheet.rows.find((r) => rowMatchesStudent(r[0], studentId)) || null;
}

function isDateColumn(col) {
  if (!col) return false;
  if (col.type === "date") return true;
  if (col.label && /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(col.label)) return true;
  return false;
}

function parseColLabelDate(label) {
  if (!label) return null;
  const m = label.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!m) return null;
  let [, dd, mm, yyyy] = m;
  if (yyyy.length === 2) yyyy = "20" + yyyy;
  return new Date(+yyyy, +mm - 1, +dd);
}

function countSlashes(v) {
  if (!v || typeof v !== "string") return 0;
  if (v.trim() === "หยุด") return 0;
  return (v.match(/\//g) || []).length;
}

function isHoliday(v) {
  return typeof v === "string" && v.trim() === "หยุด";
}

// Returns last `days` columns for the student as
//   [{key, date, count, holiday}]
export function journalDailySeries(sheet, studentId, days = 7) {
  const row = findStudentRow(sheet, studentId);
  const dateCols = [];
  if (sheet?.cols) {
    for (let i = 1; i < sheet.cols.length; i++) {
      if (isDateColumn(sheet.cols[i])) dateCols.push(i);
    }
  }
  // Take last `days` date columns
  const lastN = dateCols.slice(-days);
  return lastN.map((i) => {
    const v = row ? row[i] : null;
    const colLabel = sheet.cols[i].label;
    const d = parseColLabelDate(colLabel) || new Date();
    return {
      key: dateKey(d),
      date: d,
      count: countSlashes(v),
      holiday: isHoliday(v),
    };
  });
}

// Streak of consecutive non-holiday days with at least one "/" ending at the latest filled column.
export function journalStreak(sheet, studentId) {
  const row = findStudentRow(sheet, studentId);
  if (!row || !sheet.cols) return 0;
  const dateCols = [];
  for (let i = 1; i < sheet.cols.length; i++) {
    if (isDateColumn(sheet.cols[i])) dateCols.push(i);
  }
  let streak = 0;
  for (let i = dateCols.length - 1; i >= 0; i--) {
    const v = row[dateCols[i]];
    if (isHoliday(v)) continue;
    if (countSlashes(v) > 0) streak += 1;
    else break;
  }
  return streak;
}

export function journalTotalSubmissions(sheet, studentId) {
  const row = findStudentRow(sheet, studentId);
  if (!row || !sheet.cols) return 0;
  let total = 0;
  for (let i = 1; i < sheet.cols.length; i++) {
    if (isDateColumn(sheet.cols[i])) total += countSlashes(row[i]);
  }
  return total;
}

// Aggregate stats for a student across both sheets, given pre-fetched data.
export function buildStudentStats({ medSheet, journalSheet, studentId }) {
  return {
    meditation: {
      submittedDays: meditationSubmittedDays(medSheet, studentId),
      streak: currentMeditationStreak(medSheet, studentId),
      series14: meditationStreakSeries(medSheet, studentId, 14),
      series30: meditationStreakSeries(medSheet, studentId, 30),
    },
    journal: {
      streak: journalStreak(journalSheet, studentId),
      total: journalTotalSubmissions(journalSheet, studentId),
      week: journalDailySeries(journalSheet, studentId, 7),
      last30: journalDailySeries(journalSheet, studentId, 30),
    },
  };
}
