"use client";

import { Calendar } from "lucide-react";
import * as React from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type DatePickerProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

/**
 * Native date input styled to match the design system. For richer calendars
 * consider a library (e.g. react-day-picker) later.
 */
const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ className, ...props }, ref) => (
    <div className="relative">
      <Calendar
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        ref={ref}
        type="date"
        className={cn("pl-9", className)}
        {...props}
      />
    </div>
  ),
);
DatePicker.displayName = "DatePicker";

export { DatePicker };
