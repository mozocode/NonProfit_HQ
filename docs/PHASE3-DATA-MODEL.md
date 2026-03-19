# Phase 3: Firestore data model — multi-tenant nonprofit OS

## 1. Collection architecture

All tenant-scoped documents include **organizationId**. Top-level collections are used for cross-entity queries and reporting; subcollections are used where the child lifecycle is tied to the parent and list size is bounded.

| Domain | Collection | Subcollection of | Purpose |
|--------|------------|------------------|---------|
| **Core** | organizations | — | Org settings, name, status |
| | organizationMemberships | — | orgId_uid; role, programIds, active |
| | profiles | — | users/{uid}; displayName, email, phone |
| | roles | — | Optional role definitions; admin/staff/participant enforced in rules |
| **Families** | families | — | Primary contact, status, school/partner links |
| | familyMembers | — | Members of a family; relationship, isParticipant |
| | participantProfiles | — | Extended participant-only profile (familyId, preferences) |
| **Case** | intakes | — | Intake record per family/program |
| | assessments | — | Assessment record; links to intake/family |
| | goals | families | goals under family for “family goals” |
| | goalTasks | goals | tasks under a goal |
| | staffAssignments | — | staff ↔ family/case/program assignment |
| | interactions | — | Logged contact (call, visit, etc.) |
| | notes | — | Case/assessment notes; author, visibility |
| **Resources** | resources | — | Resource directory entries |
| | resourceCategories | — | Category taxonomy |
| | familyResourceAssignments | — | Family assigned to resource |
| | referrals | — | Referral from org to resource or partner |
| **Documents** | requiredDocumentTemplates | — | Org-level template (name, type) |
| | familyDocuments | — | Uploaded doc metadata; storagePath |
| | familyDocumentRequirements | — | Requirement status per family per template |
| | uploadRequests | — | Pending/approved upload requests |
| **Notifications** | reminders | — | Due task/doc/event reminders |
| | staffActionPrompts | — | Prompt for staff (e.g. report due) |
| | escalationEvents | — | Escalation log (SLA, assignment) |
| **Surveys** | surveys | — | Survey definition |
| | surveyQuestions | surveys | Questions subcollection |
| | surveyResponses | — | Response doc (surveyId, respondent, answers) |
| | outcomeMetrics | — | Metric definition (name, type) |
| | outcomeSnapshots | — | Pre-aggregated outcome value (period, scope) |
| **Admin** | schools | — | School master list |
| | partnerOrganizations | — | Partner org master list |
| | familySchoolLinks | — | familyId, schoolId, period |
| | familyPartnerLinks | — | familyId, partnerOrgId, period |
| | staffWeeklyAgendas | — | Planned work (staff, week) |
| | staffWeeklyReports | — | Submitted report (staff, week) |
| | staffReportItems | staffWeeklyReports | Line items in a report |
| | staffScheduleEntries | — | Calendar entries for staff |
| | staffTimesheetSummaries | — | Aggregated hours (staff, period) |
| | adminReportExports | — | Export job metadata (format, filters) |
| | organizationMetricsSnapshots | — | Org-wide metrics (period, dimensions) |
| | auditLogs | — | Immutable event log |

**Subcollection strategy**

- **goals** under **families**: family-centric goals; list size per family is small; list goals by family without scanning all goals.
- **goalTasks** under **goals**: tasks belong to one goal; list tasks for a goal only.
- **surveyQuestions** under **surveys**: questions are only read with the survey; avoids huge surveys in one doc.
- **staffReportItems** under **staffWeeklyReports**: line items only read with the report.

All other entities are top-level with IDs and foreign keys (organizationId, familyId, staffUid, etc.) for flexible querying and reporting.

---

## 2. Document shapes

**Conventions:** `organizationId` on every tenant doc. Timestamps stored as Firestore Timestamp (or ISO string in TypeScript). `createdAt`/`updatedAt` and `createdBy` where relevant.

### Core

**organizations** `/{organizationId}`  
- organizationId, name, status (active | inactive), settings (map), createdAt, updatedAt

**organizationMemberships** `/{organizationId}_{uid}`  
- organizationId, uid, role (admin | staff | participant), programIds (array), active (bool), invitedBy, joinedAt, updatedAt

**profiles** `/{uid}` (global; not tenant-scoped)  
- uid, displayName, email, phone, lastActiveAt, createdAt, updatedAt

**roles** `/{roleId}` (optional; tenant-scoped)  
- organizationId, roleId, name, permissions (map), createdAt, updatedAt

