import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants";
import { cn } from "@/lib/utils";

/**
 * Placeholder forgot-password flow. In production, wire to Firebase Auth
 * sendPasswordResetEmail() or your IdP’s reset flow.
 */
export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>
            Password reset is not yet configured. Contact your organization administrator to reset
            your password or sign in with your current credentials.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Link className={cn(buttonVariants({ variant: "default" }))} href={ROUTES.LOGIN}>
            Back to sign in
          </Link>
          <Link className={cn(buttonVariants({ variant: "outline" }))} href={ROUTES.SIGN_IN}>
            Sign in
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
