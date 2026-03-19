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
import { fetchAdminPartnersList, type AdminPartnerRow } from "@/services/firestore/adminDirectoryService";

export function AdminPartnersDirectoryView() {
  const { orgId } = useAuth();
  const [rows, setRows] = useState<AdminPartnerRow[]>([]);
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
      setRows(await fetchAdminPartnersList(orgId));
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
    return <LoadingState message="Loading partners…" />;
  }

  if (error) {
    return (
      <EmptyState
        title="Could not load partners"
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
          <CardTitle>Partner organizations</CardTitle>
          <CardDescription>Community partners and referral collaborators.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {rows.length === 0 ? (
            <EmptyState title="No partners yet" description="Add partner organizations in Firestore to list them here." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.partnerOrgId}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{r.partnerOrgId}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : "—"}
                    </TableCell>
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
