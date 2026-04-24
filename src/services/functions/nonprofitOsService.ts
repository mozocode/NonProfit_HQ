import { httpsCallable } from "firebase/functions";

import { ensureFirebaseAppAsync, getFirebaseFunctions } from "@/services/firebase/client";

function guardFunctions(): import("firebase/functions").Functions {
  const functions = getFirebaseFunctions();
  if (!functions) {
    throw new Error("Firebase Functions is not initialized (e.g. during SSR).");
  }
  return functions;
}

export type OrganizationEntitlement = {
  organizationId: string;
  plan: "starter" | "growth" | "professional" | "enterprise";
  enabledFeatures: string[];
  limits: {
    staffSeats: number | null;
    activeCases: number | null;
    monthlyHandoffs: number | null;
  };
  billingStatus: "trial" | "active" | "past_due" | "canceled";
};

export async function getMyOrganizationEntitlement(): Promise<OrganizationEntitlement> {
  await ensureFirebaseAppAsync();
  const callable = httpsCallable<Record<string, never>, OrganizationEntitlement>(
    guardFunctions(),
    "getMyOrganizationEntitlement",
  );
  const result = await callable({});
  return result.data;
}

export async function trackUsageMetric(
  metricKey: "inquiry_created" | "inquiry_converted" | "handoff_sent" | "handoff_accepted" | "signature_completed" | "export_generated",
  amount = 1,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await ensureFirebaseAppAsync();
  const callable = httpsCallable<
    { metricKey: string; amount?: number; metadata?: Record<string, unknown> },
    { ok: true }
  >(guardFunctions(), "trackUsageMetric");
  await callable({ metricKey, amount, metadata });
}

export async function setOrganizationDataRetention(retentionDays: number): Promise<void> {
  await ensureFirebaseAppAsync();
  const callable = httpsCallable<{ retentionDays: number }, { ok: true }>(guardFunctions(), "setOrganizationDataRetention");
  await callable({ retentionDays });
}

export async function createAuditableExport(input: {
  exportType: "case_summary" | "handoff_packet" | "billing_packet";
  reason: string;
  filters?: Record<string, unknown>;
}): Promise<{ exportId: string }> {
  await ensureFirebaseAppAsync();
  const callable = httpsCallable<typeof input, { ok: true; exportId: string }>(guardFunctions(), "createAuditableExport");
  const result = await callable(input);
  return { exportId: result.data.exportId };
}
