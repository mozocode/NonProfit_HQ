export const PLAN_FEATURES: Record<"starter" | "growth" | "professional" | "enterprise", string[]> = {
  starter: ["case_timeline", "inquiries", "documentation_packs"],
  growth: ["case_timeline", "inquiries", "documentation_packs", "handoffs"],
  professional: ["case_timeline", "inquiries", "documentation_packs", "handoffs", "auditable_exports"],
  enterprise: ["case_timeline", "inquiries", "documentation_packs", "handoffs", "auditable_exports", "advanced_automation"],
};
