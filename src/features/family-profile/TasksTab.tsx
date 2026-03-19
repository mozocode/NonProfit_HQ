"use client";

import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { TaskCard } from "@/components/ui/task-card";
import { ROUTES } from "@/constants";
import type { FamilyProfileData } from "@/types/familyProfile";
import { CheckSquare } from "lucide-react";

export interface TasksTabProps {
  data: FamilyProfileData;
}

export function TasksTab({ data }: TasksTabProps) {
  const { tasks, summary } = data;
  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={<CheckSquare className="size-10" />}
        title="No tasks"
        description="Tasks linked to family goals will appear here."
      />
    );
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {tasks.map((t) => (
        <li key={t.taskId}>
          <Link href={ROUTES.STAFF_TASK(t.taskId)} className="block">
            <TaskCard
              title={t.title}
              status={t.status}
              dueDate={t.dueDate ?? undefined}
              assignee={t.assigneeName ?? (t.assigneeType ? `${t.assigneeType}` : undefined)}
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
