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
  const result = await callable({ organizationName, switchToNewOrg: true });
  return result.data;
}
