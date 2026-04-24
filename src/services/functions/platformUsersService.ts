import { httpsCallable } from "firebase/functions";

import { ensureFirebaseAppAsync, getFirebaseFunctions } from "@/services/firebase/client";
import type { PlatformUserRow } from "@/types/platformUsers";

type PlatformUsersResult = {
  users: PlatformUserRow[];
};

function guardFunctions(): import("firebase/functions").Functions {
  const functions = getFirebaseFunctions();
  if (!functions) {
    throw new Error("Firebase Functions is not initialized (e.g. during SSR).");
  }
  return functions;
}

export async function getPlatformUsers(): Promise<PlatformUserRow[]> {
  await ensureFirebaseAppAsync();
  const functions = guardFunctions();
  const callable = httpsCallable<Record<string, never>, PlatformUsersResult>(functions, "getPlatformUsers");
  const result = await callable({});
  return result.data.users ?? [];
}
