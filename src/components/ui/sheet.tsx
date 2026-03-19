"use client";

import { X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SheetContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SheetContext = React.createContext<SheetContextValue | null>(null);

export interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

function Sheet({ open = false, onOpenChange, children }: SheetProps) {
  const [openState, setOpenState] = React.useState(open);
  const isControlled = onOpenChange != null;
  const isOpen = isControlled ? open : openState;
  const setIsOpen = isControlled ? onOpenChange! : setOpenState;

  React.useEffect(() => {
    if (isControlled) setOpenState(open);
  }, [isControlled, open]);

  return (
    <SheetContext.Provider value={{ open: isOpen, onOpenChange: setIsOpen }}>
      {children}
    </SheetContext.Provider>
  );
}

export interface SheetTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

function SheetTrigger({ asChild, onClick, ...props }: SheetTriggerProps) {
  const ctx = React.useContext(SheetContext);
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

type SheetSide = "left" | "right" | "top" | "bottom";

const sideClasses: Record<SheetSide, string> = {
  left: "inset-y-0 left-0 h-full w-3/4 max-w-sm transition-transform duration-200 ease-out -translate-x-full data-[state=open]:translate-x-0",
  right: "inset-y-0 right-0 h-full w-3/4 max-w-sm transition-transform duration-200 ease-out translate-x-full data-[state=open]:translate-x-0",
  top: "inset-x-0 top-0 w-full transition-transform duration-200 ease-out -translate-y-full data-[state=open]:translate-y-0",
  bottom: "inset-x-0 bottom-0 w-full transition-transform duration-200 ease-out translate-y-full data-[state=open]:translate-y-0",
};

export interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: SheetSide;
  showClose?: boolean;
}

function SheetContent({
  side = "right",
  className,
  children,
  showClose = true,
  ...props
}: SheetContentProps) {
  const ctx = React.useContext(SheetContext);

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

  if (!ctx?.open) return null;

  return (
    <div className="fixed inset-0 z-50" aria-modal role="dialog">
      <div
        className="fixed inset-0 bg-black/50"
        aria-hidden
        onClick={() => ctx.onOpenChange(false)}
      />
      <div
        data-state={ctx.open ? "open" : "closed"}
        className={cn(
          "fixed z-50 gap-4 border bg-card p-6 shadow-lg",
          sideClasses[side],
          (side === "left" || side === "right") && "flex flex-col",
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

export type SheetHeaderProps = React.HTMLAttributes<HTMLDivElement>;

function SheetHeader({ className, ...props }: SheetHeaderProps) {
  return <div className={cn("flex flex-col space-y-1.5", className)} {...props} />;
}

export type SheetTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

function SheetTitle({ className, ...props }: SheetTitleProps) {
  return <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />;
}

export type SheetDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

function SheetDescription({ className, ...props }: SheetDescriptionProps) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
};
