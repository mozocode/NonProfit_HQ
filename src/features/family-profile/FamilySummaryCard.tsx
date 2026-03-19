"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusChip } from "@/components/ui/status-chip";
import type { FamilyProfileSummary } from "@/types/familyProfile";
import { cn } from "@/lib/utils";

export interface FamilySummaryCardProps {
  summary: FamilyProfileSummary;
  className?: string;
}

export function FamilySummaryCard({ summary, className }: FamilySummaryCardProps) {
  const statusMap = summary.status === "active" ? "active" : summary.status === "archived" ? "inactive" : "pending";
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-foreground">Family summary</h2>
          <StatusChip status={statusMap} label={summary.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <span className="text-muted-foreground">Primary contact</span>
            <p className="font-medium text-foreground">{summary.primaryContactName}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Household</span>
            <p className="font-medium text-foreground">{summary.memberCount} member{summary.memberCount !== 1 ? "s" : ""}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Workflow stage</span>
            <p className="font-medium text-foreground capitalize">{summary.workflowStage}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Assigned staff</span>
            <p className="font-medium text-foreground">
              {summary.assignedStaffNames.length > 0 ? summary.assignedStaffNames.join(", ") : "—"}
            </p>
          </div>
        </div>
        {summary.servicesActive.length > 0 ? (
          <div>
            <span className="text-muted-foreground">Services active</span>
            <p className="font-medium text-foreground">{summary.servicesActive.join(", ")}</p>
          </div>
        ) : null}
        {summary.demographics && Object.keys(summary.demographics).length > 0 ? (
          <div>
            <span className="text-muted-foreground">Demographics</span>
            <ul className="mt-1 list-inside list-disc text-foreground">
              {summary.demographics.preferredLanguage ? (
                <li>Preferred language: {summary.demographics.preferredLanguage}</li>
              ) : null}
              {summary.demographics.householdSize != null ? (
                <li>Household size: {summary.demographics.householdSize}</li>
              ) : null}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
