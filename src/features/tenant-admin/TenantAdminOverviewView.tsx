"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FEATURE_FLAGS } from "@/config/featureFlags";
import { ROUTES } from "@/constants";
import {
  createAuditableExport,
  getMyOrganizationEntitlement,
  setOrganizationDataRetention,
  type OrganizationEntitlement,
} from "@/services/functions/nonprofitOsService";

export function TenantAdminOverviewView() {
  const [entitlement, setEntitlement] = useState<OrganizationEntitlement | null>(null);
  const [retentionDays, setRetentionDays] = useState("365");
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getMyOrganizationEntitlement()
      .then(setEntitlement)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load entitlement."));
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Organization Admin Workspace</CardTitle>
          <CardDescription>
            Tenant-level operations for inquiries, handoffs, templates, and documentation governance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-slate-600">Use this area for day-to-day org administration separate from the platform super-admin console.</p>
          <div className="flex flex-wrap gap-4">
            <Link className="text-emerald-700 underline-offset-4 hover:underline" href={ROUTES.STAFF_ADMIN_INQUIRIES}>
              Manage inquiries
            </Link>
            <Link className="text-emerald-700 underline-offset-4 hover:underline" href={ROUTES.STAFF_ADMIN_HANDOFFS}>
              Manage handoffs
            </Link>
            <Link className="text-emerald-700 underline-offset-4 hover:underline" href={ROUTES.STAFF_ADMIN_TEMPLATES}>
              Manage templates
            </Link>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Pilot Feature Flags</CardTitle>
          <CardDescription>Runtime toggles for partner pilot rollout.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-1 text-sm text-slate-700">
          <p>Tenant admin workspace: {FEATURE_FLAGS.tenantAdminWorkspace ? "on" : "off"}</p>
          <p>Inquiry pipeline: {FEATURE_FLAGS.inquiryPipeline ? "on" : "off"}</p>
          <p>Handoff collaboration: {FEATURE_FLAGS.handoffCollaboration ? "on" : "off"}</p>
          <p>Documentation packs: {FEATURE_FLAGS.documentationPacks ? "on" : "off"}</p>
          <p>Auditable exports: {FEATURE_FLAGS.auditableExports ? "on" : "off"}</p>
          <p>Monetization entitlements: {FEATURE_FLAGS.monetizationEntitlements ? "on" : "off"}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Plan & Entitlements</CardTitle>
          <CardDescription>Current SaaS packaging and usage limits for this organization.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="font-medium">Plan:</span> {entitlement?.plan ?? "loading..."}</p>
          <p><span className="font-medium">Billing status:</span> {entitlement?.billingStatus ?? "loading..."}</p>
          <p><span className="font-medium">Features:</span> {(entitlement?.enabledFeatures ?? []).join(", ") || "—"}</p>
          <p>
            <span className="font-medium">Limits:</span>{" "}
            seats {entitlement?.limits.staffSeats ?? "—"}, active cases {entitlement?.limits.activeCases ?? "—"}, monthly handoffs{" "}
            {entitlement?.limits.monthlyHandoffs ?? "—"}.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Compliance Controls</CardTitle>
          <CardDescription>Retention policy and auditable exports.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="w-28 rounded border px-2 py-1 text-sm"
              value={retentionDays}
              onChange={(e) => setRetentionDays(e.target.value)}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setError(null);
                setNote(null);
                void setOrganizationDataRetention(Number(retentionDays))
                  .then(() => setNote(`Retention policy updated to ${retentionDays} days.`))
                  .catch((e) => setError(e instanceof Error ? e.message : "Failed to update retention."));
              }}
            >
              Update retention days
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setError(null);
                setNote(null);
                void createAuditableExport({
                  exportType: "case_summary",
                  reason: "Tenant admin audit review",
                })
                  .then(({ exportId }) => setNote(`Auditable export queued: ${exportId}`))
                  .catch((e) => setError(e instanceof Error ? e.message : "Failed to queue export."));
              }}
            >
              Queue auditable export
            </Button>
          </div>
          {note ? <p className="text-sm text-emerald-700">{note}</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
