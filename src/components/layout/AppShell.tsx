"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type PropsWithChildren, useState } from "react";
import {
  BarChart3,
  BrainCircuit,
  CalendarDays,
  Building2,
  CircleDollarSign,
  ClipboardList,
  FileText,
  FolderKanban,
  Handshake,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";

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
const INTERNAL_ORGANIZATION_IDS = new Set(["org_demo"]);

function resolveActiveAdminNav(pathname: string): string {
  if (pathname === "/admin/tools/organization" || pathname.startsWith("/admin/tools/organization/")) return "/admin/tools/organization";
  if (pathname === "/admin/tools/staff" || pathname.startsWith("/admin/tools/staff/")) return "/admin/tools/staff";
  if (pathname === "/admin/organization" || pathname.startsWith("/admin/organization/")) return "/admin/organization";
  if (pathname === "/admin/reporting" || pathname.startsWith("/admin/reporting/")) return "/admin/reporting";
  if (pathname === "/admin/weekly-oversight" || pathname.startsWith("/admin/weekly-oversight/")) return "/admin/weekly-oversight";
  if (pathname === "/admin/exports" || pathname.startsWith("/admin/exports/")) return "/admin/exports";
  if (pathname === "/admin/tools" || pathname.startsWith("/admin/tools/")) return "/admin/tools";
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "/admin";
  return "/admin";
}

function resolveActiveStaffNav(pathname: string): string {
  if (pathname === "/staff/cases" || pathname.startsWith("/staff/cases/")) return "/staff/cases";
  if (pathname === "/staff/resources" || pathname.startsWith("/staff/resources/")) return "/staff/resources";
  if (pathname === "/staff/schedule" || pathname.startsWith("/staff/schedule/")) return "/staff/schedule";
  if (pathname === "/staff/agenda" || pathname.startsWith("/staff/agenda/")) return "/staff/agenda";
  if (pathname === "/staff/report" || pathname.startsWith("/staff/report/")) return "/staff/report";
  if (pathname === "/staff/reminders" || pathname.startsWith("/staff/reminders/")) return "/staff/reminders";
  if (pathname === "/staff/surveys" || pathname.startsWith("/staff/surveys/")) return "/staff/surveys";
  if (pathname === "/staff/admin/inquiries" || pathname.startsWith("/staff/admin/inquiries/")) return "/staff/admin/inquiries";
  if (pathname === "/staff/admin/handoffs" || pathname.startsWith("/staff/admin/handoffs/")) return "/staff/admin/handoffs";
  if (pathname === "/staff/admin/templates" || pathname.startsWith("/staff/admin/templates/")) return "/staff/admin/templates";
  if (pathname === "/staff/admin" || pathname.startsWith("/staff/admin/")) return "/staff/admin";
  if (pathname === "/staff" || pathname.startsWith("/staff/")) return "/staff";
  return "/staff";
}

export function AppShell({ title, subtitle, roleLabel, children }: AppShellProps) {
  const pathname = usePathname();
  const { orgId, organizations, activeOrganization, logout, switchOrganization, role } = useAuth();
  const [switchError, setSwitchError] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);
  const adminNav = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/organization", label: "Organizations", icon: Building2 },
    { href: "/admin/tools/staff", label: "Users", icon: Users },
    { href: "/admin/reporting", label: "Analytics", icon: BarChart3 },
    { href: "/admin/weekly-oversight", label: "Business Intelligence", icon: BrainCircuit },
    { href: "/admin/exports", label: "Revenue", icon: CircleDollarSign },
    { href: "/admin/tools/organization", label: "Settings", icon: Settings },
    { href: "/admin/tools", label: "Admin Tools", icon: Wrench },
  ];
  const defaultNav = [
    { href: "/admin", label: "Admin", icon: ShieldCheck },
    { href: "/staff", label: "Staff", icon: Users },
    { href: "/participant", label: "Participant", icon: LayoutDashboard },
  ];
  const staffNav = [
    { href: "/staff", label: "Dashboard", icon: LayoutDashboard },
    { href: "/staff/cases", label: "Cases", icon: FolderKanban },
    { href: "/staff/resources", label: "Resources", icon: Handshake },
    { href: "/staff/schedule", label: "Schedule", icon: CalendarDays },
    { href: "/staff/agenda", label: "Agenda", icon: ClipboardList },
    { href: "/staff/report", label: "Report", icon: FileText },
    { href: "/staff/reminders", label: "Reminders", icon: BrainCircuit },
  ];
  const staffAdminNav = role === "admin"
    ? [
        { href: "/staff/admin", label: "Org Admin", icon: ShieldCheck },
        { href: "/staff/admin/inquiries", label: "Inquiries", icon: Users },
        { href: "/staff/admin/handoffs", label: "Handoffs", icon: Handshake },
        { href: "/staff/admin/templates", label: "Templates", icon: FileText },
      ]
    : [];
  const navItems = roleLabel === "Admin" ? adminNav : roleLabel === "Staff" ? [...staffNav, ...staffAdminNav] : defaultNav;
  const activeNavHref =
    roleLabel === "Admin"
      ? resolveActiveAdminNav(pathname)
      : roleLabel === "Staff"
        ? resolveActiveStaffNav(pathname)
        : navItems.find((item) => pathname === item.href || pathname.startsWith(item.href + "/"))?.href ?? null;
  const activeOrgIsInternal = orgId ? INTERNAL_ORGANIZATION_IDS.has(orgId) : false;
  const hasOrgChoiceForCurrentContext = organizations.some((org) => org.organizationId === orgId);
  const showOrgSwitcher = organizations.length > 1 || (organizations.length > 0 && !hasOrgChoiceForCurrentContext);

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
            <Badge variant="outline">{activeOrgIsInternal ? "Platform" : activeOrganization?.name ?? orgId ?? "No org"}</Badge>
            {showOrgSwitcher ? (
              <div className="w-64 space-y-1">
                <Select
                  aria-label="Switch organization"
                  disabled={switching}
                  options={organizations.map((org) => ({
                    value: org.organizationId,
                    label: `${org.name} (${org.role})`,
                  }))}
                  value={hasOrgChoiceForCurrentContext ? orgId ?? "" : ""}
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
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Main Navigation</p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNavHref === item.href;
              return (
              <Link
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-emerald-600 text-white shadow-sm hover:bg-emerald-600"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )}
                href={item.href}
                key={item.href}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
              );
            })}
          </nav>
        </aside>
        <main className="col-span-12 md:col-span-9 lg:col-span-10">{children}</main>
      </div>
    </div>
  );
}
