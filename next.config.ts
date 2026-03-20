import type { NextConfig } from "next";

const FIREBASE_PUBLIC_KEYS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

/** Warn during `next build` when client Firebase config is missing (common App Hosting mistake). */
function warnIfFirebaseEnvMissingAtBuild(): void {
  const isBuild =
    process.env.npm_lifecycle_event === "build" || process.argv.includes("build");
  if (!isBuild) return;
  const missing = FIREBASE_PUBLIC_KEYS.filter((k) => !process.env[k]?.trim());
  if (missing.length === 0) return;
  console.error(
    "\n[NonProfit HQ] Missing Firebase web config at build time:\n  ",
    missing.join(", "),
    "\nSign-in will fail in production. Set these on Firebase App Hosting (Backend → Environment) with availability including BUILD, then redeploy.\nSee docs/DEPLOYMENT.md.\n"
  );
}

warnIfFirebaseEnvMissingAtBuild();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      // Browsers request /favicon.ico; we ship app/icon.svg — avoid 403 on Hosting.
      { source: "/favicon.ico", destination: "/icon.svg" },
    ];
  },
};

export default nextConfig;
