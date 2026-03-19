"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants";
import { cn } from "@/lib/utils";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Access denied</CardTitle>
          <CardDescription>You don’t have permission to view this page.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Link className={cn(buttonVariants({ variant: "default" }))} href={ROUTES.SIGN_IN}>
            Go to sign in
          </Link>
          <Link className={cn(buttonVariants({ variant: "outline" }))} href={ROUTES.HOME}>
            Back to home
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
