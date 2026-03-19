# Phase 13: Documents and Upload Flows

## Overview

Family-level and optional member-level document uploads, required-document checklist, Firebase Storage uploads, and Firestore metadata with admin/staff download and status workflows. The upload path and Firestore schema are reusable by a future mobile app.

## 1. Data model

### Domain types (`src/types/domain.ts`)

- **FamilyDocument**: `organizationId`, `familyId`, `memberId` (optional for member-level), `documentId`, `templateId`, `storagePath`, `fileName`, `contentType`, `uploadedBy`, `uploadedAt`, `status` (pending | approved | rejected), `createdBy`, `createdAt`, `updatedAt`.
- **FamilyDocumentRequirement**: `organizationId`, `familyId`, `templateId`, `requirementId`, `status` (missing | uploaded | approved), `dueDate`, `completedAt`, `createdBy`, `createdAt`, `updatedAt`.
- **RequiredDocumentTemplate**: org-level; `templateId`, `name`, `documentType`, `description`.

### View types (`src/types/documents.ts`)

- **RequiredTemplateView**, **DocumentView**, **RequirementView**, **UploadDocumentInput**, **DocumentsForFamilyResult**.

### Storage path (mobile reuse)

- `organizations/{organizationId}/families/{familyId}/documents/{documentId}/{fileName}`
- Built by `buildFamilyDocumentPath()` in `src/services/storage/storageService.ts`; same path can be used by Expo for uploads/downloads.

## 2. Storage service (`src/services/storage/storageService.ts`)

- **buildFamilyDocumentPath(organizationId, familyId, documentId, fileName)**  
  Returns the Storage path; used by web and (future) mobile.
- **uploadFamilyDocument(organizationId, familyId, documentId, file)**  
  Uploads file to the path above; returns `storagePath`.
- **getDocumentDownloadUrl(storagePath)**  
  Returns a download URL for admin/staff (and org members per current rules).

Accepted file types: images and PDFs (enforced in UI via `accept="image/*,.pdf,application/pdf"`). Max size 20 MB in the upload UI.

## 3. Firestore service (`src/services/firestore/documentsService.ts`)

- **getRequiredTemplates(organizationId)**  
  Returns org document templates (sorted by name).
- **getRequirementsByFamily(organizationId, familyId)**  
  Returns requirement rows for the family (with template names).
- **getDocumentsByFamily(organizationId, familyId)**  
  Returns document metadata ordered by `uploadedAt` desc (with template and member names).
- **getDocumentsForFamily(organizationId, familyId)**  
  Returns `{ requirements, documents }`.
- **ensureRequirement(organizationId, familyId, templateId, createdBy, dueDate?)**  
  Gets or creates a requirement for family+template; returns requirement id.
- **uploadDocument(organizationId, uploadedBy, input)**  
  1) Uploads file via Storage, 2) Creates `familyDocuments` doc with `createdBy`/`createdAt` for rules, 3) Ensures requirement and sets status to `uploaded` and `completedAt`.
- **updateDocumentStatus(organizationId, documentId, status)**  
  Sets document status to pending | approved | rejected (preserves `createdBy`/`createdAt` for rules).
- **updateRequirementStatus(organizationId, requirementId, status, completedAt?)**  
  Updates requirement status.
- **getDocumentDownloadUrl(storagePath)**  
  Delegates to storage service.

## 4. Hooks (`src/hooks/useFamilyDocuments.ts`)

- **useFamilyDocuments({ organizationId, familyId, enabled })**  
  Fetches requirements + documents; returns `requirements`, `documents`, `isLoading`, `error`, `refetch`.
- **useDocumentUpload({ organizationId, familyId, uploadedBy, onSuccess })**  
  Returns `upload(input)`, `isUploading`, `error`. `input`: `{ templateId, file, memberId? }`.
- **useDocumentDownloadUrl()**  
  Returns `getUrl(storagePath)` and `loading`/`error`.
