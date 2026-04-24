import { httpsCallable } from "firebase/functions";

import { ensureFirebaseAppAsync, getFirebaseFunctions } from "@/services/firebase/client";
import type { PlatformOverview } from "@/types/platformAdmin";

function guardFunctions(): import("firebase/functions").Functions {
  const functions = getFirebaseFunctions();
  if (!functions) {
    throw new Error("Firebase Functions is not initialized (e.g. during SSR).");
  }
  return functions;
}

export async function getPlatformOverview(): Promise<PlatformOverview> {
  await ensureFirebaseAppAsync();
  const functions = guardFunctions();
  const callable = httpsCallable<Record<string, never>, PlatformOverview>(functions, "getPlatformOverview");
  const result = await callable({});
  return result.data;
}

type CreatePlatformOrganizationPayload = {
  organizationName: string;
  switchToNewOrg?: boolean;
};

type CreatePlatformOrganizationResponse = {
  ok: true;
  organizationId: string;
};

export async function createPlatformOrganization(organizationName: string): Promise<CreatePlatformOrganizationResponse> {
  await ensureFirebaseAppAsync();
  const functions = guardFunctions();
  const callable = httpsCallable<CreatePlatformOrganizationPayload, CreatePlatformOrganizationResponse>(
    functions,
    "createPlatformOrganization",
  );
  const result = await callable({ organizationName, switchToNewOrg: false });
  return result.data;
}

type UpdatePlatformOrganizationStatusPayload = {
  organizationId: string;
  status: "active" | "inactive";
};

type DeletePlatformOrganizationPayload = {
  organizationId: string;
};

export async function updatePlatformOrganizationStatus(
  organizationId: string,
  status: "active" | "inactive",
): Promise<void> {
  await ensureFirebaseAppAsync();
  const functions = guardFunctions();
  const callable = httpsCallable<UpdatePlatformOrganizationStatusPayload, { ok: true }>(
    functions,
    "updatePlatformOrganizationStatus",
  );
  await callable({ organizationId, status });
}

export async function deletePlatformOrganization(organizationId: string): Promise<void> {
  await ensureFirebaseAppAsync();
  const functions = guardFunctions();
  const callable = httpsCallable<DeletePlatformOrganizationPayload, { ok: true }>(functions, "deletePlatformOrganization");
  await callable({ organizationId });
}
