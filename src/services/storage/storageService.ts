import { getDownloadURL, ref, uploadBytes, type FirebaseStorage } from "firebase/storage";

import { withRetry } from "@/lib/retry";
import { getFirebaseStorageInstance } from "@/services/firebase/client";

function guardStorage(): FirebaseStorage {
  const s = getFirebaseStorageInstance();
  if (!s) throw new Error("Firebase Storage is not initialized (e.g. during SSR).");
  return s;
}

/** Path for family documents: organizations/{orgId}/families/{familyId}/documents/{documentId}/{fileName}. Reusable by mobile. */
export function buildFamilyDocumentPath(
  organizationId: string,
  familyId: string,
  documentId: string,
  fileName: string
): string {
  const sanitized = fileName.replace(/[#\[\]*?]/g, "_");
  return `organizations/${organizationId}/families/${familyId}/documents/${documentId}/${sanitized}`;
}

export const storageService = {
  async uploadOrgFile(path: string, data: Blob): Promise<string> {
    const s = guardStorage();
    const fileRef = ref(s, path);
    await withRetry(() => uploadBytes(fileRef, data), { maxAttempts: 3, baseDelayMs: 500 });
    return getDownloadURL(fileRef);
  },

  /** Upload a family document. Returns the storage path (same path mobile can use). */
  async uploadFamilyDocument(
    organizationId: string,
    familyId: string,
    documentId: string,
    file: File
  ): Promise<string> {
    const s = guardStorage();
    const path = buildFamilyDocumentPath(organizationId, familyId, documentId, file.name);
    const fileRef = ref(s, path);
    await withRetry(() => uploadBytes(fileRef, file), { maxAttempts: 3, baseDelayMs: 500 });
    return path;
  },

  async getDocumentDownloadUrl(path: string): Promise<string> {
    const s = guardStorage();
    return getDownloadURL(ref(s, path));
  },
};
