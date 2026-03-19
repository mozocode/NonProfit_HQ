"use client";

import { X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue | null>(null);

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

function Dialog({ open = false, onOpenChange, children }: DialogProps) {
  const [openState, setOpenState] = React.useState(open);
  const isControlled = onOpenChange != null;
  const isOpen = isControlled ? open : openState;
  const setIsOpen = isControlled ? onOpenChange! : setOpenState;

  React.useEffect(() => {
    if (isControlled) setOpenState(open);
  }, [isControlled, open]);

  return (
    <DialogContext.Provider value={{ open: isOpen, onOpenChange: setIsOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

export interface DialogTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

function DialogTrigger({ asChild, onClick, ...props }: DialogTriggerProps) {
  const ctx = React.useContext(DialogContext);
  if (!ctx) return null;
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    ctx.onOpenChange(true);
    onClick?.(e);
  };
  if (asChild && React.isValidElement(props.children)) {
    return React.cloneElement(props.children as React.ReactElement<{ onClick?: React.MouseEventHandler }>, {
      onClick: handleClick,
    });
  }
  return <button type="button" onClick={handleClick} {...props} />;
}

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  onClose?: () => void;
  showClose?: boolean;
}

function DialogContent({
  className,
  children,
  onClose,
  showClose = true,
  ...props
}: DialogContentProps) {
  const ctx = React.useContext(DialogContext);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!ctx?.open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") ctx.onOpenChange(false);
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [ctx?.open]);

  React.useEffect(() => {
    if (!ctx?.open) return;
    ref.current?.focus({ preventScroll: true });
  }, [ctx?.open]);

  if (!ctx?.open) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      ctx.onOpenChange(false);
      onClose?.();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal
      role="dialog"
    >
      <div
        className="fixed inset-0 bg-black/50"
        aria-hidden
        onClick={handleOverlayClick}
      />
      <div
        ref={ref}
        tabIndex={-1}
        className={cn(
          "relative z-50 w-full max-w-lg rounded-lg border bg-card p-6 shadow-lg focus:outline-none",
          className,
        )}
        {...props}
      >
        {showClose ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 size-8 rounded-md"
            aria-label="Close"
            onClick={() => ctx.onOpenChange(false)}
          >
            <X className="size-4" />
          </Button>
        ) : null}
        {children}
      </div>
    </div>
  );
}

export type DialogHeaderProps = React.HTMLAttributes<HTMLDivElement>;

function DialogHeader({ className, ...props }: DialogHeaderProps) {
  return <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />;
}

export type DialogFooterProps = React.HTMLAttributes<HTMLDivElement>;

function DialogFooter({ className, ...props }: DialogFooterProps) {
  return (
    <div
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

export type DialogTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

function DialogTitle({ className, ...props }: DialogTitleProps) {
  return <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />;
}

export type DialogDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

function DialogDescription({ className, ...props }: DialogDescriptionProps) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