### Families

**families** `/{familyId}`  
- organizationId, familyId, primaryContact { firstName, lastName, phone, email }, status (active | inactive | archived), createdBy, createdAt, updatedAt  
- Denormalized for reporting: schoolId, partnerOrganizationId (or keep in link tables)

**familyMembers** `/{memberId}`  
- organizationId, familyId, memberId, firstName, lastName, dateOfBirth, relationship, isParticipant (bool), createdBy, createdAt, updatedAt

**participantProfiles** `/{participantId}` (uid or memberId)  
- organizationId, familyId, participantId, preferences (map), createdAt, updatedAt

### Case management

**intakes** `/{intakeId}`  
- organizationId, familyId, intakeId, programId, status (draft | submitted | approved), submittedAt, submittedBy, createdAt, updatedAt

**assessments** `/{assessmentId}`  
- organizationId, familyId, intakeId?, assessmentId, type, status, completedAt, createdBy, createdAt, updatedAt

**goals** (subcollection of families) `families/{familyId}/goals/{goalId}`  
- organizationId, familyId, goalId, title, description, status (active | completed | cancelled), targetDate, createdBy, createdAt, updatedAt

**goalTasks** (subcollection of goals) `families/{familyId}/goals/{goalId}/goalTasks/{taskId}`  
- organizationId, goalId, taskId, title, status (todo | in_progress | done | blocked), assignedToUid, dueDate, completedAt, createdBy, createdAt, updatedAt

**staffAssignments** `/{assignmentId}`  
- organizationId, staffUid, familyId?, caseId?, programId?, role (primary | secondary), assignedAt, assignedBy, endedAt?, createdAt, updatedAt

**interactions** `/{interactionId}`  
- organizationId, familyId, interactionId, type (call | visit | email | other), staffUid, occurredAt, summary, createdBy, createdAt, updatedAt

**notes** `/{noteId}`  
- organizationId, familyId?, caseId?, assessmentId?, noteId, authorUid, visibility (internal | shared), content, createdAt, updatedAt

### Resources

**resources** `/{resourceId}`  
- organizationId, resourceId, name, description, categoryId, contactInfo (map), createdAt, updatedAt

**resourceCategories** `/{categoryId}`  
- organizationId, categoryId, name, sortOrder, createdAt, updatedAt

**familyResourceAssignments** `/{assignmentId}`  
- organizationId, familyId, resourceId, assignedAt, assignedBy, status, createdAt, updatedAt

**referrals** `/{referralId}`  
- organizationId, familyId, resourceId?, partnerOrganizationId?, referralId, status (pending | completed | declined), referredBy, referredAt, completedAt?, createdAt, updatedAt

### Documents

**requiredDocumentTemplates** `/{templateId}`  
- organizationId, templateId, name, documentType, description, createdAt, updatedAt

**familyDocuments** `/{documentId}`  
- organizationId, familyId, documentId, templateId, storagePath, fileName, uploadedBy, uploadedAt, status (pending | approved | rejected), createdAt, updatedAt

**familyDocumentRequirements** `/{requirementId}` (familyId_templateId or composite)  
- organizationId, familyId, templateId, requirementId, status (missing | uploaded | approved), dueDate?, completedAt?, createdAt, updatedAt

**uploadRequests** `/{requestId}`  
- organizationId, familyId?, documentId?, requestId, requestedBy, status (pending | approved | rejected), reviewedBy?, reviewedAt?, createdAt, updatedAt

### Notifications

**reminders** `/{reminderId}`  
- organizationId, reminderId, type (task | document | interaction), targetId (taskId/documentId/etc.), assignedToUid?, dueAt, sentAt?, createdAt, updatedAt

**staffActionPrompts** `/{promptId}`  
- organizationId, staffUid, promptId, type (report_due | agenda_due), dueAt, completedAt?, createdAt, updatedAt

**escalationEvents** `/{eventId}`  
- organizationId, eventId, type (sla_breach | assignment_inactive), familyId?, staffUid?, metadata (map), createdAt, updatedAt

### Surveys and outcomes

**surveys** `/{surveyId}`  
- organizationId, surveyId, name, status (draft | active | closed), createdAt, updatedAt

**surveyQuestions** (subcollection) `surveys/{surveyId}/surveyQuestions/{questionId}`  
- organizationId, questionId, order, type (text | choice | scale), questionText, options (array), createdAt, updatedAt

