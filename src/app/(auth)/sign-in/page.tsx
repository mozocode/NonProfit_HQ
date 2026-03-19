import { redirect } from "next/navigation";

import { ROUTES } from "@/constants";

/**
 * Sign-in route: redirects to login (same auth flow).
 */
export default function SignInPage() {
  redirect(ROUTES.LOGIN);
}
