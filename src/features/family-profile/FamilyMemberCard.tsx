"use client";

import { User } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { FamilyMemberView } from "@/types/familyProfile";
import { cn } from "@/lib/utils";

export interface FamilyMemberCardProps {
  member: FamilyMemberView;
  className?: string;
}

function formatDateOfBirth(dob: string | null): string {
  if (!dob) return "—";
  const d = new Date(dob);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function FamilyMemberCard({ member, className }: FamilyMemberCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="flex items-start gap-3 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <User className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-medium text-foreground">
            {member.firstName} {member.lastName}
          </p>
          <p className="text-sm text-muted-foreground">{member.relationship}</p>
          <p className="text-xs text-muted-foreground">DOB: {formatDateOfBirth(member.dateOfBirth)}</p>
          {member.isParticipant ? (
            <Badge variant="secondary" className="mt-1">
              Participant
            </Badge>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
