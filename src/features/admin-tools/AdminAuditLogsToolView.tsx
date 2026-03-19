"use client";

import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingState } from "@/components/ui/loading-state";
import { ROUTES } from "@/constants";
import { useAdminAuditLogs } from "@/hooks/useAdminTools";

export function AdminAuditLogsToolView() {
  const { logs, isLoading, error, refetch } = useAdminAuditLogs(250);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={ROUTES.ADMIN_TOOLS}>
          Admin tools
        </Link>
        <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audit logs</CardTitle>
          <CardDescription>
            Latest entries for this organization (requires writes to populate). Index: organizationId + createdAt desc.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? <p className="text-sm text-destructive">{error.message}</p> : null}
          {isLoading ? <LoadingState message="Loading logs…" /> : null}
          {!isLoading ? (
            <div className="max-h-[560px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Meta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No audit rows yet.
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {logs.map((l) => (
                    <TableRow key={l.logId}>
                      <TableCell className="whitespace-nowrap text-xs">{l.createdAt?.slice(0, 19) ?? "—"}</TableCell>
                      <TableCell className="max-w-[160px] text-sm">{l.action}</TableCell>
                      <TableCell className="max-w-[100px] truncate font-mono text-xs">{l.actorUid}</TableCell>
                      <TableCell className="text-xs">
                        {l.resourceType}/{l.resourceId}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                        {JSON.stringify(l.metadata)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
