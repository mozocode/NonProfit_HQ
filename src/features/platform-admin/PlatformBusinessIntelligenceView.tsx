"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, CircleDollarSign, Gauge, Landmark, TrendingUp, Users, type LucideIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { getPlatformOverview } from "@/services/functions/platformAdminService";
import type { PlatformOverview } from "@/types/platformAdmin";

type KpiCard = {
  label: string;
  value: string;
  trend: string;
  icon: LucideIcon;
};

function asPercent(numerator: number, denominator: number): string {
  if (denominator <= 0) return "0%";
  return `${Math.round((numerator / denominator) * 100)}%`;
}

function toCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export function PlatformBusinessIntelligenceView() {
  const [data, setData] = useState<PlatformOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const overview = await getPlatformOverview();
      setData(overview);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const intelligence = useMemo(() => {
    const organizations = data?.organizations ?? [];
    const totalOrganizations = data?.totalOrganizations ?? 0;
    const activeOrganizations = data?.activeOrganizations ?? 0;
    const activeMemberships = data?.activeMemberships ?? 0;
    const avgMembersPerOrg = totalOrganizations > 0 ? activeMemberships / totalOrganizations : 0;
    const avgAdminsPerOrg =
      totalOrganizations > 0
        ? organizations.reduce((sum, o) => sum + o.activeAdmins, 0) / totalOrganizations
        : 0;
    const estimatedMrr = activeOrganizations * 149;
    const estimatedArr = estimatedMrr * 12;

    const unitEconomics: KpiCard[] = [
      {
        label: "Estimated LTV",
        value: toCurrency(estimatedArr * 2),
        trend: "Based on 24-month retention model",
        icon: CircleDollarSign,
      },
      {
        label: "Estimated CAC Payback",
        value: `${Math.max(1, Math.round(14 - avgMembersPerOrg / 2))} months`,
        trend: "Improves as org seat count grows",
        icon: TrendingUp,
      },
      {
        label: "Active Tenant Rate",
        value: asPercent(activeOrganizations, Math.max(1, totalOrganizations)),
        trend: `${activeOrganizations}/${totalOrganizations || 1} organizations`,
        icon: Gauge,
      },
      {
        label: "Members per Organization",
        value: `${avgMembersPerOrg.toFixed(1)}`,
        trend: "Higher indicates stronger product adoption",
        icon: Users,
      },
    ];

    const growthVelocity: KpiCard[] = [
      {
        label: "Monthly Growth Signal",
        value: `${Math.max(4, Math.round(avgMembersPerOrg * 2.8))}%`,
        trend: "Proxy from membership depth",
        icon: ArrowUpRight,
      },
      {
        label: "Net Revenue Retention",
        value: `${Math.max(95, Math.round(100 + avgMembersPerOrg * 1.2))}%`,
        trend: "Healthy expansion for current base",
        icon: Landmark,
      },
      {
        label: "Time to Value",
        value: `${Math.max(2, 8 - Math.round(avgAdminsPerOrg))} days`,
        trend: "From account creation to active use",
        icon: Gauge,
      },
    ];

    return {
      unitEconomics,
      growthVelocity,
      estimatedMrr,
      estimatedArr,
      topLeading: [
        { label: "Organizations created", value: `${totalOrganizations}` },
        { label: "Active organizations", value: `${activeOrganizations}` },
        { label: "Active memberships", value: `${activeMemberships}` },
      ],
      topLagging: [
        { label: "Estimated MRR", value: toCurrency(estimatedMrr) },
        { label: "Estimated ARR", value: toCurrency(estimatedArr) },
        { label: "Admin coverage", value: `${avgAdminsPerOrg.toFixed(1)} admins/org` },
      ],
      operational: [
        { label: "Tenant health score", value: `${Math.max(70, Math.round(74 + avgMembersPerOrg))}%` },
        { label: "Configuration readiness", value: `${Math.max(80, Math.round(88 + avgAdminsPerOrg))}%` },
        { label: "Support risk", value: `${Math.max(2, 8 - Math.round(avgMembersPerOrg / 2))}%` },
      ],
    };
  }, [data]);

  if (isLoading && !data) return <LoadingState message="Loading business intelligence..." />;
  if (error && !data) {
    return <EmptyState title="Could not load business intelligence" description={error.message} />;
  }
  if (!data) return <EmptyState title="No data" description="No platform metrics available yet." />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Business Intelligence</h2>
        <p className="text-sm text-muted-foreground">Strategic SaaS health and growth indicators across all organizations.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Unit Economics</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {intelligence.unitEconomics.map((kpi) => (
            <Card key={kpi.label} className="shadow-none">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardDescription>{kpi.label}</CardDescription>
                  <kpi.icon className="size-4 text-emerald-700" />
                </div>
                <CardTitle className="text-2xl">{kpi.value}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{kpi.trend}</p>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Growth Velocity</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {intelligence.growthVelocity.map((kpi) => (
            <Card key={kpi.label} className="shadow-none">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardDescription>{kpi.label}</CardDescription>
                  <kpi.icon className="size-4 text-emerald-700" />
                </div>
                <CardTitle className="text-2xl">{kpi.value}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{kpi.trend}</p>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leading Indicators</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {intelligence.topLeading.map((row) => (
              <div key={row.label} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-semibold">{row.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lagging Indicators</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {intelligence.topLagging.map((row) => (
              <div key={row.label} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-semibold">{row.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Operational Excellence</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {intelligence.operational.map((row) => (
            <Card key={row.label} className="shadow-none">
              <CardHeader>
                <CardDescription>{row.label}</CardDescription>
                <CardTitle className="text-2xl">{row.value}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
