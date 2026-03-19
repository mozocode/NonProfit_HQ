# Phase 16: Surveys and outcomes tracking

## Overview

Surveys for **parent**, **child/youth**, and **staff** audiences; definitions in Firestore (`surveys` + `surveyQuestions` subcollection); take-survey UI; response storage in `surveyResponses`; client-side aggregation; lay summaries; admin reporting (counts, monthly trend, per-question results); export-ready summary cards for grants and newsletters.

## 1. Data model (`src/types/domain.ts`)

- **SurveyAudience**: `"parent" | "child" | "staff"`
- **Survey**: `organizationId`, `surveyId`, `name`, `description`, `audience`, `status` (`draft` | `active` | `closed`), `createdBy`, `createdAt`, `updatedAt`
- **SurveyQuestion** (subcollection `surveys/{surveyId}/surveyQuestions/{questionId}`): `organizationId`, `order`, `type` (`text` | `choice` | `scale`), `questionText`, `options[]`, `createdBy`, `createdAt`, `updatedAt`
- **SurveyResponse**: includes **`audience`** (denormalized), `familyId`, `respondentUid`, `respondentMemberId`, `answers` (map `questionId` → value), `submittedAt`, `createdBy`, `createdAt`, `updatedAt`

## 2. Firestore rules

- **surveyResponses**: participants may **create** if `respondentUid == request.auth.uid` (and tenant match); staff may create any response in org. Read for active org members; update/delete staff-only with immutable fields unchanged.

## 3. Service layer (`src/services/firestore/surveysService.ts`)

- **getSurveys(organizationId, filters?)** – list surveys; optional `status`, `audience` filter; counts questions per survey (N+1 acceptable for moderate lists)
- **getSurveyWithQuestions(organizationId, surveyId)** – survey + ordered questions
- **getSurveyResponses(organizationId, surveyId)** – all responses for aggregation/reporting
- **submitSurveyResponse(organizationId, respondentUid, input, audience)** – new response doc
- **createSurvey(organizationId, createdByUid, input)** – batch: survey doc + question subdocs (admin UI)

## 4. Aggregation & summaries (`src/lib/surveyAggregation.ts`)

- **aggregateSurveyResults** – per-question: choice counts, scale min/max/average, text samples (capped)
- **generateLaySummary** – headline, bullets (top choice %, scale averages, text response counts), narrative paragraph
- **buildExportSummaryCards** – 2–4 cards with title, stat, body, optional footnote (participation, top scale, top choice, narrative)
- **sortedMonthlyTrend** – `submittedAt` grouped by `YYYY-MM` for tables/sparklines

## 5. Hooks (`src/hooks/useSurveys.ts`)

- **useSurveysList(filters?)** – `status`, optional `audience`
- **useSurveyDetail(surveyId)** – definition + questions
- **useSubmitSurvey** – submit with correct `audience`
- **useSurveyReport(surveyId)** – loads survey + responses, runs aggregation, lay summary, export cards, trend
- **useCreateSurvey** – batch create (admin)

## 6. UI components

| Component | Purpose |
|-----------|---------|
| `SurveyTakeForm` | Text / choice / scale (default 1–5); validates required answers; submits |
| `SurveysListView` | Reusable list with audience + status badges |
| `CreateSurveySheet` | Admin: name, description, audience, dynamic questions |
| `ExportSummaryCards` | Grant/newsletter cards with **Copy** to clipboard |
| `AdminSurveyReportView` | Lay summary, export cards, monthly table, per-question breakdown |

## 7. Routes (`src/constants/index.ts`)

- `PARTICIPANT_SURVEYS`, `PARTICIPANT_SURVEY(id)`
- `STAFF_SURVEYS`, `STAFF_SURVEY(id)`
- `ADMIN_SURVEYS`, `ADMIN_SURVEY_REPORT(id)`

## 8. Pages

- **Participant**: `/participant/surveys`, `/participant/surveys/[surveyId]` – active parent/child surveys only
- **Staff**: `/staff/surveys`, `/staff/surveys/[surveyId]` – active staff surveys (uses staff layout shell)
- **Admin**: `/admin/surveys` (list + create), `/admin/surveys/[surveyId]` (full report)

Dashboard links: Admin → Surveys & outcomes; Participant → Open surveys; Staff header → Surveys.

## 9. Indexes (`firestore.indexes.json`)

- `surveys`: `(organizationId, updatedAt desc)`, `(organizationId, status, updatedAt desc)`
- Existing: `surveyResponses` `(organizationId, surveyId, submittedAt desc)`

## 10. Future extensions

- Link **OutcomeMetric** / **OutcomeSnapshot** for stored trend series and cross-survey KPIs
- Server-side aggregation for very large response volumes
- Survey assignment per family/program and duplicate-submission rules
- PII handling for open-text exports (redaction, access tiers)

## 11. Files created/changed

| Path | Change |
|------|--------|
| `src/types/domain.ts` | SurveyAudience, Survey fields, SurveyResponse.audience + createdBy |
| `firestore.rules` | Participant create on surveyResponses |
| `firestore.indexes.json` | surveys composite indexes |
| `src/types/surveys.ts` | **New** – view + create + aggregation types |
| `src/lib/surveyAggregation.ts` | **New** – aggregate, lay summary, export cards, trend |
| `src/services/firestore/surveysService.ts` | **New** |
| `src/hooks/useSurveys.ts` | **New** |
| `src/constants/index.ts` | Survey routes |
| `src/features/surveys/SurveyTakeForm.tsx` | **New** |
| `src/features/surveys/SurveysListView.tsx` | **New** |
| `src/features/surveys/CreateSurveySheet.tsx` | **New** |
| `src/features/surveys/ExportSummaryCards.tsx` | **New** |
| `src/features/surveys/AdminSurveyReportView.tsx` | **New** |
| `src/app/(dashboard)/participant/surveys/**` | **New** |
| `src/app/(dashboard)/staff/surveys/**` | **New** |
| `src/app/(dashboard)/admin/surveys/**` | **New** |
| `src/features/dashboard/AdminDashboardView.tsx` | Link to surveys |
| `src/features/dashboard/ParticipantDashboardView.tsx` | Link to surveys |
| `src/features/dashboard/StaffDashboardView.tsx` | Link to surveys |
