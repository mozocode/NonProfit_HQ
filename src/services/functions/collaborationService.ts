import { httpsCallable } from "firebase/functions";

import { ensureFirebaseAppAsync, getFirebaseFunctions } from "@/services/firebase/client";

function guardFunctions(): import("firebase/functions").Functions {
  const functions = getFirebaseFunctions();
  if (!functions) {
    throw new Error("Firebase Functions is not initialized (e.g. during SSR).");
  }
  return functions;
}

export type ReferralHandoffView = {
  handoffId: string;
  sourceOrganizationId: string;
  targetOrganizationId: string;
  familyId: string | null;
  participantProfileId: string | null;
  summary: string;
  requestedByUid: string;
  status: "draft" | "pending_acceptance" | "accepted" | "in_progress" | "closed" | "rejected";
  acceptedByUid: string | null;
  updatedAtIso: string | null;
};

export async function createReferralHandoff(input: {
  targetOrganizationId: string;
  familyId?: string | null;
  participantProfileId?: string | null;
  summary: string;
}): Promise<{ handoffId: string }> {
  await ensureFirebaseAppAsync();
  const callable = httpsCallable<typeof input, { ok: true; handoffId: string }>(
    guardFunctions(),
    "createReferralHandoff",
  );
  const result = await callable(input);
  return { handoffId: result.data.handoffId };
}

export async function listMyReferralHandoffs(): Promise<ReferralHandoffView[]> {
  await ensureFirebaseAppAsync();
  const callable = httpsCallable<Record<string, never>, { handoffs: ReferralHandoffView[] }>(
    guardFunctions(),
    "listMyReferralHandoffs",
  );
  const result = await callable({});
  return result.data.handoffs ?? [];
}

export async function updateReferralHandoffStatus(
  handoffId: string,
  status: "pending_acceptance" | "accepted" | "in_progress" | "closed" | "rejected",
): Promise<void> {
  await ensureFirebaseAppAsync();
  const callable = httpsCallable<{ handoffId: string; status: string }, { ok: true }>(
    guardFunctions(),
    "updateReferralHandoffStatus",
  );
  await callable({ handoffId, status });
}

export async function setSharingConsent(
  handoffId: string,
  allowedFields: string[],
  participantProfileId?: string,
): Promise<void> {
  await ensureFirebaseAppAsync();
  const callable = httpsCallable<
    { handoffId: string; allowedFields: string[]; participantProfileId?: string },
    { ok: true; consentId: string }
  >(guardFunctions(), "setSharingConsent");
  await callable({ handoffId, allowedFields, participantProfileId });
}
