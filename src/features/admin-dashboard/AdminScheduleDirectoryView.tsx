"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ROUTES } from "@/constants";
import { useAuth } from "@/hooks/useAuth";
import { fetchAdminScheduleEntries, type AdminScheduleRow } from "@/services/firestore/adminDirectoryService";

function formatRange(start: string, end: string): string {
  try {
    const a = new Date(start);
    const b = new Date(end);
    return `${a.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })} – ${b.toLocaleTimeString(undefined, { timeStyle: "short" })}`;
  } catch {
    return `${start.slice(0, 16)} – ${end.slice(0, 16)}`;
  }
}

export function AdminScheduleDirectoryView() {
  const { orgId } = useAuth();
  const [rows, setRows] = useState<AdminScheduleRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (!orgId) {
      setRows([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      setRows(await fetchAdminScheduleEntries(orgId));
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!orgId) {
    return <EmptyState title="No organization" description="Admin access requires an organization." />;
  }

  if (isLoading) {
    return <LoadingState message="Loading schedule…" />;
  }

  if (error) {
    return (
      <EmptyState
        title="Could not load schedule"
        description={error.message}
        action={
          <button type="button" className={buttonVariants()} onClick={() => void load()}>
            Retry
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={ROUTES.ADMIN}>
        ← Command center
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Staff calendar</CardTitle>
          <CardDescription>
            Recent schedule entries across the organization ({rows.length} loaded). Staff can manage their own view on
            the staff schedule page.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {rows.length === 0 ? (
            <EmptyState
              title="No schedule entries"
              description="When staff add entries to staffScheduleEntries, they will appear here."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Staff UID</TableHead>
                  <TableHead>Family</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.entryId}>
                    <TableCell className="whitespace-nowrap text-sm">{formatRange(r.startAt, r.endAt)}</TableCell>
                    <TableCell className="capitalize">{r.type}</TableCell>
                    <TableCell>{r.title ?? "—"}</TableCell>
                    <TableCell className="max-w-[140px] truncate font-mono text-xs">{r.staffUid}</TableCell>
                    <TableCell className="max-w-[120px] truncate font-mono text-xs">{r.familyId ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
