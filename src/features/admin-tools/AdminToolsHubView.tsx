"use client";

import Link from "next/link";
import {
  Building2,
  ClipboardList,
  FileStack,
  GitBranch,
  ListChecks,
  MapPin,
  School,
  ScrollText,
  Settings,
  Users,
  CalendarDays,
  Handshake,
  BarChart3,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants";
import { cn } from "@/lib/utils";
import { MULTI_ORG_ONBOARDING_STEPS } from "@/lib/multiOrgOnboarding";

const managementTools = [
  {
    href: ROUTES.ADMIN_TOOLS_STAFF,
    title: "Staff & roles",
    description: "View members, assign admin/staff/participant, activate/deactivate.",
    icon: Users,
  },
  {
    href: ROUTES.ADMIN_TOOLS_RESOURCES,
    title: "Resource directory",
    description: "Categories and community resources for referrals.",
    icon: MapPin,
  },
  {
    href: ROUTES.ADMIN_TOOLS_DOCUMENT_TEMPLATES,
    title: "Document templates",
    description: "Required document types for families.",
    icon: FileStack,
  },
  {
    href: ROUTES.ADMIN_TOOLS_WORKFLOWS,
    title: "Workflow stages",
    description: "Organization case stage labels (stored on org settings).",
    icon: GitBranch,
  },
  {
    href: ROUTES.ADMIN_SURVEYS,
    title: "Surveys",
    description: "Definitions, questions, and admin reporting.",
    icon: ClipboardList,
  },
  {
    href: ROUTES.ADMIN_SCHOOLS,
    title: "Schools",
    description: "Partner schools directory.",
    icon: School,
  },
  {
    href: ROUTES.ADMIN_PARTNERS,
    title: "Partner organizations",
    description: "Community partners.",
    icon: Handshake,
  },
  {
    href: ROUTES.ADMIN_TOOLS_AUDIT_LOGS,
    title: "Audit logs",
    description: "Recent organization-scoped audit events.",
    icon: ScrollText,
  },
  {
    href: ROUTES.ADMIN_TOOLS_ORGANIZATION,
    title: "Organization settings",
    description: "Name, status, onboarding notes, raw settings preview.",
    icon: Settings,
  },
] as const;

const reviewTools = [
  {
    href: ROUTES.ADMIN_WEEKLY_SUBMISSIONS,
    title: "Weekly agendas & reports",
    description: "Submission tables and mark reviewed.",
    icon: ListChecks,
  },
  {
    href: ROUTES.ADMIN_WEEKLY_OVERSIGHT,
    title: "Weekly oversight",
    description: "Planned vs actual rollups.",
    icon: ListChecks,
  },
  {
    href: ROUTES.ADMIN_SCHEDULE,
    title: "Staff schedule",
    description: "Organization calendar entries.",
    icon: CalendarDays,
  },
  {
    href: ROUTES.ADMIN_REPORTING,
    title: "Reporting & analytics",
    description: "Segments, exports, metrics.",
    icon: BarChart3,
  },
] as const;

export function AdminToolsHubView() {
  return (
    <div className="space-y-10">
      <div className="flex flex-wrap gap-2">
        <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={ROUTES.ADMIN}>
          Command center
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-5" />
            Multi-organization readiness
          </CardTitle>
          <CardDescription>
            The app is tenant-scoped by <code className="rounded bg-muted px-1">organizationId</code>. Use this checklist when
            onboarding a new org (invites and Cloud Functions can automate later).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            {MULTI_ORG_ONBOARDING_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Configure</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {managementTools.map(({ href, title, description, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-auto min-h-[100px] w-full flex-col items-start gap-2 whitespace-normal py-4 text-left",
                )}
              >
                <span className="flex items-center gap-2 font-semibold text-foreground">
                  <Icon className="size-4 shrink-0" />
                  {title}
                </span>
                <span className="text-xs font-normal text-muted-foreground">{description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Review & operations</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {reviewTools.map(({ href, title, description, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  buttonVariants({ variant: "secondary" }),
                  "h-auto min-h-[88px] w-full flex-col items-start gap-2 whitespace-normal py-4 text-left",
                )}
              >
                <span className="flex items-center gap-2 font-semibold text-foreground">
                  <Icon className="size-4 shrink-0" />
                  {title}
                </span>
                <span className="text-xs font-normal text-muted-foreground">{description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
