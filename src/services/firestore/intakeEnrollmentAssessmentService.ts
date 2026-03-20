import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";

import { getFirestoreDb } from "@/services/firebase/client";
import { COLLECTIONS } from "@/services/firestore/collections";
import type {
  IntakeDocument,
  IntakeFormData,
  EnrollmentDocument,
  EnrollmentFormData,
  AssessmentDocument,
  AssessmentFormData,
} from "@/types/intakeEnrollmentAssessment";

function guardDb(): import("firebase/firestore").Firestore {
  const db = getFirestoreDb();
  if (!db) throw new Error("Firestore is not initialized (e.g. during SSR).");
  return db;
}

function timestampToIso(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (typeof (value as Timestamp)?.toDate === "function") return (value as Timestamp).toDate().toISOString();
  return null;
}

async function createAuditEntry(
  organizationId: string,
  actorUid: string,
  action: string,
  resourceType: string,
  resourceId: string,
  metadata: Record<string, unknown> = {},
) {
  const db = guardDb();
  const ref = doc(collection(db, COLLECTIONS.auditLogs));
  await setDoc(ref, {
    organizationId,
    logId: ref.id,
    action,
    actorUid,
    resourceType,
    resourceId,
    metadata,
    createdAt: serverTimestamp(),
  });
}

async function updateFamilyWorkflowStage(
  organizationId: string,
  familyId: string,
  workflowStage: string,
  enteredBy?: string,
) {
  const db = guardDb();
  const familyRef = doc(db, COLLECTIONS.families, familyId);
  const snap = await getDoc(familyRef);
  if (!snap.exists()) return;
  const data = snap.data();
  const existingHistory = (data.stageHistory as Record<string, unknown>[] | undefined) ?? [];
  const newEntry = {
    stage: workflowStage,
    enteredAt: serverTimestamp(),
    enteredBy: enteredBy ?? null,
    note: null,
  };
  const stageHistory = [...existingHistory, newEntry];
  await updateDoc(familyRef, {
    organizationId: data.organizationId ?? organizationId,
    createdBy: data.createdBy,
    createdAt: data.createdAt,
    workflowStage,
    stageHistory,
    updatedAt: serverTimestamp(),
  } as Record<string, unknown>);
}

// ---- Intake ----
export async function getIntakeByFamily(
  organizationId: string,
  familyId: string,
): Promise<IntakeDocument | null> {
  const db = guardDb();
  const ref = doc(db, COLLECTIONS.intakes, familyId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    organizationId: d.organizationId as string,
    familyId: d.familyId as string,
    intakeId: d.intakeId as string,
    programId: (d.programId as string) ?? null,
    status: d.status as IntakeDocument["status"],
    submittedAt: timestampToIso(d.submittedAt),
    submittedBy: (d.submittedBy as string) ?? null,
    createdBy: d.createdBy as string,
    createdAt: timestampToIso(d.createdAt) ?? "",
    updatedAt: timestampToIso(d.updatedAt) ?? "",
    reasonForInitialCall: d.reasonForInitialCall as string | undefined,
    whatTheyHaveTried: d.whatTheyHaveTried as string | undefined,
    presentingChallenges: d.presentingChallenges as string | undefined,
    demographics: d.demographics as Record<string, unknown> | undefined,
  };
}

export async function saveIntakeDraft(
  organizationId: string,
  familyId: string,
  createdBy: string,
  data: IntakeFormData,
): Promise<string> {
  const db = guardDb();
  const intakeId = familyId;
  const ref = doc(db, COLLECTIONS.intakes, intakeId);
  const now = serverTimestamp();
  await setDoc(
    ref,
    {
      organizationId,
      familyId,
      intakeId,
      programId: null,
      status: "draft",
      submittedAt: null,
      submittedBy: null,
      createdBy,
      createdAt: now,
      updatedAt: now,
      reasonForInitialCall: data.reasonForInitialCall,
      whatTheyHaveTried: data.whatTheyHaveTried,
      presentingChallenges: data.presentingChallenges,
      demographics: data.demographics ?? {},
    },
    { merge: true },
  );
  return intakeId;
}

