"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Select } from "@/components/ui/select";
import type { EnrollmentDocument } from "@/types/intakeEnrollmentAssessment";
import { enrollmentSchema, type EnrollmentSchema } from "@/features/enrollment/schemas";

const programOptions = [
  { value: "", label: "Select program" },
  { value: "program_1", label: "Case management" },
  { value: "program_2", label: "Referrals" },
  { value: "program_3", label: "Family support" },
];

export interface EnrollmentFormProps {
  existing: EnrollmentDocument | null;
  onSaveDraft: (data: EnrollmentSchema) => Promise<void>;
  onSubmit: (data: EnrollmentSchema) => Promise<void>;
  isSaving: boolean;
}

function toDefaultValues(doc: EnrollmentDocument | null): EnrollmentSchema {
  if (!doc) {
    return {
      programId: null,
      enrollmentNotes: "",
      startDate: "",
      agreedToTerms: false,
    };
  }
  return {
    programId: doc.programId,
    enrollmentNotes: doc.enrollmentNotes ?? "",
    startDate: doc.startDate,
    agreedToTerms: true,
  };
}

export function EnrollmentForm({ existing, onSaveDraft, onSubmit, isSaving }: EnrollmentFormProps) {
  const form = useForm<EnrollmentSchema>({
    resolver: zodResolver(enrollmentSchema) as Resolver<EnrollmentSchema>,
    defaultValues: toDefaultValues(existing),
  });

  useEffect(() => {
    form.reset(toDefaultValues(existing));
  }, [existing, form]);

  const handleSaveDraft = form.handleSubmit(async (data: EnrollmentSchema) => {
    await onSaveDraft(data);
  });

  const handleSubmit = form.handleSubmit(async (data: EnrollmentSchema) => {
    await onSubmit(data);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enrollment form</CardTitle>
        <CardDescription>Program enrollment and start date.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          <FormField>
            <Label>Program</Label>
            <Controller
              control={form.control}
              name="programId"
              render={({ field, fieldState }) => (
                <>
                  <Select
                    options={programOptions}
                    placeholder="Select program"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                  />
                  {fieldState.error && (
                    <p className="text-xs text-destructive">{fieldState.error.message}</p>
                  )}
                </>
              )}
            />
          </FormField>

          <FormField>
            <Label htmlFor="startDate">Start date *</Label>
            <Controller
              control={form.control}
              name="startDate"
              render={({ field, fieldState }) => (
                <>
                  <DatePicker id="startDate" {...field} />
                  {fieldState.error && (
                    <p className="text-xs text-destructive">{fieldState.error.message}</p>
                  )}
                </>
              )}
            />
          </FormField>

          <FormField>
            <Label htmlFor="enrollmentNotes">Enrollment notes</Label>
            <Controller
              control={form.control}
              name="enrollmentNotes"
              render={({ field }) => (
                <Textarea
                  id="enrollmentNotes"
                  placeholder="Optional notes"
                  rows={3}
                  {...field}
                />
              )}
            />
          </FormField>

          <FormField>
            <Controller
              control={form.control}
              name="agreedToTerms"
              render={({ field, fieldState }) => (
                <>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="agreedToTerms"
                      checked={field.value === true}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="h-4 w-4 rounded border-input"
                    />
                    <Label htmlFor="agreedToTerms" className="font-normal">
                      I agree to the program terms *
                    </Label>
                  </div>
                  {fieldState.error && (
                    <p className="text-xs text-destructive">{fieldState.error.message}</p>
                  )}
                </>
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
              {isSaving ? "Submitting…" : "Submit enrollment"}
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
