/**
 * Pure date / segment helpers for admin reporting (Phase 23 — testable extraction).
 */

export function reportingDayStart(isoDate: string): string {
  const d = new Date(isoDate + "T00:00:00.000Z");
  return d.toISOString();
}

export function reportingDayEnd(isoDate: string): string {
  const d = new Date(isoDate + "T23:59:59.999Z");
  return d.toISOString();
}

/** Inclusive range check on ISO timestamp strings. */
export function isoTimestampInRange(iso: string, start: string, end: string): boolean {
  if (!iso) return false;
  return iso >= start && iso <= end;
}

/**
 * Whether a school/partner link period overlaps the reporting range (inclusive YYYY-MM-DD semantics).
 */
export function linkActiveInRange(
  periodStart: string,
  periodEnd: string | null,
  rangeStart: string,
  rangeEnd: string,
): boolean {
  const end = periodEnd ?? "9999-12-31";
  return periodStart <= rangeEnd && end >= rangeStart;
}
