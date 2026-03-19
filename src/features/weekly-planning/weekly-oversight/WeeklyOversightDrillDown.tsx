"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { REPORT_CATEGORY_LABELS } from "@/lib/weeklyPlanningUtils";
import { ROUTES } from "@/constants";
import type { WeeklyOversightStaffRow } from "@/types/weeklyOversight";
import type { AgendaLineItem } from "@/types/domain";

function AgendaSection({ title, items }: { title: string; items: AgendaLineItem[] }) {
  return (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">—</p>
      ) : (
        <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-muted-foreground">
          {items.map((it) => (
            <li key={it.id}>
              <span className="text-foreground">{it.title || "(untitled)"}</span>
              {it.estimatedHours != null ? (
                <span className="ml-1 text-xs tabular-nums">(~{it.estimatedHours}h planned)</span>
              ) : null}
              {it.familyId ? (
                <>
                  {" "}
                  <Link className="text-xs font-medium text-primary underline" href={ROUTES.STAFF_FAMILY(it.familyId)}>
                    Family
                  </Link>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function WeeklyOversightDrillDown({ row }: { row: WeeklyOversightStaffRow }) {
  const a = row.agenda;
  const r = row.report;

  return (
    <div className="grid gap-6 p-4 md:grid-cols-2">
      <div className="space-y-4">
        <h4 className="text-sm font-semibold">Planned agenda</h4>
        {!a ? (
          <p className="text-sm text-muted-foreground">No agenda document for this week.</p>
        ) : (
          <div className="space-y-3">
            <AgendaSection title="Meetings" items={a.plannedMeetings} />
            <AgendaSection title="Family follow-ups" items={a.plannedFamilyFollowUps} />
            <AgendaSection title="Referrals" items={a.plannedReferrals} />
            <AgendaSection title="Admin tasks" items={a.plannedAdminTasks} />
            {a.notes ? <p className="text-sm text-muted-foreground">Notes: {a.notes}</p> : null}
          </div>
        )}
      </div>
      <div className="space-y-4">
        <h4 className="text-sm font-semibold">Reported activities</h4>
        {!r ? (
          <p className="text-sm text-muted-foreground">No report for this week.</p>
        ) : r.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity rows logged.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                  <TableHead>Family / case</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {r.items.map((it) => (
                  <TableRow key={it.itemId}>
                    <TableCell className="max-w-[220px]">
                      <p className="font-medium">{it.activityDescription || "—"}</p>
                      {it.notes ? <p className="text-xs text-muted-foreground">{it.notes}</p> : null}
                      {it.location ? <p className="text-xs text-muted-foreground">{it.location}</p> : null}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {REPORT_CATEGORY_LABELS[it.category] ?? it.category}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{it.hoursSpent}</TableCell>
                    <TableCell>
                      {it.familyId ? (
                        <Link className={buttonVariants({ variant: "link", size: "sm" })} href={ROUTES.STAFF_FAMILY(it.familyId)}>
                          Open family
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      <div className="md:col-span-2">
        <h4 className="mb-2 text-sm font-semibold">Open tasks due this week (assigned)</h4>
        {row.openTasksDueInWeek.length === 0 ? (
          <p className="text-sm text-muted-foreground">None.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {row.openTasksDueInWeek.map((t) => (
              <li key={t.taskId} className="flex flex-wrap items-baseline justify-between gap-2 rounded-md border bg-muted/20 px-3 py-2">
                <div>
                  <p className="font-medium">{t.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Due {t.dueDate ?? "—"}
                    {row.overdueTasksInWeek.some((x) => x.taskId === t.taskId) ? (
                      <span className="ml-2 font-semibold text-destructive">Overdue</span>
                    ) : null}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={ROUTES.STAFF_FAMILY(t.familyId)}>
                    Family
                  </Link>
                  <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={ROUTES.STAFF_TASK(t.taskId)}>
                    Task
                  </Link>
                  <Link
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                    href={ROUTES.STAFF_FAMILY_GOAL(t.familyId, t.goalId)}
                  >
                    Goal
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
