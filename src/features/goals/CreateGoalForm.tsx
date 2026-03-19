"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import type { CreateGoalInput } from "@/types/goalsTasks";

const GOAL_TYPE_OPTIONS = [
  { value: "long_term", label: "Long-term" },
  { value: "short_term", label: "Short-term" },
];

export interface CreateGoalFormProps {
  onSubmit: (input: CreateGoalInput) => Promise<void>;
  isSubmitting: boolean;
}

export function CreateGoalForm({ onSubmit, isSubmitting }: CreateGoalFormProps) {
  const [goalType, setGoalType] = useState<CreateGoalInput["goalType"]>("short_term");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await onSubmit({
      goalType,
      title: title.trim(),
      description: description.trim() || null,
      targetDate: targetDate.trim() || null,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add goal</CardTitle>
        <CardDescription>Create a long-term or short-term goal for this family.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="goalType">Goal type</Label>
            <Select
              id="goalType"
              options={GOAL_TYPE_OPTIONS}
              value={goalType}
              onChange={(e) => setGoalType(e.target.value as CreateGoalInput["goalType"])}
            />
          </div>
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Goal title"
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
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="targetDate">Target date</Label>
            <Input
              id="targetDate"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={isSubmitting || !title.trim()}>
            {isSubmitting ? "Creating…" : "Create goal"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
