import { httpsCallable } from "firebase/functions";

import { ensureFirebaseAppAsync, getFirebaseFunctions } from "@/services/firebase/client";

type BootstrapOrgPayload = {
  organizationName: string;
};

type BootstrapOrgResult = {
  ok: true;
  organizationId: string;
  role: "admin";
};

function guardFunctions(): import("firebase/functions").Functions {
  const functions = getFirebaseFunctions();
  if (!functions) {
    throw new Error("Firebase Functions is not initialized (e.g. during SSR).");
  }
  return functions;
}

export async function bootstrapOrganization(organizationName: string): Promise<BootstrapOrgResult> {
  await ensureFirebaseAppAsync();
  const functions = guardFunctions();
  const callable = httpsCallable<BootstrapOrgPayload, BootstrapOrgResult>(functions, "bootstrapOrganizationForCurrentUser");
  const result = await callable({ organizationName });
  return result.data;
}
