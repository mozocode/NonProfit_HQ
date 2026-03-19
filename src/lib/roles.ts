import type { AppRole } from "@/types/auth";

export function inferRoleFromEmail(email: string | null): AppRole | null {
  if (!email) return null;
  if (email.includes("admin")) return "admin";
  if (email.includes("participant")) return "participant";
  if (email.includes("staff")) return "staff";
  return null;
}
