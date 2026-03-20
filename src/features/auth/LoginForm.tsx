"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FirebaseError } from "firebase/app";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants";
import { loginSchema, type LoginSchema } from "@/features/auth/loginSchema";
import { authService } from "@/services/auth/authService";
import { getFirebaseAuth } from "@/services/firebase/client";

function mapAuthError(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case "auth/missing-client-config":
        return "This deployment is missing Firebase web configuration. In Firebase Console → App Hosting → your backend → Environment, add every NEXT_PUBLIC_FIREBASE_* value from your Web app config, ensure they apply to the BUILD step, then trigger a new rollout.";
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Invalid email or password.";
      case "auth/invalid-email":
        return "Enter a valid email address.";
      case "auth/user-disabled":
        return "This account has been disabled.";
      case "auth/too-many-requests":
        return "Too many attempts. Try again later.";
      default:
        return err.message || "Sign in failed. Please try again.";
    }
  }
  if (err instanceof Error && (err.message.includes("not initialized") || err.message.includes("not configured"))) {
    return mapAuthError(new FirebaseError("auth/missing-client-config", err.message));
  }
  return "Sign in failed. Please try again.";
}

export function LoginForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  /** Only after mount — firebase client is null during SSR, avoid hydration mismatch. */
  const [configMissing, setConfigMissing] = useState(false);
  useEffect(() => {
    setConfigMissing(!getFirebaseAuth());
  }, []);

  const { control, handleSubmit, formState } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginSchema) => {
    setSubmitError(null);
    try {
      await authService.login(values.email, values.password);
      router.replace("/");
    } catch (err) {
      setSubmitError(mapAuthError(err));
    }
  };

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>Access your nonprofit workspace and role dashboard.</CardDescription>
      </CardHeader>
      <CardContent>
        {configMissing ? (
          <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Firebase is not configured in this build (missing <code className="text-xs">NEXT_PUBLIC_FIREBASE_*</code>).
            Add them in Firebase App Hosting env or your deploy pipeline, then redeploy.
          </p>
        ) : null}
        <form
          className="space-y-4"
          onSubmit={(e) => {
            void handleSubmit(onSubmit)(e).catch((err: unknown) => setSubmitError(mapAuthError(err)));
          }}
        >
          {submitError ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {submitError}
            </p>
          ) : null}
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
                <Input autoComplete="current-password" placeholder="********" type="password" {...field} />
                {fieldState.error ? <p className="text-xs text-red-600">{fieldState.error.message}</p> : null}
                <p className="text-right">
                  <Link
                    className="text-xs text-slate-600 underline hover:text-slate-900"
                    href={ROUTES.FORGOT_PASSWORD}
                  >
                    Forgot password?
                  </Link>
                </p>
              </div>
            )}
          />

          <Button className="w-full" disabled={formState.isSubmitting} type="submit">
            {formState.isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
