import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { withRetry } from "@/lib/retry";
import { storage } from "@/services/firebase/client";

function guardStorage(): NonNullable<typeof storage> {
  if (!storage) throw new Error("Firebase Storage is not initialized (e.g. during SSR).");
  return storage;
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

  /** Get a download URL for a document by storage path. Admin/staff use for viewing; same API for mobile. */
  async getDocumentDownloadUrl(storagePath: string): Promise<string> {
    const s = guardStorage();
    const fileRef = ref(s, storagePath);
    return getDownloadURL(fileRef);
  },
};
