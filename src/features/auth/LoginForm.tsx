"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants";
import { loginSchema, type LoginSchema } from "@/features/auth/loginSchema";
import { authService } from "@/services/auth/authService";

export function LoginForm() {
  const router = useRouter();

  const { control, handleSubmit, formState } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginSchema) => {
    await authService.login(values.email, values.password);
    router.replace("/");
  };

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>Access your nonprofit workspace and role dashboard.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
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
