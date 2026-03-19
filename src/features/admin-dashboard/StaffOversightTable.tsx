"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { StaffOversightRow } from "@/types/commandCenter";

function formatLastActive(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso.slice(0, 16);
  }
}

function reportBadge(status: StaffOversightRow["weeklyReportStatus"]): string {
  switch (status) {
    case "submitted":
      return "Submitted";
    case "draft":
      return "Draft";
    default:
      return "Missing";
  }
}

function agendaBadge(status: StaffOversightRow["weeklyAgendaStatus"]): string {
  return status === "present" ? "On file" : "Missing";
}

export function StaffOversightTable({ rows }: { rows: StaffOversightRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Staff oversight</CardTitle>
        <CardDescription>
          Open goal tasks assigned to each staff member (filtered families), overdue prompts, and this week’s agenda &
          report (week starts Sunday).
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff</TableHead>
              <TableHead>Last activity</TableHead>
              <TableHead className="text-right">Open tasks</TableHead>
              <TableHead className="text-right">Overdue prompts</TableHead>
              <TableHead>Weekly report</TableHead>
              <TableHead>Weekly agenda</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No active staff or admin accounts in this organization.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.staffUid}>
                  <TableCell>
                    <div className="font-medium">{row.displayName}</div>
                    {row.email ? <div className="text-xs text-muted-foreground">{row.email}</div> : null}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatLastActive(row.lastActiveAt)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{row.tasksDueCount}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.overduePromptsCount}</TableCell>
                  <TableCell className="text-sm">{reportBadge(row.weeklyReportStatus)}</TableCell>
                  <TableCell className="text-sm">{agendaBadge(row.weeklyAgendaStatus)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
