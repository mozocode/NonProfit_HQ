"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FirebaseError } from "firebase/app";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants";
import { authService } from "@/services/auth/authService";
import { bootstrapOrganization } from "@/services/functions/onboardingService";

const createOrgSchema = z.object({
  organizationName: z.string().trim().min(2, "Enter your organization name."),
});

type CreateOrgSchema = z.infer<typeof createOrgSchema>;

function mapCreateOrgError(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case "functions/already-exists":
        return "You already belong to an organization.";
      case "functions/invalid-argument":
        return "Please enter a valid organization name.";
      default:
        return err.message || "Organization setup failed.";
    }
  }
  if (err instanceof Error) return err.message;
  return "Organization setup failed.";
}

export function CreateOrganizationForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { control, handleSubmit, formState } = useForm<CreateOrgSchema>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: { organizationName: "" },
  });

  const onSubmit = async (values: CreateOrgSchema) => {
    setSubmitError(null);
    try {
      await bootstrapOrganization(values.organizationName);
      await authService.refreshSessionClaims();
      router.replace(ROUTES.HOME);
    } catch (err) {
      setSubmitError(mapCreateOrgError(err));
    }
  };

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>Finish setup</CardTitle>
        <CardDescription>Create your organization to continue.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            void handleSubmit(onSubmit)(e).catch((err: unknown) => setSubmitError(mapCreateOrgError(err)));
          }}
        >
          {submitError ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {submitError}
            </p>
          ) : null}
          <Controller
            control={control}
            name="organizationName"
            render={({ field, fieldState }) => (
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Organization name</label>
                <Input placeholder="Hope Center" {...field} />
                {fieldState.error ? <p className="text-xs text-red-600">{fieldState.error.message}</p> : null}
              </div>
            )}
          />

          <Button className="w-full" disabled={formState.isSubmitting} type="submit">
            {formState.isSubmitting ? "Setting up..." : "Create organization"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
