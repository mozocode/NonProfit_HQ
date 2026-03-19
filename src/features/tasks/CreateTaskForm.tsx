"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import type { CreateTaskInput } from "@/types/goalsTasks";

const ASSIGNEE_TYPE_OPTIONS = [
  { value: "", label: "Unassigned" },
  { value: "staff", label: "Staff" },
  { value: "parent", label: "Parent" },
  { value: "child", label: "Child / family member" },
];

export interface CreateTaskFormProps {
  onSubmit: (input: CreateTaskInput) => Promise<void>;
  isSubmitting: boolean;
  staffOptions?: { value: string; label: string }[];
  familyMemberOptions?: { value: string; label: string }[];
}

export function CreateTaskForm({
  onSubmit,
  isSubmitting,
  staffOptions = [],
  familyMemberOptions = [],
}: CreateTaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assigneeType, setAssigneeType] = useState<CreateTaskInput["assigneeType"]>(null);
  const [assigneeId, setAssigneeId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      dueDate: dueDate.trim() || null,
      assigneeType: assigneeType || null,
      assigneeId: assigneeId.trim() || null,
    });
  };

  const optionsForType =
    assigneeType === "staff"
      ? staffOptions
      : assigneeType === "parent" || assigneeType === "child"
        ? familyMemberOptions
        : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add task</CardTitle>
        <CardDescription>Create a task under this goal. Optionally assign to staff or family member.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="dueDate">Due date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="assigneeType">Assignee type</Label>
            <Select
              id="assigneeType"
              options={ASSIGNEE_TYPE_OPTIONS}
              value={assigneeType ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setAssigneeType(v ? (v as CreateTaskInput["assigneeType"]) : null);
                setAssigneeId("");
              }}
            />
          </div>
          {assigneeType && optionsForType.length > 0 && (
            <div>
              <Label htmlFor="assigneeId">Assignee</Label>
              <Select
                id="assigneeId"
                options={[{ value: "", label: "Select…" }, ...optionsForType]}
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
              />
            </div>
          )}
          {assigneeType && optionsForType.length === 0 && (
            <div>
              <Label htmlFor="assigneeId">Assignee ID</Label>
              <Input
                id="assigneeId"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                placeholder="Staff UID or member ID"
              />
            </div>
          )}
          <Button type="submit" disabled={isSubmitting || !title.trim()}>
            {isSubmitting ? "Creating…" : "Create task"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
