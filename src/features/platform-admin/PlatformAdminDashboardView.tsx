"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { ROUTES } from "@/constants";
import { getPlatformOverview } from "@/services/functions/platformAdminService";
import type { PlatformOverview } from "@/types/platformAdmin";

export function PlatformAdminDashboardView() {
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

  if (isLoading && !data) {
    return <LoadingState message="Loading platform admin overview..." />;
  }

  if (error && !data) {
    return (
      <EmptyState
        title="Could not load platform dashboard"
        description={error.message}
        action={
          <Button type="button" onClick={() => void load()}>
            Retry
          </Button>
        }
      />
    );
  }

  if (!data) {
    return <EmptyState title="No data" description="No platform overview is available yet." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Link href={ROUTES.ADMIN_ORGANIZATION}>
          <Button type="button" variant="outline" size="sm">
            Open organization admin view
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Total organizations</CardDescription>
            <CardTitle>{data.totalOrganizations}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Active organizations</CardDescription>
            <CardTitle>{data.activeOrganizations}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Active memberships</CardDescription>
            <CardTitle>{data.activeMemberships}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organizations</CardTitle>
          <CardDescription>Global tenant list for the SaaS platform.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.organizations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No organizations found.</p>
          ) : (
            <div className="space-y-2">
              {data.organizations.map((org) => (
                <div key={org.organizationId} className="rounded-md border p-3 text-sm">
                  <p className="font-medium">{org.name}</p>
                  <p className="text-muted-foreground">
                    {org.organizationId} · {org.status} · {org.activeMembers} active members · {org.activeAdmins} admins
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
