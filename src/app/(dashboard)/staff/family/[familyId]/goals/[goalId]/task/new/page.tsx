"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ROUTES } from "@/constants";
import { CreateTaskForm } from "@/features/tasks/CreateTaskForm";
import { useAuth } from "@/hooks/useAuth";
import { createTask } from "@/services/firestore/goalsTasksService";
import type { CreateTaskInput } from "@/types/goalsTasks";

export default function NewTaskPage() {
  const params = useParams();
  const router = useRouter();
  const familyId = params?.familyId as string | null;
  const goalId = params?.goalId as string | null;
  const { orgId, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!familyId || !goalId) {
    return (
      <div className="space-y-4">
        <Link className={buttonVariants({ variant: "outline" })} href={ROUTES.STAFF}>
          Back to dashboard
        </Link>
        <p className="text-sm text-muted-foreground">Missing family or goal.</p>
      </div>
    );
  }

  const handleSubmit = async (input: CreateTaskInput) => {
    if (!orgId || !user?.uid) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const taskId = await createTask(orgId, familyId, goalId, user.uid, input);
      router.push(ROUTES.STAFF_TASK(taskId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create task");
      throw e;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add task"
        description="Create a task under this goal."
        actions={
          <Link className={buttonVariants({ variant: "outline" })} href={ROUTES.STAFF_FAMILY_GOAL(familyId, goalId)}>
            Cancel
          </Link>
        }
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <CreateTaskForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}
