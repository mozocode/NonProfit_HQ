"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingState } from "@/components/ui/loading-state";
import { ROUTES } from "@/constants";
import { useOrgWorkflowStagesAdmin } from "@/hooks/useAdminTools";
import type { OrgWorkflowStageSetting } from "@/types/adminManagement";
import { defaultWorkflowStagesFromConstants } from "@/services/firestore/organizationService";

export function AdminWorkflowStagesToolView() {
  const { stages, isLoading, error, refetch, save } = useOrgWorkflowStagesAdmin();
  const [local, setLocal] = useState<OrgWorkflowStageSetting[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const rows = local ?? stages;

  const reorder = (from: number, to: number) => {
    const next = [...rows];
    const [m] = next.splice(from, 1);
    if (!m) return;
    next.splice(to, 0, m);
    setLocal(next.map((s, i) => ({ ...s, order: i })));
  };

  const updateRow = (index: number, patch: Partial<OrgWorkflowStageSetting>) => {
    const next = rows.map((s, i) => (i === index ? { ...s, ...patch } : s));
    setLocal(next.map((s, i) => ({ ...s, order: i })));
  };

  const dirty = useMemo(() => {
    if (!local) return false;
    return JSON.stringify(local) !== JSON.stringify(stages);
  }, [local, stages]);

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
          <CardTitle>Workflow stages (template)</CardTitle>
          <CardDescription>
            Stored in <code className="rounded bg-muted px-1">organizations.settings.workflowStages</code>. Families still use{" "}
            <code className="rounded bg-muted px-1">workflowStage</code> on the family document — values should match stage{" "}
            <code className="text-xs">id</code> strings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? <LoadingState message="Loading stages…" /> : null}
          {!isLoading ? (
            <ul className="space-y-3">
              {rows.map((s, i) => (
                <li key={`${s.id}-${i}`} className="flex flex-wrap items-end gap-2 rounded-lg border p-3">
                  <div className="grid flex-1 gap-2 sm:grid-cols-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Id (slug)</Label>
                      <Input value={s.id} onChange={(e) => updateRow(i, { id: e.target.value })} className="font-mono text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Label</Label>
                      <Input value={s.label} onChange={(e) => updateRow(i, { label: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Order</Label>
                      <Input
                        type="number"
                        value={s.order}
                        onChange={(e) => updateRow(i, { order: Number(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button type="button" variant="outline" size="sm" disabled={i === 0} onClick={() => reorder(i, i - 1)}>
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={i === rows.length - 1}
                      onClick={() => reorder(i, i + 1)}
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={busy || !dirty}
              onClick={() => {
                setBusy(true);
                void save(rows)
                  .then(() => {
                    setLocal(null);
                    setNote("Workflow stages saved.");
                  })
                  .catch((e) => setNote(e instanceof Error ? e.message : "Failed"))
                  .finally(() => setBusy(false));
              }}
            >
              Save stages
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => {
                setLocal(defaultWorkflowStagesFromConstants());
                setNote("Reset to defaults (not saved until you click Save).");
              }}
            >
              Reset to app defaults
            </Button>
            <Button type="button" variant="outline" onClick={() => void refetch().then(() => setLocal(null))}>
              Reload from server
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
