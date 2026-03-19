"use client";

import { PageHeader } from "@/components/ui/page-header";
import { StaffWeeklyAgendaPageView } from "@/features/weekly-planning/StaffWeeklyAgendaPageView";

export default function StaffAgendaPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Weekly agenda" description="Plan your week, save drafts, and submit before the deadline." />
      <StaffWeeklyAgendaPageView />
    </div>
  );
}
