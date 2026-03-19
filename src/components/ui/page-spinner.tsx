import { cn } from "@/lib/utils";

type PageSpinnerProps = {
  className?: string;
};

export function PageSpinner({ className }: PageSpinnerProps) {
  return (
    <div className={cn("flex min-h-[40vh] items-center justify-center", className)}>
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
