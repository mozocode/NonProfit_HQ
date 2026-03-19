"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { Section } from "@/components/ui/section";
import { ResourceCard } from "@/components/ui/resource-card";
import { AssignResourceSheet } from "@/features/resources/AssignResourceSheet";
import { ReferralStatusChip } from "@/features/resources/ReferralStatusChip";
import { Select } from "@/components/ui/select";
import type { FamilyProfileData } from "@/types/familyProfile";
import type { AssignedResourceView } from "@/types/resources";
import type { ResourceView } from "@/types/resources";
import type { ReferralStatus } from "@/types/domain";
import { Bookmark } from "lucide-react";

const REFERRAL_STATUS_OPTIONS: { value: ReferralStatus; label: string }[] = [
  { value: "suggested", label: "Suggested" },
  { value: "referred", label: "Referred" },
  { value: "connected", label: "Connected" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

export interface ResourcesTabProps {
  data: FamilyProfileData;
  assignmentsFromHook?: AssignedResourceView[] | null;
  isLoadingAssignments?: boolean;
  resourcesForAssign?: ResourceView[];
  isLoadingResources?: boolean;
  onAssignResource?: (resourceId: string) => Promise<void>;
  isAssigning?: boolean;
  onStatusChange?: (assignmentId: string, status: ReferralStatus) => Promise<void>;
}

export function ResourcesTab({
  data,
  assignmentsFromHook,
  isLoadingAssignments,
  resourcesForAssign = [],
  isLoadingResources,
  onAssignResource,
  isAssigning,
  onStatusChange,
}: ResourcesTabProps) {
  const useRealAssignments = assignmentsFromHook != null;
  const assignments = useRealAssignments ? assignmentsFromHook : [];
  const showAssign = useRealAssignments && onAssignResource != null && data.summary.familyId;

  if (isLoadingAssignments) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Loading resources…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showAssign && (
        <Section
          title="Assign resource"
          description="Add a resource from the directory. Participant will only see assigned resources."
          action={
            <AssignResourceSheet
              familyId={data.summary.familyId}
              resources={resourcesForAssign}
              isLoadingResources={isLoadingResources ?? false}
              onAssign={onAssignResource}
              isSubmitting={isAssigning ?? false}
            />
          }
        />
      )}
      <Section title="Assigned resources" description="Referral status can be updated below.">
        {assignments.length === 0 ? (
          <EmptyState
            icon={<Bookmark className="size-10" />}
            title="No resources assigned"
            description="Resources and referrals assigned to this family will appear here."
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {assignments.map((a) => (
              <li key={a.assignmentId}>
                <div className="space-y-2">
                  <ResourceCard
                    name={a.resource.providerName ?? a.resource.businessName ?? a.resource.name}
                    category={a.resource.categoryName ?? undefined}
                    description={a.resource.description ?? undefined}
                    link={a.resource.website ?? undefined}
                    contact={a.resource.phone ?? undefined}
                    action={
                      onStatusChange ? (
                        <Select
                          options={REFERRAL_STATUS_OPTIONS}
                          value={a.referralStatus}
                          onChange={(e) => onStatusChange(a.assignmentId, e.target.value as ReferralStatus)}
                          className="w-[140px]"
                        />
                      ) : (
                        <ReferralStatusChip status={a.referralStatus} />
                      )
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Assigned {new Date(a.assignedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
