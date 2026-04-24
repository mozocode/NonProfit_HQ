"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPlatformUsers } from "@/services/functions/platformUsersService";
import type { PlatformUserRow } from "@/types/platformUsers";

export function PlatformUsersView() {
  const [users, setUsers] = useState<PlatformUserRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setUsers(await getPlatformUsers());
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>SaaS users</CardTitle>
        <CardDescription>
          Platform-wide users across all organizations. Owner indicates the user created the organization account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Button type="button" size="sm" variant="outline" onClick={() => void load()}>
            Refresh
          </Button>
        </div>
        {error ? <p className="text-sm text-destructive">{error.message}</p> : null}
        {isLoading ? <LoadingState message="Loading SaaS users..." /> : null}
        {!isLoading && users.length === 0 ? (
          <EmptyState title="No users found" description="No memberships found across organizations yet." />
        ) : null}
        {!isLoading && users.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>UID</TableHead>
                <TableHead>Organizations</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.uid}>
                  <TableCell>
                    <div className="font-medium">{u.displayName ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{u.email ?? "—"}</div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate font-mono text-xs">{u.uid}</TableCell>
                  <TableCell className="space-y-2">
                    {u.organizations.map((org) => (
                      <div key={`${u.uid}-${org.organizationId}`} className="rounded-md border px-3 py-2 text-xs">
                        <div className="font-medium">{org.organizationName}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          <Badge variant="secondary">{org.role}</Badge>
                          {org.isOrganizationOwner ? <Badge variant="default">Owner</Badge> : <Badge variant="outline">Assigned</Badge>}
                          <span className="text-muted-foreground">{org.organizationId}</span>
                        </div>
                      </div>
                    ))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}
      </CardContent>
    </Card>
  );
}
