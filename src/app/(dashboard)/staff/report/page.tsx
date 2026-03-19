"use client";

import { PageHeader } from "@/components/ui/page-header";
import { StaffWeeklyReportPageView } from "@/features/weekly-planning/StaffWeeklyReportPageView";

export default function StaffReportPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Weekly report" description="Log completed work, hours, and context — then submit." />
      <StaffWeeklyReportPageView />
    </div>
  );
}
