const read = (key: string): boolean => process.env[key] === "true";

export const FEATURE_FLAGS = {
  tenantAdminWorkspace: read("NEXT_PUBLIC_FF_TENANT_ADMIN_WORKSPACE"),
  inquiryPipeline: read("NEXT_PUBLIC_FF_INQUIRY_PIPELINE"),
  handoffCollaboration: read("NEXT_PUBLIC_FF_HANDOFF_COLLABORATION"),
  documentationPacks: read("NEXT_PUBLIC_FF_DOCUMENTATION_PACKS"),
  auditableExports: read("NEXT_PUBLIC_FF_AUDITABLE_EXPORTS"),
  monetizationEntitlements: read("NEXT_PUBLIC_FF_MONETIZATION_ENTITLEMENTS"),
} as const;
