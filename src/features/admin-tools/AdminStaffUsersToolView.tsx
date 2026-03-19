"use client";

import { useState } from "react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { ROUTES } from "@/constants";
import { useAdminOrganizationMembers } from "@/hooks/useAdminTools";
import type { AppRole } from "@/types/auth";

const roleOptions: { value: AppRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
  { value: "participant", label: "Participant" },
];

export function AdminStaffUsersToolView() {
  const { members, isLoading, error, refetch, setRole, setActive } = useAdminOrganizationMembers();
  const [pending, setPending] = useState<Record<string, AppRole>>({});
  const [busyUid, setBusyUid] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={ROUTES.ADMIN_TOOLS}>
          Admin tools
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff & organization members</CardTitle>
          <CardDescription>
            Change roles on existing memberships. New users still require Firebase account + membership document (invite flow /
            admin script).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? <p className="text-sm text-destructive">{error.message}</p> : null}
          {msg ? <p className="text-sm text-emerald-700 dark:text-emerald-300">{msg}</p> : null}
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
              Refresh
            </Button>
          </div>
          {isLoading ? <LoadingState message="Loading members…" /> : null}
          {!isLoading && members.length === 0 ? (
            <EmptyState
              title="No active members"
              description="Add organizationMemberships documents (active: true) for this org, or adjust Firestore rules if you expect data here."
            />
          ) : null}
          {!isLoading && members.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>UID</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.uid}>
                    <TableCell>
                      <div className="font-medium">{m.displayName ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{m.email ?? "—"}</div>
                    </TableCell>
                    <TableCell className="max-w-[140px] truncate font-mono text-xs">{m.uid}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Label className="sr-only" htmlFor={`role-${m.uid}`}>
                          Role
                        </Label>
                        <Select
                          id={`role-${m.uid}`}
                          options={roleOptions.map((o) => ({ value: o.value, label: o.label }))}
                          value={pending[m.uid] ?? m.role}
                          onChange={(e) => setPending((p) => ({ ...p, [m.uid]: e.target.value as AppRole }))}
                        />
                      </div>
                    </TableCell>
                    <TableCell>{m.active ? "Yes" : "No"}</TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={busyUid === m.uid || (pending[m.uid] ?? m.role) === m.role}
                        onClick={() => {
                          setBusyUid(m.uid);
                          setMsg(null);
                          void setRole(m.uid, pending[m.uid] ?? m.role)
                            .then(() => {
                              setMsg(`Updated role for ${m.email ?? m.uid}`);
                              setPending((p) => {
                                const n = { ...p };
                                delete n[m.uid];
                                return n;
                              });
                            })
                            .catch((err) => setMsg(err instanceof Error ? err.message : "Failed"))
                            .finally(() => setBusyUid(null));
                        }}
                      >
                        Save role
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busyUid === m.uid}
                        onClick={() => {
                          setBusyUid(m.uid);
                          setMsg(null);
                          void setActive(m.uid, false)
                            .then(() => setMsg(`Deactivated ${m.email ?? m.uid}`))
                            .catch((err) => setMsg(err instanceof Error ? err.message : "Failed"))
                            .finally(() => setBusyUid(null));
                        }}
                      >
                        Deactivate
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