- **useRequiredTemplates(organizationId, enabled)**  
  Returns `templates`, `isLoading`, `error`, `refetch`.

## 5. UI components

### DocumentUploadSheet (`src/features/documents/DocumentUploadSheet.tsx`)

- Document type select (from required templates).
- Optional family member select (for member-level docs).
- File input: images and PDF, max 20 MB.
- Supports controlled `open`/`onOpenChange` and `defaultTemplateId` (e.g. open for a specific missing requirement).

### MissingDocumentsSection (`src/features/documents/MissingDocumentsSection.tsx`)

- Lists requirements with `status === "missing"`.
- Optional “Upload” button per requirement; can open upload sheet with that template pre-selected.

### DocumentsTab (`src/features/family-profile/DocumentsTab.tsx`)

- Uses hook data when provided (`requirementsFromHook`, `documentsFromHook`), else falls back to profile mock data.
- Sections: Upload (if templates and `onUpload`), Missing documents, Required documents list, Upload history (with download and status change when `onDownload`/`onStatusChange` provided).

## 6. Family profile integration

- **FamilyProfileView** uses `useFamilyDocuments`, `useDocumentUpload`, `useRequiredTemplates`, `useDocumentDownloadUrl`.
- On upload success, `refetchDocuments` is called.
- Download opens the Storage URL in a new tab.
- Document status (pending/approved/rejected) is updated via `updateDocumentStatus` and list is refetched.
- Templates and members (for member-level upload) are passed into DocumentsTab.

## 7. Permissions

- **Firestore**
  - `familyDocuments`, `familyDocumentRequirements`, `requiredDocumentTemplates`: read for active org members; create/update/delete for staff (with `immutableFieldsUnchanged` where applicable).
- **Storage**
  - `organizations/{organizationId}/**`: read for org members; write for staff/admin. Download is allowed for any authenticated org member (admin/staff use same path).

## 8. Mobile reuse

- Use the same Storage path: `organizations/{orgId}/families/{familyId}/documents/{documentId}/{fileName}`.
- Use the same Firestore collections and field names (`familyDocuments`, `familyDocumentRequirements`, `requiredDocumentTemplates`).
- Mobile can call the same backend pattern: upload to Storage → create/update Firestore metadata; download via `getDownloadURL` with the stored `storagePath`.

## 9. Files created/updated

| Path | Change |
|------|--------|
| `src/types/domain.ts` | FamilyDocument: `memberId`, `contentType`, `createdBy`/`createdAt`. FamilyDocumentRequirement: `createdBy`. |
| `src/types/documents.ts` | New: view/input types for documents. |
| `src/types/familyProfile.ts` | FamilyDocumentView: `templateId`, `memberId`, `memberName`, `storagePath?`. |
| `src/services/storage/storageService.ts` | `buildFamilyDocumentPath`, `uploadFamilyDocument`, `getDocumentDownloadUrl`. |
| `src/services/firestore/documentsService.ts` | New: full documents Firestore service. |
| `src/hooks/useFamilyDocuments.ts` | New: useFamilyDocuments, useDocumentUpload, useDocumentDownloadUrl, useRequiredTemplates. |
| `src/features/documents/DocumentUploadSheet.tsx` | New: upload sheet (type, member, file). |
| `src/features/documents/MissingDocumentsSection.tsx` | New: missing-requirements list + upload trigger. |
| `src/features/family-profile/DocumentsTab.tsx` | Hook-driven data, missing section, upload sheet, download, status change. |
| `src/features/family-profile/FamilyProfileView.tsx` | Documents hooks and handlers wired to DocumentsTab. |
| `src/services/family/mockFamilyProfile.ts` | Mock documents extended with `templateId`, `memberId`, `memberName`. |
| `firestore.indexes.json` | Index: `familyDocumentRequirements` (organizationId, familyId). |
| `storage.rules` | Comment for documents path. |
