"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants";

export function StaffCasesView() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Case Timeline</CardTitle>
        <CardDescription>
          Unified intake-to-service workflow for operational case management.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-600">
          Start from a family profile to continue intake, enrollment, assessment, goals, and documentation in one flow.
        </p>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
          <li>Capture inbound interest in <Link className="text-emerald-700 hover:underline" href={ROUTES.STAFF_ADMIN_INQUIRIES}>Inquiries</Link>.</li>
          <li>Create or open a family case and complete intake, enrollment, and assessment.</li>
          <li>Track goals, tasks, and required documentation in the family workspace.</li>
          <li>Apply documentation packs from <Link className="text-emerald-700 hover:underline" href={ROUTES.STAFF_ADMIN_TEMPLATES}>Templates</Link> for billing-ready evidence.</li>
          <li>Use handoff workflow when collaboration with another organization is required.</li>
        </ol>
        <div className="flex flex-wrap gap-2">
          <Link className={buttonVariants({ size: "sm", variant: "outline" })} href={ROUTES.STAFF}>
            Open staff dashboard
          </Link>
          <Link className={buttonVariants({ size: "sm", variant: "outline" })} href={ROUTES.STAFF_ADMIN_INQUIRIES}>
            Open inquiries
          </Link>
          <Link className={buttonVariants({ size: "sm" })} href={ROUTES.STAFF_RESOURCES}>
            Open resource referrals
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