**surveyResponses** `/{responseId}`  
- organizationId, surveyId, responseId, familyId?, respondentUid?, respondentMemberId?, answers (map), submittedAt, createdAt, updatedAt

**outcomeMetrics** `/{metricId}`  
- organizationId, metricId, name, type (count | rate | scale), definition, createdAt, updatedAt

**outcomeSnapshots** `/{snapshotId}`  
- organizationId, metricId, snapshotId, periodStart, periodEnd, scope (org | program | school | partner), scopeId?, value (number), dimensions (map), createdAt, updatedAt

### Admin command center

**schools** `/{schoolId}`  
- organizationId, schoolId, name, address (map), createdAt, updatedAt

**partnerOrganizations** `/{partnerOrgId}`  
- organizationId, partnerOrgId, name, contactInfo (map), createdAt, updatedAt

**familySchoolLinks** `/{linkId}`  
- organizationId, familyId, schoolId, linkId, periodStart, periodEnd?, createdAt, updatedAt

**familyPartnerLinks** `/{linkId}`  
- organizationId, familyId, partnerOrgId, linkId, periodStart, periodEnd?, createdAt, updatedAt

**staffWeeklyAgendas** `/{agendaId}` (e.g. staffUid_weekStart)  
- organizationId, staffUid, agendaId, weekStart (date), items (array of { type, title, familyId?, dueAt? }), createdAt, updatedAt

**staffWeeklyReports** `/{reportId}`  
- organizationId, staffUid, reportId, weekStart, submittedAt, status (draft | submitted), totalHours?, createdAt, updatedAt

**staffReportItems** (subcollection) `staffWeeklyReports/{reportId}/staffReportItems/{itemId}`  
- organizationId, itemId, type (work | hours), description, familyId?, durationMinutes?, createdAt, updatedAt

**staffScheduleEntries** `/{entryId}`  
- organizationId, staffUid, entryId, startAt, endAt, type (work | meeting | leave), familyId?, title?, createdAt, updatedAt

**staffTimesheetSummaries** `/{summaryId}` (e.g. staffUid_period)  
- organizationId, staffUid, summaryId, periodStart, periodEnd, totalMinutes, createdBy (system), createdAt, updatedAt

**adminReportExports** `/{exportId}`  
- organizationId, exportId, type (families | referrals | outcomes | custom), filters (map), format (csv | xlsx), status (pending | completed | failed), storagePath?, requestedBy, requestedAt, completedAt?, createdAt, updatedAt

**organizationMetricsSnapshots** `/{snapshotId}`  
- organizationId, snapshotId, periodStart, periodEnd, metrics (map: metricId → value), dimensions (map), createdAt, updatedAt

**auditLogs** `/{logId}`  
- organizationId, logId, action, actorUid, resourceType, resourceId, metadata (map), createdAt (immutable)

---

## 3. Denormalization and reporting patterns

- **organizationId on every tenant doc**: Enables org-scoped indexes and rules; all reporting filters by organizationId first.
- **familyId on case/referral/interaction/notes**: Enables “families served” and “participants by family” without joins.
- **schoolId / partnerOrganizationId on families or link tables**: Use **familySchoolLinks** and **familyPartnerLinks** with period for “participants by school/partner” and correct time bounds.
- **staffWeeklyAgendas vs staffWeeklyReports**: Planned vs actual; compare by staffUid + weekStart for “planned vs actual” and “reports on time” (submittedAt ≤ dueAt).
- **outcomeSnapshots / organizationMetricsSnapshots**: Pre-aggregate in Cloud Functions (scheduled) to avoid heavy aggregation at read time; store by period and scope (org, program, school, partner).
- **auditLogs**: Append-only; no updates; use for “who did what” and compliance.

---

## 4. How to answer key reporting questions

| Question | Approach |
|----------|----------|
| **Families served last year** | Query **families** with organizationId + updatedAt (or createdAt) in year range; optionally status = active. Or count **organizationMetricsSnapshots** with metricId = "families_served" and period in year. |
| **Parents/students served** | Count **familyMembers** (or **participantProfiles**) for families that are “served” in the period (e.g. family has intake/assessment/interaction in range). Or use **outcomeSnapshots** if “participants_served” is pre-aggregated. |
| **Referrals made and completed** | **referrals**: count where organizationId + referredAt in range (made); count where status = completed and completedAt in range (completed). |
| **Participants by school** | **familySchoolLinks** with organizationId + schoolId + period overlapping report range; join to **families** (or count distinct familyId). Optionally denormalize schoolId onto **families** for simpler “current school” reporting. |
| **Participants by partner** | Same as school: **familyPartnerLinks** with organizationId + partnerOrgId + period; count distinct familyId. |
| **Staff submitted reports on time** | **staffWeeklyReports**: for each report, compare submittedAt to org-defined due (e.g. Friday EOD). Flag onTime = (submittedAt <= dueAt). Aggregate by staffUid. |
| **Planned vs actual per staff** | Join **staffWeeklyAgendas** and **staffWeeklyReports** by staffUid + weekStart. Compare agenda item count/hours to report totalHours and report item count. Optionally use **staffReportItems** for item-level comparison. |

