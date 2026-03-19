/**
 * Notification stubs for email and in-app notifications.
 * Replace with real implementations (SendGrid, FCM, etc.) when ready.
 */

export interface NotifyStaffPayload {
  staffUid: string;
  organizationId: string;
  title: string;
  body: string;
  type?: "reminder" | "prompt" | "info";
  linkPath?: string;
}

export interface NotifyAdminPayload {
  organizationId: string;
  title: string;
  body: string;
  adminUids: string[];
  type?: "overdue_report" | "overdue_agenda" | "summary";
}

export interface SendEmailPayload {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

/**
 * Notify a staff member (in-app or email). Stub: logs only.
 */
export async function notifyStaff(payload: NotifyStaffPayload): Promise<void> {
  // TODO: Write to a user notifications collection or send FCM.
  console.log("[notifyStaff]", payload.staffUid, payload.title, payload.body);
}

/**
 * Notify admins of an organization. Stub: logs only.
 */
export async function notifyAdmins(payload: NotifyAdminPayload): Promise<void> {
  // TODO: Fan-out to admin notification tokens or email.
  console.log("[notifyAdmins]", payload.organizationId, payload.title, payload.adminUids.length);
}

/**
 * Send an email. Stub: logs only.
 */
export async function sendEmail(payload: SendEmailPayload): Promise<void> {
  // TODO: Integrate SendGrid, Mailgun, or Firebase Extensions (Trigger Email).
  console.log("[sendEmail]", payload.to, payload.subject);
}
