import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants";

export function ParticipantDashboardView() {
  return (
    <div className="space-y-4">
      <Link className={buttonVariants({ variant: "outline" })} href={ROUTES.PARTICIPANT_SURVEYS}>
        Open surveys
      </Link>
      <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardDescription>Current Goals</CardDescription>
          <CardTitle>4 active goals</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Required Documents</CardDescription>
          <CardTitle>2 pending uploads</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Upcoming Appointments</CardDescription>
          <CardTitle>1 this week</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Referral Status</CardDescription>
          <CardTitle>3 referrals in progress</CardTitle>
        </CardHeader>
      </Card>
    </div>
    </div>
  );
}
