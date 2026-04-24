"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FirebaseError } from "firebase/app";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants";
import { signUpSchema, type SignUpSchema } from "@/features/auth/signUpSchema";
import { authService } from "@/services/auth/authService";
import { bootstrapOrganization } from "@/services/functions/onboardingService";

function mapSignUpError(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case "auth/email-already-in-use":
        return "An account with this email already exists.";
      case "auth/invalid-email":
        return "Enter a valid email address.";
      case "auth/weak-password":
        return "Password is too weak. Use at least 8 characters.";
      case "functions/unauthenticated":
        return "Please sign in again and retry.";
      case "functions/already-exists":
        return "That organization name is already taken. Try a different name.";
      case "functions/invalid-argument":
        return "Please enter a valid organization name.";
      default:
        return err.message || "Sign up failed. Please try again.";
    }
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "Sign up failed. Please try again.";
}

export function SignUpForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { control, handleSubmit, formState } = useForm<SignUpSchema>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: "",
      organizationName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: SignUpSchema) => {
    setSubmitError(null);
    try {
      await authService.signUp(values.email, values.password, values.fullName);
      await bootstrapOrganization(values.organizationName);
      await authService.refreshSessionClaims();
      router.replace(ROUTES.HOME);
    } catch (err) {
      setSubmitError(mapSignUpError(err));
    }
  };

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>Create your organization</CardTitle>
        <CardDescription>Set up your admin account and nonprofit workspace.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            void handleSubmit(onSubmit)(e).catch((err: unknown) => setSubmitError(mapSignUpError(err)));
          }}
        >
          {submitError ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {submitError}
            </p>
          ) : null}

          <Controller
            control={control}
            name="fullName"
            render={({ field, fieldState }) => (
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Full name</label>
                <Input autoComplete="name" placeholder="Jane Doe" {...field} />
                {fieldState.error ? <p className="text-xs text-red-600">{fieldState.error.message}</p> : null}
              </div>
            )}
          />

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

          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <Input autoComplete="email" placeholder="you@organization.org" type="email" {...field} />
                {fieldState.error ? <p className="text-xs text-red-600">{fieldState.error.message}</p> : null}
              </div>
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field, fieldState }) => (
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Password</label>
                <Input autoComplete="new-password" placeholder="********" type="password" {...field} />
                {fieldState.error ? <p className="text-xs text-red-600">{fieldState.error.message}</p> : null}
              </div>
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field, fieldState }) => (
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Confirm password</label>
                <Input autoComplete="new-password" placeholder="********" type="password" {...field} />
                {fieldState.error ? <p className="text-xs text-red-600">{fieldState.error.message}</p> : null}
              </div>
            )}
          />

          <Button className="w-full" disabled={formState.isSubmitting} type="submit">
            {formState.isSubmitting ? "Creating workspace..." : "Create workspace"}
          </Button>

          <p className="text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link className="underline hover:text-slate-900" href={ROUTES.LOGIN}>
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
