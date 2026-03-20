import {
  getIdTokenResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type User,
} from "firebase/auth";

import { getFirebaseAuth } from "@/services/firebase/client";
import type { AuthUser } from "@/types/auth";

function guardAuth(): Auth {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase Auth is not initialized (e.g. during SSR).");
  return auth;
}

async function mapUser(user: User): Promise<AuthUser> {
  const token = await getIdTokenResult(user);
  const roleClaim = token.claims.role;
  const orgClaim = token.claims.orgId;

  return {
    uid: user.uid,
    email: user.email ?? null,
    displayName: user.displayName ?? null,
    orgId: typeof orgClaim === "string" ? orgClaim : null,
    role: roleClaim === "admin" || roleClaim === "staff" || roleClaim === "participant" ? roleClaim : null,
  };
}

export const authService = {
  async login(email: string, password: string): Promise<AuthUser> {
    const auth = guardAuth();
    const result = await signInWithEmailAndPassword(auth, email, password);
    return mapUser(result.user);
  },
  async logout(): Promise<void> {
    const auth = guardAuth();
    await signOut(auth);
  },
  subscribe(handler: (user: AuthUser | null) => void): () => void {
    const auth = getFirebaseAuth();
    if (!auth) {
      handler(null);
      return () => {};
    }
    return onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        handler(null);
        return;
      }
      mapUser(firebaseUser)
        .then((authUser) => handler(authUser))
        .catch(() => handler(null));
    });
  },
};
