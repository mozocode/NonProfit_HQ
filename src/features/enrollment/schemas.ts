import { z } from "zod";

export const enrollmentSchema = z.object({
  programId: z.string().nullable(),
  enrollmentNotes: z.string().default(""),
  startDate: z.string().min(1, "Start date is required."),
  agreedToTerms: z.boolean().refine((v) => v === true, "You must agree to the program terms."),
});

export type EnrollmentSchema = z.infer<typeof enrollmentSchema>;
