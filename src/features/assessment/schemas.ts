import { z } from "zod";

export const assessmentSchema = z.object({
  assessmentType: z.string().min(1, "Assessment type is required."),
  strengths: z.string().min(1, "Strengths are required."),
  needs: z.string().min(1, "Needs are required."),
  goalsSummary: z.string().min(1, "Goals summary is required."),
  recommendedServices: z.string().default(""),
  additionalNotes: z.string().default(""),
});

export type AssessmentSchema = z.infer<typeof assessmentSchema>;
