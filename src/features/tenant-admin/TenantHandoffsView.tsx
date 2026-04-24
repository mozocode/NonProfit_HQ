"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import {
  createReferralHandoff,
  listMyReferralHandoffs,
  setSharingConsent,
  updateReferralHandoffStatus,
  type ReferralHandoffView,
} from "@/services/functions/collaborationService";

export function TenantHandoffsView() {
  const { orgId } = useAuth();
  const [handoffs, setHandoffs] = useState<ReferralHandoffView[]>([]);
  const [targetOrgId, setTargetOrgId] = useState("");
  const [summary, setSummary] = useState("");
  const [allowedFields, setAllowedFields] = useState("intake,enrollment,assessment,goals,notes");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const load = async () => {
    setError(null);
    try {
      setHandoffs(await listMyReferralHandoffs());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load handoffs.");
    }
  };

  useEffect(() => {
    if (!orgId) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cross-Organization Handoffs</CardTitle>
        <CardDescription>Manage outbound and inbound client handoffs with scoped sharing controls.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 rounded-md border p-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="target-org-id">Target organization ID</Label>
            <Input id="target-org-id" value={targetOrgId} onChange={(e) => setTargetOrgId(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="handoff-fields">Allowed fields (comma-separated)</Label>
            <Input id="handoff-fields" value={allowedFields} onChange={(e) => setAllowedFields(e.target.value)} />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="handoff-summary">Summary</Label>
            <Input id="handoff-summary" value={summary} onChange={(e) => setSummary(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Button
              type="button"
              disabled={isSaving || !targetOrgId.trim() || !summary.trim()}
              onClick={() => {
                setIsSaving(true);
                setError(null);
                void createReferralHandoff({
                  targetOrganizationId: targetOrgId.trim(),
                  summary: summary.trim(),
                })
                  .then(async ({ handoffId }) => {
                    const fields = allowedFields
                      .split(",")
                      .map((f) => f.trim())
                      .filter(Boolean);
                    if (fields.length > 0) {
                      await setSharingConsent(handoffId, fields);
                    }
                    setTargetOrgId("");
                    setSummary("");
                    await load();
                  })
                  .catch((e) => setError(e instanceof Error ? e.message : "Failed to create handoff."))
                  .finally(() => setIsSaving(false));
              }}
            >
              {isSaving ? "Sending..." : "Create handoff"}
            </Button>
          </div>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Direction</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Summary</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {handoffs.map((handoff) => (
              <TableRow key={handoff.handoffId}>
                <TableCell>{handoff.sourceOrganizationId === orgId ? "Outbound" : "Inbound"}</TableCell>
                <TableCell className="font-mono text-xs">{handoff.targetOrganizationId}</TableCell>
                <TableCell>{handoff.summary}</TableCell>
                <TableCell>
                  <Select
                    value={handoff.status}
                    onChange={(e) => {
                      void updateReferralHandoffStatus(
                        handoff.handoffId,
                        e.target.value as "pending_acceptance" | "accepted" | "in_progress" | "closed" | "rejected",
                      ).then(load);
                    }}
                    options={[
                      { value: "pending_acceptance", label: "pending_acceptance" },
                      { value: "accepted", label: "accepted" },
                      { value: "in_progress", label: "in_progress" },
                      { value: "closed", label: "closed" },
                      { value: "rejected", label: "rejected" },
                    ]}
                  />
                </TableCell>
              </TableRow>
            ))}
            {handoffs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-slate-500">
                  No handoffs yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
