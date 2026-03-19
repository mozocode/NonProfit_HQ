import type { InteractionType } from "@/types/domain";

export const INTERACTION_TYPE_LABELS: Record<InteractionType, string> = {
  call: "Phone call",
  meeting: "Meeting",
  check_in: "Check-in",
  referral_follow_up: "Referral follow-up",
  visit: "Visit",
  email: "Email",
  other: "Other",
};
