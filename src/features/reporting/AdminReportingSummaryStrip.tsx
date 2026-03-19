"use client";

import Link from "next/link";
import { useMemo } from "react";
import { BarChart3 } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants";
import { useAdminReporting, defaultReportingDateRange } from "@/hooks/useAdminReporting";
import { EMPTY_REPORTING_SEGMENTS } from "@/types/reporting";

/**
 * Lightweight headline metrics on the admin command center (last 30 days, org-wide).
 */
export function AdminReportingSummaryStrip() {
  const range = useMemo(() => defaultReportingDateRange(30), []);
  const { snapshot, isLoading } = useAdminReporting(range, EMPTY_REPORTING_SEGMENTS);

  if (isLoading && !snapshot) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <CardDescription>Loading…</CardDescription>
              <CardTitle className="text-2xl">—</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (!snapshot) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Snapshot: last 30 days (organization-wide). Open reporting for date range, filters, and exports.
        </p>
        <Link className={buttonVariants({ variant: "default", size: "sm" })} href={ROUTES.ADMIN_REPORTING}>
          <BarChart3 className="mr-2 size-4" />
          Full reporting
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Families served", value: snapshot.totalFamiliesServed },
          { label: "Participants served", value: snapshot.totalParticipantsServed },
          { label: "Active cases", value: snapshot.activeCases },
          { label: "Overdue follow-ups", value: snapshot.overdueFollowUps },
        ].map((m) => (
          <Card key={m.label}>
            <CardHeader className="pb-3">
              <CardDescription>{m.label}</CardDescription>
              <CardTitle className="text-2xl tabular-nums">{m.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
