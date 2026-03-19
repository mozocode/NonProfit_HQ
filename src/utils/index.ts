/**
 * Pure utilities (formatting, validation helpers, etc.).
 * Keep side-effect free for use in server and client.
 */

export function formatDate(value: Date | string): string {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
