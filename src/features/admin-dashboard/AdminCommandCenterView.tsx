"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  ClipboardList,
  FileWarning,
  Loader2,
  RefreshCw,
  Share2,
  UserCircle,
  Users,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Section } from "@/components/ui/section";
import { useAuth } from "@/hooks/useAuth";
import {
  defaultCommandCenterRange,
  useAdminCommandCenter,
  useCommandCenterFilterOptions,
} from "@/hooks/useAdminCommandCenter";
import { ROUTES } from "@/constants";
import { EMPTY_COMMAND_CENTER_FILTERS, type CommandCenterFilters } from "@/types/commandCenter";
import { AdminCommandCenterFilters } from "@/features/admin-dashboard/AdminCommandCenterFilters";
import { ActivityFeedCard } from "@/features/admin-dashboard/ActivityFeedList";
import { AdminQuickLinks } from "@/features/admin-dashboard/AdminQuickLinks";
import { MetricStatCard } from "@/features/admin-dashboard/MetricStatCard";
import { StaffOversightTable } from "@/features/admin-dashboard/StaffOversightTable";

export function AdminCommandCenterView() {
  const { orgId } = useAuth();
  const [range, setRange] = useState(() => defaultCommandCenterRange(30));
  const [filters, setFilters] = useState<CommandCenterFilters>({ ...EMPTY_COMMAND_CENTER_FILTERS });

  const { schools, partners, programs, isLoading: optionsLoading } = useCommandCenterFilterOptions();
  const { data, isLoading, error, refetch } = useAdminCommandCenter(range, filters);

  if (!orgId) {
    return (
      <EmptyState
        title="No organization"
        description="Sign in with an admin account that belongs to an organization."
      />
    );
  }

  if (isLoading && !data) {
    return <LoadingState message="Loading command center…" />;
  }

  if (error && !data) {
    return (
      <EmptyState
        title="Could not load dashboard"
        description={error.message}
        action={
          <Button type="button" onClick={() => void refetch()}>
            <RefreshCw className="mr-2 size-4" />
            Retry
          </Button>
        }
      />
    );
  }

  if (!data) {
    return <EmptyState title="No data" description="Try again or adjust filters." />;
  }

  const { overview } = data;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={ROUTES.ADMIN_TOOLS}>
            Admin tools
          </Link>
          <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={ROUTES.ADMIN_REPORTING}>
            Reporting & analytics
          </Link>
          <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={ROUTES.ADMIN_SURVEYS}>
            Surveys
          </Link>
        </div>
        <Button type="button" variant="outline" size="sm" disabled={isLoading} onClick={() => void refetch()}>
          {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}
          Refresh
        </Button>
      </div>

      {error && data ? (
        <div
          className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100"
          role="status"
        >
          <AlertCircle className="size-4 shrink-0" />
          <span>Showing cached data. {error.message}</span>
        </div>
      ) : null}

      <AdminCommandCenterFilters
        range={range}
        onRangeChange={setRange}
        filters={filters}
        onFiltersChange={setFilters}
        schools={schools}
        partners={partners}
        programs={programs}
        optionsLoading={optionsLoading}
      />

      <Section
        title="Overview"
        description="Snapshot for families matching your segment filters. “Completed referrals” counts completions in the date range above."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricStatCard label="Total families" value={overview.totalFamilies} icon={Users} />
          <MetricStatCard label="Total participants" value={overview.totalParticipants} icon={UserCircle} />
          <MetricStatCard label="Active staff" value={overview.activeStaff} icon={Briefcase} />
          <MetricStatCard label="Active cases" value={overview.activeCases} icon={ClipboardList} />
          <MetricStatCard label="Overdue follow-ups" value={overview.overdueFollowUps} icon={AlertCircle} />
          <MetricStatCard label="Missing documents" value={overview.missingDocuments} icon={FileWarning} />
          <MetricStatCard label="Referrals in progress" value={overview.referralsInProgress} icon={Share2} />
          <MetricStatCard label="Completed referrals" value={overview.completedReferralsInRange} icon={CheckCircle2} />
        </div>
      </Section>

      <AdminQuickLinks />

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="xl:col-span-2">
          <ActivityFeedCard items={data.activityFeed} />
        </div>
        <div className="xl:col-span-3">
          <StaffOversightTable rows={data.staffOversight} />
        </div>
      </div>
    </div>
  );
}
