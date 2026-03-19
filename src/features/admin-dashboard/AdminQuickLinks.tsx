"use client";

import Link from "next/link";
import { BarChart3, CalendarDays, ClipboardCheck, Download, Handshake, ListChecks, School, Wrench } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants";
import { cn } from "@/lib/utils";

const links = [
  { href: ROUTES.ADMIN_TOOLS, label: "Admin tools", description: "Staff, templates, org settings, audit", icon: Wrench },
  { href: ROUTES.ADMIN_SCHEDULE, label: "Staff calendar", description: "Organization schedule overview", icon: CalendarDays },
  {
    href: ROUTES.ADMIN_WEEKLY_SUBMISSIONS,
    label: "Weekly submissions",
    description: "Agendas vs reports, compliance",
    icon: ClipboardCheck,
  },
  {
    href: ROUTES.ADMIN_WEEKLY_OVERSIGHT,
    label: "Weekly oversight",
    description: "Planned vs actual, tasks, org summary",
    icon: ListChecks,
  },
  { href: ROUTES.ADMIN_REPORTING, label: "Reporting", description: "Analytics, filters, and exports", icon: BarChart3 },
  { href: ROUTES.ADMIN_SCHOOLS, label: "Schools", description: "Partner schools directory", icon: School },
  { href: ROUTES.ADMIN_PARTNERS, label: "Partner organizations", description: "Community partners", icon: Handshake },
  { href: ROUTES.ADMIN_EXPORTS, label: "Exports", description: "Data exports and downloads", icon: Download },
] as const;

export function AdminQuickLinks() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick links</CardTitle>
        <CardDescription>Jump to common admin workflows.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {links.map(({ href, label, description, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-auto w-full flex-col items-start gap-1 whitespace-normal py-3 text-left",
                )}
              >
                <span className="flex items-center gap-2 font-semibold text-foreground">
                  <Icon className="size-4 shrink-0" />
                  {label}
                </span>
                <span className="text-xs font-normal text-muted-foreground">{description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
