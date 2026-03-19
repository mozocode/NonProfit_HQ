"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { StatusChip } from "@/components/ui/status-chip";
import { DueDateChip } from "@/components/ui/due-date-chip";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { ROUTES } from "@/constants";
import { useTask } from "@/hooks/useTask";
import { useTaskUpdate } from "@/hooks/useTaskUpdate";
import { TimelineItem } from "@/components/ui/timeline-item";

const STATUS_OPTIONS = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
  { value: "blocked", label: "Blocked" },
];

const ASSIGNEE_TYPE_LABEL: Record<string, string> = {
  staff: "Staff",
  parent: "Parent",
  child: "Child / family member",
};

export default function StaffTaskDetailPage() {
  const params = useParams();
  const taskId = params?.taskId as string | null;
  const { task, goal, isLoading, error, refetch } = useTask(taskId);
  const { update, addNote, isUpdating } = useTaskUpdate(
    task?.familyId ?? null,
    task?.goalId ?? null,
    taskId,
    refetch,
  );
  const [note, setNote] = useState("");
  const [statusSelect, setStatusSelect] = useState<string>("");

  if (!taskId) {
    return (
      <div className="space-y-4">
        <Link className={buttonVariants({ variant: "outline" })} href={ROUTES.STAFF}>
          Back to dashboard
        </Link>
        <p className="text-sm text-muted-foreground">Missing task ID.</p>
      </div>
    );
  }

  if (isLoading) return <LoadingState message="Loading task…" />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (!task) {
    return (
      <div className="space-y-4">
        <Link className={buttonVariants({ variant: "outline" })} href={ROUTES.STAFF}>
          Back to dashboard
        </Link>
        <p className="text-sm text-muted-foreground">Task not found.</p>
      </div>
    );
  }

  const handleStatusChange = (newStatus: "todo" | "in_progress" | "done" | "blocked") => {
    update({ status: newStatus }).catch(() => {});
  };

  const handleAddNote = () => {
    if (!note.trim()) return;
    addNote(note.trim(), "note").then(() => setNote("")).catch(() => {});
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={task.title}
        description={task.description ?? undefined}
        actions={
          <div className="flex flex-wrap gap-2">
            {task.familyId && (
              <Link className={buttonVariants({ variant: "outline" })} href={ROUTES.STAFF_FAMILY(task.familyId)}>
                Family profile
              </Link>
            )}
            {task.familyId && goal && (
              <Link
                className={buttonVariants({ variant: "outline" })}
                href={ROUTES.STAFF_FAMILY_GOAL(task.familyId, task.goalId)}
              >
                Goal
              </Link>
            )}
            <Link className={buttonVariants({ variant: "outline" })} href={ROUTES.STAFF}>
              Dashboard
            </Link>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusChip
          status={
            task.status === "todo"
              ? "pending"
              : task.status === "in_progress"
                ? "active"
                : task.status === "done"
                  ? "completed"
                  : "inactive"
          }
          label={task.status}
        />
        {task.dueDate && <DueDateChip dueDate={task.dueDate} />}
        {task.assigneeType && (
          <span className="text-sm text-muted-foreground">
            Assignee: {ASSIGNEE_TYPE_LABEL[task.assigneeType] ?? task.assigneeType}
            {task.assigneeId ? ` (${task.assigneeId})` : ""}
          </span>
        )}
      </div>

      {goal && (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium text-muted-foreground">Goal</h2>
            <p className="font-medium">{goal.title}</p>
            <Link
              className="text-sm text-primary hover:underline"
              href={ROUTES.STAFF_FAMILY_GOAL(task.familyId, goal.goalId)}
            >
              View goal →
            </Link>
          </CardHeader>
        </Card>
      )}

      <Section title="Update progress" description="Change status or add a note.">
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[160px]">
              <Label className="mb-1 block text-xs">Status</Label>
              <Select
                options={STATUS_OPTIONS}
                value={statusSelect || task.status}
                onChange={(e) => {
                  const v = e.target.value as "todo" | "in_progress" | "done" | "blocked";
                  setStatusSelect(v);
                  handleStatusChange(v);
                }}
              />
            </div>
            <Button size="sm" disabled={isUpdating} onClick={() => setStatusSelect("")}>
              Refresh
            </Button>
          </div>
          <div>
            <Label htmlFor="progress-note" className="mb-1 block text-xs">
              Add note
            </Label>
            <div className="flex gap-2">
              <Textarea
                id="progress-note"
                placeholder="Progress or follow-up note…"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-w-0 flex-1"
              />
              <Button disabled={isUpdating || !note.trim()} onClick={handleAddNote}>
                Add
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {task.taskHistory && task.taskHistory.length > 0 && (
        <Section title="Task history" description="Updates and notes.">
          <ul className="space-y-2">
            {[...task.taskHistory].reverse().map((entry, i) => (
              <li key={i}>
                <TimelineItem
                  title={entry.action === "note" ? "Note" : entry.action.replace("_", " ")}
                  description={entry.note ?? undefined}
                  timestamp={entry.at}
                />
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
