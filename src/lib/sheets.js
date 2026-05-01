const CACHE_TTL_MS = 5 * 60 * 1000;
const memCache = new Map();
const inflight = new Map();

export const SHEETS = {
  meditation: {
    id: "1Wr2Kjz7hiiGhi-VKzBMStnLHpgEgX1QQR44u-b1U70I",
    gid: "980632585",
  },
  journalTracking: {
    id: "14zKmkO3ZWHQU2f7FlC4DvtxV-n0-Hvib_OtbdskN5Fs",
    gid: "1114613242",
  },
};

function cacheKey(sheetId, gid) {
  return `tma_sheet_${sheetId}_${gid}`;
}

function readPersistent(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.t > CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writePersistent(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ t: Date.now(), data }));
  } catch {}
}

export async function fetchSheet(sheetId, gid, { force = false } = {}) {
  const k = cacheKey(sheetId, gid);

  if (!force) {
    const mem = memCache.get(k);
    if (mem && Date.now() - mem.t < CACHE_TTL_MS) return mem.data;
    const persisted = readPersistent(k);
    if (persisted) {
      memCache.set(k, { t: Date.now(), data: persisted });
      return persisted;
    }
    const pending = inflight.get(k);
    if (pending) return pending;
  }

  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&gid=${gid}`;
  const promise = (async () => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);
    const text = await res.text();
    const m = text.match(/setResponse\(([\s\S]*)\)/);
    if (!m) throw new Error("Unexpected gviz response shape");
    const json = JSON.parse(m[1]);
    const cols = (json.table.cols || []).map((c) => ({
      id: c.id,
      label: c.label || c.id || "",
      type: c.type,
    }));
    const rows = (json.table.rows || []).map((r) =>
      (r.c || []).map((cell) => (cell ? (cell.v ?? null) : null)),
    );
    const data = { cols, rows };
    memCache.set(k, { t: Date.now(), data });
    writePersistent(k, data);
    return data;
  })();

  inflight.set(k, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(k);
  }
}

export function clearSheetCache() {
  memCache.clear();
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith("tma_sheet_")) localStorage.removeItem(key);
  }
}
