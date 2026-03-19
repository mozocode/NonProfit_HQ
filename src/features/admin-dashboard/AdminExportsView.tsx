"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants";

export function AdminExportsView() {
  return (
    <div className="space-y-4">
      <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={ROUTES.ADMIN}>
        ← Command center
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Exports</CardTitle>
          <CardDescription>
            Narrative-ready summaries and structured exports. Saved export jobs use the{" "}
            <code className="rounded bg-muted px-1 text-xs">adminReportExports</code> collection when wired.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            For grant- and newsletter-ready copy, use{" "}
            <Link className="font-medium text-primary underline-offset-4 hover:underline" href={ROUTES.ADMIN_REPORTING}>
              Reporting & analytics
            </Link>{" "}
            — export cards can be copied from there.
          </p>
          <p>CSV/XLSX bulk exports from case data can be added here or via Cloud Functions writing to Storage.</p>
        </CardContent>
      </Card>
    </div>
  );
}
