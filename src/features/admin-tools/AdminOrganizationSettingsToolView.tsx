"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { LoadingState } from "@/components/ui/loading-state";
import { ROUTES } from "@/constants";
import { useAuth } from "@/hooks/useAuth";
import { useAdminOrganizationRecord } from "@/hooks/useAdminTools";
import { MULTI_ORG_ONBOARDING_STEPS, describeTenantIsolation } from "@/lib/multiOrgOnboarding";
import type { Organization } from "@/types/domain";

export function AdminOrganizationSettingsToolView() {
  const { orgId } = useAuth();
  const { org, isLoading, error, refetch, save } = useAdminOrganizationRecord();
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Organization["status"]>("active");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (!org) return;
    setName(org.name);
    setStatus(org.status);
  }, [org]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={ROUTES.ADMIN_TOOLS}>
          Admin tools
        </Link>
      </div>

      {error ? <p className="text-sm text-destructive">{error.message}</p> : null}
      {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
          <CardDescription>Current tenant from your session. Multi-org switching is not enabled in the UI yet.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? <LoadingState message="Loading…" /> : null}
          <div className="space-y-1 text-sm">
            <span className="text-muted-foreground">Organization ID</span>
            <p className="font-mono text-xs">{orgId ?? "—"}</p>
          </div>
          {!org && !isLoading ? (
            <p className="text-sm text-muted-foreground">No organization document found for this id (create it in Firestore).</p>
          ) : null}
          <div className="grid max-w-md gap-3">
            <div className="space-y-2">
              <Label>Display name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!org} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                options={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
                value={status}
                onChange={(e) => setStatus(e.target.value as Organization["status"])}
                disabled={!org}
              />
            </div>
            <Button
              type="button"
              disabled={busy || !org}
              onClick={() => {
                setBusy(true);
                void save({ name: name.trim(), status })
                  .then(() => setNote("Organization updated."))
                  .catch((e) => setNote(e instanceof Error ? e.message : "Failed"))
                  .finally(() => setBusy(false));
              }}
            >
              Save organization
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Settings payload (read-only)</CardTitle>
          <CardDescription>Merge updates use shallow keys; prefer dedicated tools for workflow stages.</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="max-h-64 overflow-auto rounded-md border bg-muted/40 p-3 text-xs">
            {org ? JSON.stringify(org.settings ?? {}, null, 2) : "{}"}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tenant isolation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>{describeTenantIsolation()}</p>
          <ol className="list-decimal space-y-1 pl-5">
            {MULTI_ORG_ONBOARDING_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
            Reload organization
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
