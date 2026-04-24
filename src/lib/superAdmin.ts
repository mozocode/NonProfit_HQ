const SUPER_ADMIN_EMAILS = new Set(["mozodevelopment@gmail.com"]);

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.has(email.trim().toLowerCase());
}
