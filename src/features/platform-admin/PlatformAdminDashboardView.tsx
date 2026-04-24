"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingState } from "@/components/ui/loading-state";
import { ROUTES } from "@/constants";
import { authService } from "@/services/auth/authService";
import { createPlatformOrganization, getPlatformOverview } from "@/services/functions/platformAdminService";
import type { PlatformOverview } from "@/types/platformAdmin";

type PlatformAdminDashboardViewProps = {
  showOpenOrganizationButton?: boolean;
  showCreateOrganizationCard?: boolean;
};

export function PlatformAdminDashboardView({
  showOpenOrganizationButton = true,
  showCreateOrganizationCard = false,
}: PlatformAdminDashboardViewProps) {
  const [data, setData] = useState<PlatformOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [organizationName, setOrganizationName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [createNote, setCreateNote] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

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

  const handleCreateOrganization = async () => {
    const nextName = organizationName.trim();
    if (nextName.length < 2) {
      setCreateError("Organization name must be at least 2 characters.");
      return;
    }
    setCreateError(null);
    setCreateNote(null);
    setIsCreating(true);
    try {
      const result = await createPlatformOrganization(nextName);
      await authService.refreshSessionClaims();
      setCreateNote(`Created organization: ${result.organizationId}`);
      setOrganizationName("");
      await load();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Failed to create organization.");
    } finally {
      setIsCreating(false);
    }
  };

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
      {showOpenOrganizationButton ? (
        <div className="flex flex-wrap gap-2">
          <Link href={ROUTES.ADMIN_ORGANIZATION}>
            <Button type="button" variant="outline" size="sm">
              Open organizations
            </Button>
          </Link>
        </div>
      ) : null}

      {showCreateOrganizationCard ? (
        <Card>
          <CardHeader>
            <CardTitle>Create organization</CardTitle>
            <CardDescription>
              Manually add an organization. This creates the org and assigns your account as an admin member.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="max-w-lg space-y-2">
              <Label htmlFor="platform-org-name">Organization name</Label>
              <Input
                id="platform-org-name"
                placeholder="New Hope Center"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
              />
            </div>
            <Button type="button" disabled={isCreating} onClick={() => void handleCreateOrganization()}>
              {isCreating ? "Creating..." : "Create organization"}
            </Button>
            {createError ? <p className="text-sm text-destructive">{createError}</p> : null}
            {createNote ? <p className="text-sm text-emerald-700">{createNote}</p> : null}
            {data.totalOrganizations === 0 ? (
              <p className="text-sm text-muted-foreground">
                No organizations exist yet. Create your first organization above to start onboarding customers.
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

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