---

## 5. Firestore tradeoffs and modeling notes

- **No SQL joins**: Denormalize IDs (organizationId, familyId, staffUid) and use composite indexes for filters + sort. Pre-aggregate in **organizationMetricsSnapshots** and **outcomeSnapshots** for dashboards.
- **Document size limit (1 MiB)**: Prefer subcollections for unbounded lists (e.g. survey questions, report items). Keep agenda “items” array small or move to subcollection if it grows.
- **Write rate**: Use **auditLogs** and event streams with care; batch or shard if volume is very high.
- **Indexes**: Every equality + inequality/sort combination used in a query needs a composite index. Define indexes for: org + time range, org + staff, org + family, org + school/partner, org + status.
- **Security**: Rules must require organizationId match and role (admin/staff/participant). Participant access limited to own family/participant data.

---

## 6. Composite index recommendations (see firestore.indexes.json)

- organizations: (organizationId), (status)
- organizationMemberships: (organizationId, uid), (organizationId, active, role)
- families: (organizationId, updatedAt), (organizationId, status), (organizationId, schoolId), (organizationId, partnerOrganizationId)
- familyMembers: (organizationId, familyId), (organizationId, isParticipant)
- intakes: (organizationId, familyId), (organizationId, status, submittedAt)
- assessments: (organizationId, familyId), (organizationId, completedAt)
- staffAssignments: (organizationId, staffUid), (organizationId, familyId)
- interactions: (organizationId, familyId, occurredAt), (organizationId, staffUid, occurredAt)
- notes: (organizationId, familyId, createdAt), (organizationId, caseId, createdAt)
- resources: (organizationId, categoryId)
- referrals: (organizationId, status, referredAt), (organizationId, familyId)
- familyDocuments: (organizationId, familyId), (organizationId, uploadedAt)
- reminders: (organizationId, assignedToUid, dueAt)
- staffWeeklyAgendas: (organizationId, staffUid, weekStart)
- staffWeeklyReports: (organizationId, staffUid, weekStart), (organizationId, submittedAt)
- surveyResponses: (organizationId, surveyId, submittedAt)
- outcomeSnapshots: (organizationId, periodStart, scope, scopeId)
- organizationMetricsSnapshots: (organizationId, periodStart, periodEnd)
- auditLogs: (organizationId, createdAt), (organizationId, actorUid, createdAt)
- familySchoolLinks: (organizationId, schoolId, periodStart)
- familyPartnerLinks: (organizationId, partnerOrgId, periodStart)

(Exact index definitions are in `firestore.indexes.json`.)

---

## 7. Seed / dev fixture strategy

- **One org**: Single organization doc + 2–3 organizationMemberships (admin, staff, participant).
- **Profiles**: One profile per membership uid.
- **Families**: 2–3 families with 1–2 familyMembers each; link one family to a school and one to a partner via familySchoolLinks / familyPartnerLinks.
- **Case**: One intake and one assessment per family; one goal with 1–2 goalTasks (in subcollections); one staffAssignment; one interaction; one note.
- **Resources**: 2–3 resources, 1–2 categories, one familyResourceAssignment, one referral (pending and one completed).
- **Documents**: One requiredDocumentTemplate, one familyDocument, one familyDocumentRequirement.
- **Admin**: One school, one partnerOrganization; one staffWeeklyAgenda and one staffWeeklyReport with 1–2 staffReportItems; one staffScheduleEntry; one organizationMetricsSnapshots for current month.
- **Audit**: 3–5 auditLog entries.
- **Surveys**: One survey with 2–3 surveyQuestions; one surveyResponse.
- **Outcomes**: One outcomeMetric, one outcomeSnapshots.

Seed scripts: TypeScript (or Node) script that uses Firebase Admin SDK to write fixtures; idempotent (delete + create or merge by doc ID). Separate files per domain or one seed file with ordered writes (org → memberships → profiles → families → …).
