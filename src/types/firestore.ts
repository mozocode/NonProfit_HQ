import { z } from "zod";

export const roleSchema = z.enum(["admin", "staff", "participant"]);

const timestampSchema = z.string().datetime();

export const organizationSchema = z.object({
  orgId: z.string(),
  name: z.string().min(1),
  status: z.enum(["active", "inactive"]),
  settings: z.record(z.string(), z.unknown()).default({}),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const orgUserSchema = z.object({
  orgId: z.string(),
  uid: z.string(),
  role: roleSchema,
  programIds: z.array(z.string()).default([]),
  active: z.boolean(),
  invitedBy: z.string().nullable(),
  joinedAt: timestampSchema,
});

export const familySchema = z.object({
  familyId: z.string(),
  orgId: z.string(),
  primaryContact: z.object({
    firstName: z.string(),
    lastName: z.string(),
    phone: z.string().nullable(),
    email: z.string().email().nullable(),
  }),
  status: z.enum(["active", "inactive", "archived"]),
  schoolId: z.string().nullable(),
  partnerOrgId: z.string().nullable(),
  createdBy: z.string(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const caseSchema = z.object({
  caseId: z.string(),
  orgId: z.string(),
  familyId: z.string(),
  assignedStaffUid: z.string().nullable(),
  programId: z.string().nullable(),
  stage: z.enum(["intake", "assessment", "enrolled", "closed"]),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const taskSchema = z.object({
  taskId: z.string(),
  orgId: z.string(),
  caseId: z.string().nullable(),
  goalId: z.string().nullable(),
  assignedToUid: z.string().nullable(),
  title: z.string(),
  status: z.enum(["todo", "in_progress", "done", "blocked"]),
  dueDate: timestampSchema.nullable(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type OrganizationDoc = z.infer<typeof organizationSchema>;
export type OrgUserDoc = z.infer<typeof orgUserSchema>;
export type FamilyDoc = z.infer<typeof familySchema>;
export type CaseDoc = z.infer<typeof caseSchema>;
export type TaskDoc = z.infer<typeof taskSchema>;
