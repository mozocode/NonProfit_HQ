"use client";

import Link from "next/link";
import { type PropsWithChildren, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

type AppShellProps = PropsWithChildren<{
  title: string;
  subtitle: string;
  roleLabel: string;
}>;

export function AppShell({ title, subtitle, roleLabel, children }: AppShellProps) {
  const { orgId, organizations, activeOrganization, logout, switchOrganization } = useAuth();
  const [switchError, setSwitchError] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">NonProfit HQ</p>
            <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">{roleLabel}</Badge>
            <Badge variant="outline">{activeOrganization?.name ?? orgId ?? "No org"}</Badge>
            {organizations.length > 1 ? (
              <div className="w-64 space-y-1">
                <Select
                  aria-label="Switch organization"
                  disabled={switching}
                  options={organizations.map((org) => ({
                    value: org.organizationId,
                    label: `${org.name} (${org.role})`,
                  }))}
                  value={orgId ?? ""}
                  onChange={(e) => {
                    const nextOrgId = e.target.value;
                    if (!nextOrgId || nextOrgId === orgId) return;
                    setSwitchError(null);
                    setSwitching(true);
                    void switchOrganization(nextOrgId)
                      .catch((err: unknown) => {
                        setSwitchError(err instanceof Error ? err.message : "Failed to switch organization.");
                      })
                      .finally(() => setSwitching(false));
                  }}
                />
                {switching ? <p className="text-[11px] text-slate-500">Switching organization...</p> : null}
              </div>
            ) : null}
            <Button onClick={logout} size="sm" type="button" variant="outline">
              Sign out
            </Button>
          </div>
        </div>
        {switchError ? (
          <div className="mx-auto w-full max-w-7xl px-6 pb-3">
            <p className="text-xs text-destructive">{switchError}</p>
          </div>
        ) : null}
      </header>

      <div className="mx-auto grid w-full max-w-7xl grid-cols-12 gap-6 px-6 py-6">
        <aside className="col-span-12 rounded-xl border bg-white p-4 md:col-span-3 lg:col-span-2">
          <nav className="space-y-1">
            {[
              { href: "/admin", label: "Admin" },
              { href: "/staff", label: "Staff" },
              { href: "/participant", label: "Participant" },
            ].map((item) => (
              <Link
                className={cn(
                  "block rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="col-span-12 md:col-span-9 lg:col-span-10">{children}</main>
      </div>
    </div>
  );
}
