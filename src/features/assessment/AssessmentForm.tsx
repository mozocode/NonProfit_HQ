"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import type { AssessmentDocument } from "@/types/intakeEnrollmentAssessment";
import { assessmentSchema, type AssessmentSchema } from "@/features/assessment/schemas";

const assessmentTypeOptions = [
  { value: "initial", label: "Initial assessment" },
  { value: "follow_up", label: "Follow-up assessment" },
  { value: "annual", label: "Annual assessment" },
];

export interface AssessmentFormProps {
  existing: AssessmentDocument | null;
  onSaveDraft: (data: AssessmentSchema) => Promise<void>;
  onSubmit: (data: AssessmentSchema) => Promise<void>;
  isSaving: boolean;
}

function toDefaultValues(doc: AssessmentDocument | null): AssessmentSchema {
  if (!doc) {
    return {
      assessmentType: "",
      strengths: "",
      needs: "",
      goalsSummary: "",
      recommendedServices: "",
      additionalNotes: "",
    };
  }
  return {
    assessmentType: doc.type,
    strengths: doc.strengths ?? "",
    needs: doc.needs ?? "",
    goalsSummary: doc.goalsSummary ?? "",
    recommendedServices: doc.recommendedServices ?? "",
    additionalNotes: doc.additionalNotes ?? "",
  };
}

export function AssessmentForm({ existing, onSaveDraft, onSubmit, isSaving }: AssessmentFormProps) {
  const form = useForm<AssessmentSchema>({
    resolver: zodResolver(assessmentSchema) as Resolver<AssessmentSchema>,
    defaultValues: toDefaultValues(existing),
  });

  useEffect(() => {
    form.reset(toDefaultValues(existing));
  }, [existing, form]);

  const handleSaveDraft = form.handleSubmit(async (data: AssessmentSchema) => {
    await onSaveDraft(data);
  });

  const handleSubmit = form.handleSubmit(async (data: AssessmentSchema) => {
    await onSubmit(data);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assessment form</CardTitle>
        <CardDescription>
          Strengths, needs, goals summary, and recommended services.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          <FormField>
            <Label>Assessment type *</Label>
            <Controller
              control={form.control}
              name="assessmentType"
              render={({ field, fieldState }) => (
                <>
                  <Select
                    options={assessmentTypeOptions}
                    placeholder="Select type"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                  {fieldState.error && (
                    <p className="text-xs text-destructive">{fieldState.error.message}</p>
                  )}
                </>
              )}
            />
          </FormField>

          <FormField>
            <Label htmlFor="strengths">Strengths *</Label>
            <Controller
              control={form.control}
              name="strengths"
              render={({ field, fieldState }) => (
                <>
                  <Textarea id="strengths" placeholder="Family strengths" rows={3} {...field} />
                  {fieldState.error && (
                    <p className="text-xs text-destructive">{fieldState.error.message}</p>
                  )}
                </>
              )}
            />
          </FormField>

          <FormField>
            <Label htmlFor="needs">Needs *</Label>
            <Controller
              control={form.control}
              name="needs"
              render={({ field, fieldState }) => (
                <>
                  <Textarea id="needs" placeholder="Identified needs" rows={3} {...field} />
                  {fieldState.error && (
                    <p className="text-xs text-destructive">{fieldState.error.message}</p>
                  )}
                </>
              )}
            />
          </FormField>

          <FormField>
            <Label htmlFor="goalsSummary">Goals summary *</Label>
            <Controller
              control={form.control}
              name="goalsSummary"
              render={({ field, fieldState }) => (
                <>
                  <Textarea
                    id="goalsSummary"
                    placeholder="Summary of goals"
                    rows={3}
                    {...field}
                  />
                  {fieldState.error && (
                    <p className="text-xs text-destructive">{fieldState.error.message}</p>
                  )}
                </>
              )}
            />
          </FormField>

          <FormField>
            <Label htmlFor="recommendedServices">Recommended services</Label>
            <Controller
              control={form.control}
              name="recommendedServices"
              render={({ field }) => (
                <Input
                  id="recommendedServices"
                  placeholder="e.g. Case management, Referrals"
                  {...field}
                />
              )}
            />
          </FormField>

          <FormField>
            <Label htmlFor="additionalNotes">Additional notes</Label>
            <Controller
              control={form.control}
              name="additionalNotes"
              render={({ field }) => (
                <Textarea id="additionalNotes" placeholder="Optional" rows={2} {...field} />
              )}
            />
          </FormField>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={handleSaveDraft}
            >
              {isSaving ? "Saving…" : "Save draft"}
            </Button>
            <Button type="button" disabled={isSaving} onClick={handleSubmit}>
              {isSaving ? "Submitting…" : "Submit assessment"}
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
