import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getIdTokenResult,
  onIdTokenChanged,
  updateProfile,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type User,
} from "firebase/auth";

import { ensureFirebaseAppAsync, getFirebaseAuth } from "@/services/firebase/client";
import type { AuthUser } from "@/types/auth";

/** Thrown when neither build-time nor runtime `/api/firebase-config` could supply Firebase web config. */
const AUTH_CONFIG_CODE = "auth/missing-client-config";

function guardAuth(): Auth {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new FirebaseError(
      AUTH_CONFIG_CODE,
      "Firebase Auth is not configured. Set NEXT_PUBLIC_FIREBASE_* on the App Hosting backend (BUILD and/or RUNTIME), then redeploy."
    );
  }
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
  async signUp(email: string, password: string, displayName?: string): Promise<AuthUser> {
    await ensureFirebaseAppAsync();
    const auth = guardAuth();
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const nextDisplayName = displayName?.trim();
    if (nextDisplayName) {
      await updateProfile(result.user, { displayName: nextDisplayName });
    }
    return mapUser(result.user);
  },
  async login(email: string, password: string): Promise<AuthUser> {
    await ensureFirebaseAppAsync();
    const auth = guardAuth();
    const result = await signInWithEmailAndPassword(auth, email, password);
    return mapUser(result.user);
  },
  async refreshSessionClaims(): Promise<AuthUser | null> {
    await ensureFirebaseAppAsync();
    const auth = getFirebaseAuth();
    const user = auth?.currentUser;
    if (!user) return null;
    await user.getIdToken(true);
    return mapUser(user);
  },
  async logout(): Promise<void> {
    await ensureFirebaseAppAsync();
    const auth = guardAuth();
    await signOut(auth);
  },
  subscribe(handler: (user: AuthUser | null) => void): () => void {
    let innerUnsub: (() => void) | undefined;
    let cancelled = false;

    void ensureFirebaseAppAsync().then(() => {
      if (cancelled) return;
      const auth = getFirebaseAuth();
      if (!auth) {
        handler(null);
        return;
      }
      // onIdTokenChanged fires for sign-in/out and token refresh (custom claim updates).
      innerUnsub = onIdTokenChanged(auth, (firebaseUser) => {
        if (!firebaseUser) {
          handler(null);
          return;
        }
        mapUser(firebaseUser)
          .then((authUser) => handler(authUser))
          .catch(() => handler(null));
      });
    });

    return () => {
      cancelled = true;
      innerUnsub?.();
    };
  },
};