export async function submitIntake(
  organizationId: string,
  familyId: string,
  submittedBy: string,
  data: IntakeFormData,
): Promise<string> {
  const db = guardDb();
  const intakeId = familyId;
  const ref = doc(db, COLLECTIONS.intakes, intakeId);
  const now = serverTimestamp();
  await setDoc(
    ref,
    {
      organizationId,
      familyId,
      intakeId,
      programId: null,
      status: "submitted",
      submittedAt: now,
      submittedBy,
      createdBy: submittedBy,
      createdAt: now,
      updatedAt: now,
      reasonForInitialCall: data.reasonForInitialCall,
      whatTheyHaveTried: data.whatTheyHaveTried,
      presentingChallenges: data.presentingChallenges,
      demographics: data.demographics ?? {},
    },
    { merge: true },
  );
  await createAuditEntry(organizationId, submittedBy, "intake_submitted", "intake", intakeId, {
    familyId,
  });
  await updateFamilyWorkflowStage(organizationId, familyId, "intake", submittedBy);
  return intakeId;
}

// ---- Enrollment ----
export async function getEnrollmentByFamily(
  organizationId: string,
  familyId: string,
): Promise<EnrollmentDocument | null> {
  const db = guardDb();
  const ref = doc(db, COLLECTIONS.enrollments, familyId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    organizationId: d.organizationId as string,
    familyId: d.familyId as string,
    enrollmentId: d.enrollmentId as string,
    programId: (d.programId as string) ?? null,
    status: d.status as EnrollmentDocument["status"],
    enrollmentNotes: d.enrollmentNotes as string | undefined,
    startDate: d.startDate as string,
    agreedToTerms: d.agreedToTerms as boolean,
    enrolledAt: timestampToIso(d.enrolledAt),
    enrolledBy: (d.enrolledBy as string) ?? null,
    createdBy: d.createdBy as string,
    createdAt: timestampToIso(d.createdAt) ?? "",
    updatedAt: timestampToIso(d.updatedAt) ?? "",
  };
}

export async function saveEnrollmentDraft(
  organizationId: string,
  familyId: string,
  createdBy: string,
  data: EnrollmentFormData,
): Promise<string> {
  const db = guardDb();
  const enrollmentId = familyId;
  const ref = doc(db, COLLECTIONS.enrollments, enrollmentId);
  const now = serverTimestamp();
  await setDoc(
    ref,
    {
      organizationId,
      familyId,
      enrollmentId,
      programId: data.programId || null,
      status: "draft",
      enrollmentNotes: data.enrollmentNotes ?? "",
      startDate: data.startDate,
      agreedToTerms: data.agreedToTerms,
      enrolledAt: null,
      enrolledBy: null,
      createdBy,
      createdAt: now,
      updatedAt: now,
    },
    { merge: true },
  );
  return enrollmentId;
}

export async function submitEnrollment(
  organizationId: string,
  familyId: string,
  enrolledBy: string,
  data: EnrollmentFormData,
): Promise<string> {
  const db = guardDb();
  const enrollmentId = familyId;
  const ref = doc(db, COLLECTIONS.enrollments, enrollmentId);
  const now = serverTimestamp();
  await setDoc(
    ref,
    {
      organizationId,
      familyId,
      enrollmentId,
      programId: data.programId || null,
      status: "active",
      enrollmentNotes: data.enrollmentNotes ?? "",
      startDate: data.startDate,
      agreedToTerms: data.agreedToTerms,
      enrolledAt: now,
      enrolledBy,
      createdBy: enrolledBy,
      createdAt: now,
      updatedAt: now,
    },
    { merge: true },
  );
  await createAuditEntry(organizationId, enrolledBy, "enrollment_completed", "enrollment", enrollmentId, {
    familyId,
  });
  await updateFamilyWorkflowStage(organizationId, familyId, "enrolled", enrolledBy);
  return enrollmentId;
}

