"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deletePlatformUser, getPlatformUsers, setPlatformUserDisabled } from "@/services/functions/platformUsersService";
import type { PlatformUserRow } from "@/types/platformUsers";

export function PlatformUsersView() {
  const [users, setUsers] = useState<PlatformUserRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busyUid, setBusyUid] = useState<string | null>(null);

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
          Platform-wide users across organizations. Manage account access here; org-level staff assignments stay in org dashboards.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Button type="button" size="sm" variant="outline" onClick={() => void load()}>
            Refresh
          </Button>
        </div>
        {error ? <p className="text-sm text-destructive">{error.message}</p> : null}
        {note ? <p className="text-sm text-emerald-700 dark:text-emerald-300">{note}</p> : null}
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
                <TableHead>Status</TableHead>
                <TableHead>Organizations</TableHead>
                <TableHead />
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
                  <TableCell>
                    {u.isDisabled ? <Badge variant="outline">Disabled</Badge> : <Badge variant="secondary">Active</Badge>}
                  </TableCell>
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
                  <TableCell>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busyUid === u.uid}
                        onClick={() => {
                          setBusyUid(u.uid);
                          setError(null);
                          setNote(null);
                          void setPlatformUserDisabled(u.uid, !u.isDisabled)
                            .then(() => {
                              setNote(`${u.email ?? u.uid} ${u.isDisabled ? "reactivated" : "deactivated"}.`);
                              return load();
                            })
                            .catch((e) => setError(e instanceof Error ? e : new Error(String(e))))
                            .finally(() => setBusyUid(null));
                        }}
                      >
                        {u.isDisabled ? "Reactivate" : "Deactivate"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={busyUid === u.uid}
                        onClick={() => {
                          const ok = window.confirm(
                            `Delete user "${u.email ?? u.uid}"? This removes auth access, memberships, and profile data.`,
                          );
                          if (!ok) return;
                          setBusyUid(u.uid);
                          setError(null);
                          setNote(null);
                          void deletePlatformUser(u.uid)
                            .then(() => {
                              setNote(`${u.email ?? u.uid} deleted.`);
                              return load();
                            })
                            .catch((e) => setError(e instanceof Error ? e : new Error(String(e))))
                            .finally(() => setBusyUid(null));
                        }}
                      >
                        Delete
                      </Button>
                    </div>
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
