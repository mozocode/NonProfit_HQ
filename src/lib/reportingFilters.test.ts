import { describe, expect, it } from "vitest";

import {
  isoTimestampInRange,
  linkActiveInRange,
  reportingDayEnd,
  reportingDayStart,
} from "@/lib/reportingFilters";

describe("reportingFilters", () => {
  it("reportingDayStart and reportingDayEnd bracket calendar day in UTC", () => {
    const start = reportingDayStart("2025-06-01");
    const end = reportingDayEnd("2025-06-01");
    expect(start < end);
    expect(start.startsWith("2025-06-01")).toBe(true);
  });

  it("isoTimestampInRange is inclusive", () => {
    const a = "2025-01-01T12:00:00.000Z";
    const lo = "2025-01-01T00:00:00.000Z";
    const hi = "2025-01-31T23:59:59.999Z";
    expect(isoTimestampInRange(a, lo, hi)).toBe(true);
    expect(isoTimestampInRange("", lo, hi)).toBe(false);
  });

  it("linkActiveInRange detects overlap on YYYY-MM-DD strings", () => {
    expect(linkActiveInRange("2025-01-01", "2025-01-31", "2025-01-15", "2025-02-01")).toBe(true);
    expect(linkActiveInRange("2025-03-01", "2025-03-05", "2025-01-01", "2025-01-31")).toBe(false);
    expect(linkActiveInRange("2025-01-01", null, "2025-12-01", "2025-12-31")).toBe(true);
  });
});
