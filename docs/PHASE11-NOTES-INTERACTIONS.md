# Phase 11: Notes, meeting logs, and interactions

## Overview

Structured interaction logging (call, meeting, check-in, referral follow-up, plus visit/email/other), notes with types (update, case, assessment, internal) and visibility (staff-only vs participant-safe), note composer, interaction log form, reverse-chronological display, and timeline integration.

## Interaction types

- **call** – Phone call  
- **meeting** – Meeting  
- **check_in** – Check-in  
- **referral_follow_up** – Referral follow-up  
- **visit** – Visit (legacy)  
- **email** – Email  
- **other** – Other  

## Note types

- **update** – Update note  
- **case** – Case note  
- **assessment** – Assessment note  
- **internal** – Internal note  

## Visibility

- **internal** – Staff-only (not shown to participants).  
- **shared** – Participant-safe; can be shown to family/participants when a participant-facing view exists.

## Data model

- **Interaction** (domain): organizationId, familyId, interactionId, type, staffUid, occurredAt, summary, durationMinutes, createdBy, createdAt, updatedAt. Stored in `interactions` collection.
- **Note** (domain): organizationId, familyId, caseId?, assessmentId?, noteId, authorUid, noteType, visibility, title?, content, createdAt, updatedAt. Stored in `notes` collection.

## Permissions approach

- **Firestore rules:** Notes and interactions are readable by any active org member; only staff can create/update/delete (existing rules).
- **Visibility in app:**  
  - **Staff views:** See all notes (internal + shared). Notes tab and timeline use full data.  
  - **Participant views (future):** When building participant-facing notes/timeline, filter notes to `visibility === "shared"` only. Use `getNotesByFamily(..., { visibilityFilter: "shared" })` and `getTimelineByFamily(..., { visibilityFilter: "shared" })`. Interactions can remain staff-only or be exposed with a participant-safe subset if needed later.

## Service (`src/services/firestore/notesInteractionsService.ts`)

- **getInteractionsByFamily(orgId, familyId, options?)** – List interactions by family, `occurredAt` desc.  
- **createInteraction(orgId, familyId, createdBy, input)** – Create interaction (type, occurredAt, summary?, durationMinutes?).  
- **getNotesByFamily(orgId, familyId, options?)** – List notes by family, `createdAt` desc; optional `visibilityFilter`: `"all"` | `"internal"` | `"shared"`.  
- **createNote(orgId, createdBy, input)** – Create note (noteType, visibility, title?, content, familyId, caseId?, assessmentId?).  
- **getTimelineByFamily(orgId, familyId, options?)** – Merged notes + interactions, sorted by timestamp desc; optional `visibilityFilter` for notes.

## Hooks

- **useFamilyNotes(familyId, options?)** – notes, isLoading, error, refetch.  
- **useFamilyInteractions(familyId)** – interactions, isLoading, error, refetch.  
- **useFamilyTimeline(familyId, options?)** – entries (TimelineEntryView[]), isLoading, error, refetch.

## UI

- **NoteComposer** – Sheet: note type, visibility, title (optional), content. Submit calls onCreateNote.  
- **LogInteractionSheet** – Sheet: type, date/time, summary, duration (optional). Submit calls onCreateInteraction.  
- **Notes tab** – When hook data is passed: notes from Firestore (reverse chronological), Add note section with NoteComposer. Falls back to mock `data.notes` when no hook data.  
- **Interactions tab** – New tab: list of interactions (reverse chronological), “Log interaction” with LogInteractionSheet.  
- **Timeline tab** – When hook data is passed: merged timeline (notes + interactions) from Firestore. Falls back to mock `data.timeline`.

## Timeline integration

- Timeline entries are built from notes and interactions: each note becomes a “note” entry, each interaction an “interaction” entry.  
- Sorted by timestamp descending (newest first).  
- Adding a note or logging an interaction triggers refetch of notes/interactions and timeline so the timeline updates.

## Files created

- `src/types/notesInteractions.ts` – InteractionView, NoteView, CreateInteractionInput, CreateNoteInput, TimelineEntryView.  
- `src/services/firestore/notesInteractionsService.ts`  
- `src/hooks/useFamilyNotes.ts`, `useFamilyInteractions.ts`, `useFamilyTimeline.ts`  
- `src/features/notes/noteTypeLabels.ts`, `NoteComposer.tsx`  
- `src/features/interactions/interactionTypeLabels.ts`, `LogInteractionSheet.tsx`  
- `src/features/family-profile/InteractionsTab.tsx`  
- `docs/PHASE11-NOTES-INTERACTIONS.md`

## Files changed

- `src/types/domain.ts` – InteractionType, Interaction (type, durationMinutes), NoteType, NoteVisibility, Note (noteType, visibility, title).  
- `src/types/familyProfile.ts` – FamilyNoteView (optional noteType, title).  
- `src/features/family-profile/NotesTab.tsx` – Optional notesFromHook, onAddNote, isAddingNote; Section + NoteComposer; reverse chronological; note type/title on card.  
- `src/features/family-profile/TimelineTab.tsx` – Optional entriesFromHook, isLoading; use real timeline when provided.  
- `src/features/family-profile/FamilyProfileView.tsx` – useFamilyNotes, useFamilyInteractions, useFamilyTimeline; handleAddNote, handleLogInteraction; pass data to Notes, Interactions, Timeline tabs; new Interactions tab.  
- `firestore.indexes.json` – Notes index with visibility (organizationId, familyId, visibility, createdAt desc).

## Firestore index

- **notes:** organizationId, familyId, visibility, createdAt desc – for filtered notes by visibility.
