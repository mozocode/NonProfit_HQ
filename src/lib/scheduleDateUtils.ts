/**
 * Local calendar helpers for schedule views (day / week boundaries as ISO strings for Firestore queries).
 */

export function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Start of local calendar day as ISO string (UTC instant of local midnight may shift — use for display grouping). */
export function localDayBounds(ymd: string): { startIso: string; endIso: string } {
  const [y, m, d] = ymd.split("-").map(Number);
  const start = new Date(y, m - 1, d, 0, 0, 0, 0);
  const end = new Date(y, m - 1, d, 23, 59, 59, 999);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

/** Sunday week start (matches weekly planning convention). */
export function weekStartFromDate(base: Date = new Date()): string {
  const x = new Date(base);
  x.setDate(x.getDate() - x.getDay());
  return toYmd(x);
}

export function addDaysYmd(ymd: string, delta: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return toYmd(dt);
}

export function weekDaysFromStart(weekStartYmd: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDaysYmd(weekStartYmd, i));
}

/** Sunday–Saturday inclusive, ISO bounds for querying `startAt`. */
export function weekRangeIsoBounds(weekStartYmd: string): { startIso: string; endIso: string } {
  const { startIso } = localDayBounds(weekStartYmd);
  const saturday = addDaysYmd(weekStartYmd, 6);
  const { endIso } = localDayBounds(saturday);
  return { startIso, endIso };
}

export function formatTimeRange(startIso: string, endIso: string): string {
  try {
    const a = new Date(startIso);
    const b = new Date(endIso);
    return `${a.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} – ${b.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
  } catch {
    return "";
  }
}

export function formatWeekdayShort(ymd: string): string {
  try {
    const [y, m, d] = ymd.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  } catch {
    return ymd;
  }
}

/** Build ISO from local date + "HH:MM". */
export function combineLocalDateAndTime(ymd: string, hm: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const [hh, mm] = hm.split(":").map((x) => parseInt(x, 10));
  return new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0).toISOString();
}

/** Local HH:MM from ISO instant (for editing). */
export function isoToLocalHm(iso: string): string {
  try {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch {
    return "09:00";
  }
}
