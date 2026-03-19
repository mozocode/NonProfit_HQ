"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type FormProps = React.FormHTMLAttributes<HTMLFormElement>;

const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ className, ...props }, ref) => (
    <form
      ref={ref}
      className={cn("space-y-6", className)}
      {...props}
    />
  ),
);
Form.displayName = "Form";

export type FormFieldProps = React.HTMLAttributes<HTMLDivElement>;

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-2", className)} {...props} />
  ),
);
FormField.displayName = "FormField";

export { Form, FormField };
