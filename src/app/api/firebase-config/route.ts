import { NextResponse } from "next/server";

import { getFirebaseClientConfig } from "@/lib/env";

/**
 * Serves the Firebase **web** client config from server env at **request** time.
 * Next.js inlines `NEXT_PUBLIC_*` only at build; App Hosting sometimes exposes
 * the same variables only to the running container — then the browser bundle has
 * empty strings until this endpoint supplies them.
 *
 * Web API keys are public by design; security is enforced by Firebase rules.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const config = getFirebaseClientConfig();
  if (!config.apiKey?.trim()) {
    return NextResponse.json(
      { error: "not_configured", message: "Set NEXT_PUBLIC_FIREBASE_* on the App Hosting backend." },
      { status: 503 }
    );
  }
  return NextResponse.json(config, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
