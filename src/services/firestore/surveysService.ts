import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  writeBatch,
  type Timestamp,
} from "firebase/firestore";

import { firestoreDb } from "@/services/firebase/client";
import { COLLECTIONS } from "@/services/firestore/collections";
import type { Survey, SurveyAudience, SurveyQuestion, SurveyResponse } from "@/types/domain";
import type {
  SurveyListItemView,
  SurveyWithQuestionsView,
  SurveyQuestionView,
  SubmitSurveyInput,
  CreateSurveyInput,
} from "@/types/surveys";

function guardDb() {
  if (!firestoreDb) throw new Error("Firestore is not initialized (e.g. during SSR).");
  return firestoreDb;
}

function timestampToIso(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof (value as Timestamp)?.toDate === "function") return (value as Timestamp).toDate().toISOString();
  return "";
}

function questionsCollection(surveyId: string) {
  return collection(guardDb(), COLLECTIONS.surveys, surveyId, COLLECTIONS.surveyQuestions);
}

function mapQuestionView(id: string, d: Record<string, unknown>): SurveyQuestionView {
  return {
    questionId: id,
    order: (d.order as number) ?? 0,
    type: (d.type as SurveyQuestionView["type"]) ?? "text",
    questionText: (d.questionText as string) ?? "",
    options: Array.isArray(d.options) ? (d.options as string[]) : [],
  };
}

export async function getSurveys(
  organizationId: string,
  filters?: { status?: Survey["status"]; audience?: SurveyAudience | SurveyAudience[] }
): Promise<SurveyListItemView[]> {
  const db = guardDb();
  const ref = collection(db, COLLECTIONS.surveys);
  let q = query(ref, where("organizationId", "==", organizationId), orderBy("updatedAt", "desc"));
  if (filters?.status) {
    q = query(
      ref,
      where("organizationId", "==", organizationId),
      where("status", "==", filters.status),
      orderBy("updatedAt", "desc")
    );
  }
  const snap = await getDocs(q);
  const list: SurveyListItemView[] = [];
  for (const s of snap.docs) {
    const d = s.data();
    const audience = (d.audience as SurveyAudience) ?? "parent";
    if (filters?.audience) {
      const audiences = Array.isArray(filters.audience) ? filters.audience : [filters.audience];
      if (!audiences.includes(audience)) continue;
    }
    const qSnap = await getDocs(questionsCollection(s.id));
    list.push({
      surveyId: s.id,
      name: (d.name as string) ?? "",
      description: (d.description as string) ?? null,
      audience,
      status: (d.status as Survey["status"]) ?? "draft",
      questionCount: qSnap.size,
    });
  }
  return list;
}

export async function getSurveyWithQuestions(
  organizationId: string,
  surveyId: string
): Promise<SurveyWithQuestionsView | null> {
  const db = guardDb();
  const surveyRef = doc(db, COLLECTIONS.surveys, surveyId);
  const surveySnap = await getDoc(surveyRef);
  if (!surveySnap.exists()) return null;
  const sd = surveySnap.data();
  if ((sd.organizationId as string) !== organizationId) return null;

  const qSnap = await getDocs(query(questionsCollection(surveyId), orderBy("order", "asc")));
  const questions = qSnap.docs.map((q) => mapQuestionView(q.id, q.data()));

  return {
    surveyId,
    organizationId,
    name: (sd.name as string) ?? "",
    description: (sd.description as string) ?? null,
    audience: (sd.audience as SurveyAudience) ?? "parent",
    status: (sd.status as Survey["status"]) ?? "draft",
    questions,
  };
}

export async function getSurveyResponses(
  organizationId: string,
  surveyId: string
): Promise<Array<{ responseId: string; answers: Record<string, unknown>; submittedAt: string; audience: SurveyAudience }>> {
  const db = guardDb();
  const ref = collection(db, COLLECTIONS.surveyResponses);
  const q = query(
    ref,
    where("organizationId", "==", organizationId),
    where("surveyId", "==", surveyId),
    orderBy("submittedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((s) => {
    const d = s.data();
    return {
      responseId: s.id,
      answers: (d.answers as Record<string, unknown>) ?? {},
      submittedAt: timestampToIso(d.submittedAt) || new Date().toISOString(),
      audience: (d.audience as SurveyAudience) ?? "parent",
    };
  });
}

export async function submitSurveyResponse(
  organizationId: string,
  respondentUid: string,
  input: SubmitSurveyInput,
  audience: SurveyAudience
): Promise<string> {
  const db = guardDb();
  const now = new Date().toISOString();
  const ref = collection(db, COLLECTIONS.surveyResponses);
  const docRef = doc(ref);
  const payload: SurveyResponse = {
    organizationId,
    surveyId: input.surveyId,
    responseId: docRef.id,
    audience,
    familyId: input.familyId ?? null,
    respondentUid,
    respondentMemberId: input.respondentMemberId ?? null,
    answers: input.answers,
    submittedAt: now,
    createdBy: respondentUid,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(docRef, payload);
  return docRef.id;
}

export async function createSurvey(organizationId: string, createdByUid: string, input: CreateSurveyInput): Promise<string> {
  const db = guardDb();
  const now = new Date().toISOString();
  const surveyRef = doc(collection(db, COLLECTIONS.surveys));
  const surveyId = surveyRef.id;

  const batch = writeBatch(db);
  batch.set(surveyRef, {
    organizationId,
    surveyId,
    name: input.name,
    description: input.description ?? null,
    audience: input.audience,
    status: input.status ?? "draft",
    createdBy: createdByUid,
    createdAt: now,
    updatedAt: now,
  });

  for (const q of input.questions) {
    const qRef = doc(questionsCollection(surveyId));
    batch.set(qRef, {
      organizationId,
      questionId: qRef.id,
      order: q.order,
      type: q.type,
      questionText: q.questionText,
      options: q.options ?? [],
      createdBy: createdByUid,
      createdAt: now,
      updatedAt: now,
    });
  }

  await batch.commit();
  return surveyId;
}
