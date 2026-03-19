/**
 * Week boundaries and submission deadlines for weekly agenda / reports.
 * Week = Sunday (start) … Saturday (end), local calendar (matches existing staff mock).
 */

import type { WeeklySubmissionStatus } from "@/types/domain";

/** Days after weekEnd (Saturday) that draft can still be edited/submitted. */
export const WEEKLY_SUBMISSION_GRACE_DAYS = 3;

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function weekEndFromWeekStart(weekStartIsoDate: string): string {
  const [y, m, d] = weekStartIsoDate.split("-").map(Number);
  const local = new Date(y, m - 1, d);
  local.setDate(local.getDate() + 6);
  return toYmd(local);
}

export function weekStartFromDate(d: Date = new Date()): string {
  const x = new Date(d);
  x.setDate(x.getDate() - x.getDay());
  return x.toISOString().slice(0, 10);
}

export function computeSubmissionDueAt(weekEndIsoDate: string): string {
  const [y, m, d] = weekEndIsoDate.split("-").map(Number);
  const local = new Date(y, m - 1, d + WEEKLY_SUBMISSION_GRACE_DAYS, 23, 59, 59, 999);
  return local.toISOString();
}

export function agendaDocId(organizationId: string, staffUid: string, weekStart: string): string {
  return `ag_${organizationId}_${staffUid}_${weekStart}`.replace(/[/\\]/g, "_");
}

export function reportDocId(organizationId: string, staffUid: string, weekStart: string): string {
  return `rp_${organizationId}_${staffUid}_${weekStart}`.replace(/[/\\]/g, "_");
}

export function resolveWeeklyDisplayStatus(
  stored: WeeklySubmissionStatus,
  submissionDueAt: string,
  nowIso: string = new Date().toISOString(),
): WeeklySubmissionStatus {
  if (stored === "reviewed" || stored === "submitted") return stored;
  if (stored === "overdue") return "overdue";
  if (stored === "draft" && submissionDueAt && nowIso > submissionDueAt) return "overdue";
  return "draft";
}

export function canEditWeeklySubmission(
  stored: WeeklySubmissionStatus,
  submissionDueAt: string,
  nowIso: string = new Date().toISOString(),
): boolean {
  if (stored === "submitted" || stored === "reviewed") return false;
  if (nowIso > submissionDueAt) return false;
  return true;
}

export function recentWeekStarts(count: number, anchor: Date = new Date()): string[] {
  const out: string[] = [];
  let ws = weekStartFromDate(anchor);
  for (let i = 0; i < count; i++) {
    out.push(ws);
    const [y, m, d] = ws.split("-").map(Number);
    const local = new Date(y, m - 1, d);
    local.setDate(local.getDate() - 7);
    ws = toYmd(local);
  }
  return out;
}

export function formatWeekLabel(weekStart: string, weekEnd: string): string {
  try {
    const a = new Date(weekStart + "T12:00:00.000Z");
    const b = new Date(weekEnd + "T12:00:00.000Z");
    return `${a.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${b.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
  } catch {
    return `${weekStart} – ${weekEnd}`;
  }
}

export const REPORT_CATEGORY_LABELS: Record<string, string> = {
  meeting: "Meeting",
  family_follow_up: "Family follow-up",
  referral: "Referral",
  admin: "Admin",
  travel: "Travel",
  other: "Other",
};
