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
import type { IntakeDocument } from "@/types/intakeEnrollmentAssessment";
import { intakeSchema, type IntakeSchema } from "@/features/intake/schemas";

export interface IntakeFormProps {
  existing: IntakeDocument | null;
  onSaveDraft: (data: IntakeSchema) => Promise<void>;
  onSubmit: (data: IntakeSchema) => Promise<void>;
  isSaving: boolean;
}

const defaultValues: IntakeSchema = {
  reasonForInitialCall: "",
  whatTheyHaveTried: "",
  presentingChallenges: "",
  demographics: {},
};

function toDefaultValues(doc: IntakeDocument | null): IntakeSchema {
  if (!doc) return defaultValues;
  return {
    reasonForInitialCall: doc.reasonForInitialCall ?? "",
    whatTheyHaveTried: doc.whatTheyHaveTried ?? "",
    presentingChallenges: doc.presentingChallenges ?? "",
    demographics: (doc.demographics as IntakeSchema["demographics"]) ?? {},
  };
}

export function IntakeForm({ existing, onSaveDraft, onSubmit, isSaving }: IntakeFormProps) {
  const form = useForm<IntakeSchema>({
    resolver: zodResolver(intakeSchema) as Resolver<IntakeSchema>,
    defaultValues: toDefaultValues(existing),
  });

  useEffect(() => {
    form.reset(toDefaultValues(existing));
  }, [existing, form]);

  const handleSaveDraft = form.handleSubmit(async (data: IntakeSchema) => {
    await onSaveDraft(data);
  });

  const handleSubmit = form.handleSubmit(async (data: IntakeSchema) => {
    await onSubmit(data);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Intake form</CardTitle>
        <CardDescription>
          Reason for call, what they have tried, presenting challenges, and demographics.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          <FormField>
            <Label htmlFor="reasonForInitialCall">Reason for initial call *</Label>
            <Controller
              control={form.control}
              name="reasonForInitialCall"
              render={({ field, fieldState }) => (
                <>
                  <Textarea
                    id="reasonForInitialCall"
                    placeholder="Why did the family reach out?"
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
            <Label htmlFor="whatTheyHaveTried">What they have tried *</Label>
            <Controller
              control={form.control}
              name="whatTheyHaveTried"
              render={({ field, fieldState }) => (
                <>
                  <Textarea
                    id="whatTheyHaveTried"
                    placeholder="Previous efforts or supports"
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
            <Label htmlFor="presentingChallenges">Presenting challenges *</Label>
            <Controller
              control={form.control}
              name="presentingChallenges"
              render={({ field, fieldState }) => (
                <>
                  <Textarea
                    id="presentingChallenges"
                    placeholder="Current challenges or barriers"
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

          <div className="rounded-lg border p-4">
            <h3 className="mb-3 text-sm font-medium text-foreground">Demographics</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField>
                <Label htmlFor="demographics.preferredLanguage">Preferred language</Label>
                <Controller
                  control={form.control}
                  name="demographics.preferredLanguage"
                  render={({ field }) => (
                    <Input id="demographics.preferredLanguage" placeholder="e.g. English" {...field} />
                  )}
                />
              </FormField>
              <FormField>
                <Label htmlFor="demographics.householdSize">Household size</Label>
                <Controller
                  control={form.control}
                  name="demographics.householdSize"
                  render={({ field }) => (
                    <Input
                      id="demographics.householdSize"
                      type="number"
                      min={0}
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      value={field.value ?? ""}
                    />
                  )}
                />
              </FormField>
              <FormField>
                <Label htmlFor="demographics.numberOfAdults">Number of adults</Label>
                <Controller
                  control={form.control}
                  name="demographics.numberOfAdults"
                  render={({ field }) => (
                    <Input
                      id="demographics.numberOfAdults"
                      type="number"
                      min={0}
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      value={field.value ?? ""}
                    />
                  )}
                />
              </FormField>
              <FormField>
                <Label htmlFor="demographics.numberOfChildren">Number of children</Label>
                <Controller
                  control={form.control}
                  name="demographics.numberOfChildren"
                  render={({ field }) => (
                    <Input
                      id="demographics.numberOfChildren"
                      type="number"
                      min={0}
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      value={field.value ?? ""}
                    />
                  )}
                />
              </FormField>
              <FormField className="sm:col-span-2">
                <Label htmlFor="demographics.zipCode">ZIP code</Label>
                <Controller
                  control={form.control}
                  name="demographics.zipCode"
                  render={({ field }) => (
                    <Input id="demographics.zipCode" placeholder="e.g. 12345" {...field} />
                  )}
                />
              </FormField>
            </div>
          </div>

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
              {isSaving ? "Submitting…" : "Submit intake"}
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