// ---- Assessment ----
export async function getLatestAssessmentByFamily(
  organizationId: string,
  familyId: string,
): Promise<AssessmentDocument | null> {
  const db = guardDb();
  const q = query(
    collection(db, COLLECTIONS.assessments),
    where("organizationId", "==", organizationId),
    where("familyId", "==", familyId),
  );
  const snap = await getDocs(q);
  let latest: AssessmentDocument | null = null;
  snap.docs.forEach((s) => {
    const d = s.data();
    const created = timestampToIso(d.createdAt) ?? "";
    const assessmentDoc: AssessmentDocument = {
      organizationId: d.organizationId as string,
      familyId: d.familyId as string,
      intakeId: (d.intakeId as string) ?? null,
      assessmentId: s.id,
      type: d.type as string,
      status: d.status as AssessmentDocument["status"],
      completedAt: timestampToIso(d.completedAt),
      createdBy: d.createdBy as string,
      createdAt: created,
      updatedAt: timestampToIso(d.updatedAt) ?? "",
      strengths: d.strengths as string | undefined,
      needs: d.needs as string | undefined,
      goalsSummary: d.goalsSummary as string | undefined,
      recommendedServices: d.recommendedServices as string | undefined,
      additionalNotes: d.additionalNotes as string | undefined,
    };
    if (!latest || created > latest.createdAt) latest = assessmentDoc;
  });
  return latest;
}

export async function saveAssessmentDraft(
  organizationId: string,
  familyId: string,
  createdBy: string,
  data: AssessmentFormData,
  existingAssessmentId?: string | null,
): Promise<string> {
  const db = guardDb();
  const now = serverTimestamp();
  const payload = {
    organizationId,
    familyId,
    intakeId: null as string | null,
    type: data.assessmentType,
    status: "draft" as const,
    completedAt: null,
    createdBy,
    createdAt: now,
    updatedAt: now,
    strengths: data.strengths,
    needs: data.needs,
    goalsSummary: data.goalsSummary,
    recommendedServices: data.recommendedServices ?? "",
    additionalNotes: data.additionalNotes ?? "",
  };

  if (existingAssessmentId) {
    const ref = doc(db, COLLECTIONS.assessments, existingAssessmentId);
    await updateDoc(ref, { ...payload, updatedAt: now });
    return existingAssessmentId;
  }
  const ref = doc(collection(db, COLLECTIONS.assessments));
  await setDoc(ref, { ...payload, assessmentId: ref.id });
  return ref.id;
}

export async function submitAssessment(
  organizationId: string,
  familyId: string,
  completedBy: string,
  data: AssessmentFormData,
  existingAssessmentId?: string | null,
): Promise<string> {
  const db = guardDb();
  const now = serverTimestamp();
  const payload = {
    organizationId,
    familyId,
    intakeId: null as string | null,
    type: data.assessmentType,
    status: "completed" as const,
    completedAt: now,
    createdBy: completedBy,
    createdAt: now,
    updatedAt: now,
    strengths: data.strengths,
    needs: data.needs,
    goalsSummary: data.goalsSummary,
    recommendedServices: data.recommendedServices ?? "",
    additionalNotes: data.additionalNotes ?? "",
  };

  let assessmentId: string;
  if (existingAssessmentId) {
    const ref = doc(db, COLLECTIONS.assessments, existingAssessmentId);
    await updateDoc(ref, payload);
    assessmentId = existingAssessmentId;
  } else {
    const ref = doc(collection(db, COLLECTIONS.assessments));
    assessmentId = ref.id;
    await setDoc(ref, { ...payload, assessmentId });
  }

  await createAuditEntry(organizationId, completedBy, "assessment_completed", "assessment", assessmentId, {
    familyId,
  });
  await updateFamilyWorkflowStage(organizationId, familyId, "assessment", completedBy);
  return assessmentId;
}
