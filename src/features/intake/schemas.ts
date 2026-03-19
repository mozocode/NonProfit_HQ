import { z } from "zod";

export const intakeDemographicsSchema = z.object({
  preferredLanguage: z.string().optional(),
  householdSize: z.coerce.number().int().min(0).optional(),
  numberOfAdults: z.coerce.number().int().min(0).optional(),
  numberOfChildren: z.coerce.number().int().min(0).optional(),
  zipCode: z.string().max(20).optional(),
}).strict();

export const intakeSchema = z.object({
  reasonForInitialCall: z.string().min(1, "Reason for initial call is required."),
  whatTheyHaveTried: z.string().min(1, "Describe what they have tried."),
  presentingChallenges: z.string().min(1, "Presenting challenges are required."),
  demographics: intakeDemographicsSchema.default({}),
});

export type IntakeSchema = z.infer<typeof intakeSchema>;
