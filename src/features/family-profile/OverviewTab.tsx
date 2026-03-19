"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { ROUTES } from "@/constants";
import { AddFamilyMemberSheet } from "@/features/family-profile/AddFamilyMemberSheet";
import { FamilyMemberCard } from "@/features/family-profile/FamilyMemberCard";
import { FamilySummaryCard } from "@/features/family-profile/FamilySummaryCard";
import { PrimaryContactCard } from "@/features/family-profile/PrimaryContactCard";
import { RecentInteractionsList } from "@/features/family-profile/RecentInteractionsList";
import type { FamilyProfileData } from "@/types/familyProfile";

export interface OverviewTabProps {
  data: FamilyProfileData;
  onMemberAdded?: () => void;
}

export function OverviewTab({ data, onMemberAdded }: OverviewTabProps) {
  const { summary, members, recentInteractions } = data;
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <FamilySummaryCard summary={summary} />
        <PrimaryContactCard summary={summary} />
      </div>

      <Section
        title="Workflow forms"
        description="Intake, enrollment, and assessment."
      >
        <div className="flex flex-wrap gap-2">
          <Link
            className={buttonVariants({ variant: "outline", size: "sm" })}
            href={ROUTES.STAFF_FAMILY_INTAKE(summary.familyId)}
          >
            Intake
          </Link>
          <Link
            className={buttonVariants({ variant: "outline", size: "sm" })}
            href={ROUTES.STAFF_FAMILY_ENROLLMENT(summary.familyId)}
          >
            Enrollment
          </Link>
          <Link
            className={buttonVariants({ variant: "outline", size: "sm" })}
            href={ROUTES.STAFF_FAMILY_ASSESSMENT(summary.familyId)}
          >
            Assessment
          </Link>
        </div>
      </Section>

      <Section
        title="Family members"
        description="Household members linked to this family."
        action={<AddFamilyMemberSheet familyId={summary.familyId} onAdded={onMemberAdded} />}
      >
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <li key={member.memberId}>
              <FamilyMemberCard member={member} />
            </li>
          ))}
        </ul>
      </Section>

      <RecentInteractionsList interactions={recentInteractions} />
    </div>
  );
}
