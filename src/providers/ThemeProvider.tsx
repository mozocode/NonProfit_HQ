"use client";

import { type PropsWithChildren } from "react";

/**
 * Theme provider placeholder. Extend with next-themes or custom theme state for dark mode.
 * CSS variables are defined in globals.css (:root).
 */
export function ThemeProvider({ children }: PropsWithChildren) {
  return <>{children}</>;
}
