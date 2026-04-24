import { httpsCallable } from "firebase/functions";

import { ensureFirebaseAppAsync, getFirebaseFunctions } from "@/services/firebase/client";
import type { UserOrganization } from "@/types/auth";

type ListMyOrganizationsResult = {
  organizations: UserOrganization[];
};

type SwitchActiveOrganizationPayload = {
  organizationId: string;
};

type SwitchActiveOrganizationResult = {
  ok: true;
  organizationId: string;
  role: "admin" | "staff" | "participant";
};

function guardFunctions(): import("firebase/functions").Functions {
  const functions = getFirebaseFunctions();
  if (!functions) {
    throw new Error("Firebase Functions is not initialized (e.g. during SSR).");
  }
  return functions;
}

export async function listMyOrganizations(): Promise<UserOrganization[]> {
  await ensureFirebaseAppAsync();
  const functions = guardFunctions();
  const callable = httpsCallable<Record<string, never>, ListMyOrganizationsResult>(functions, "listMyOrganizations");
  const result = await callable({});
  return result.data.organizations ?? [];
}

export async function switchActiveOrganization(organizationId: string): Promise<SwitchActiveOrganizationResult> {
  await ensureFirebaseAppAsync();
  const functions = guardFunctions();
  const callable = httpsCallable<SwitchActiveOrganizationPayload, SwitchActiveOrganizationResult>(
    functions,
    "switchActiveOrganization",
  );
  const result = await callable({ organizationId });
  return result.data;
}
