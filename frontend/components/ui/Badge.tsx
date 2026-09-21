import React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "error"
  | "processing"
  | "queued";

type BadgeProps = {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variantClasses: Record<BadgeVariant, string> = {
    default: "bg-surface-secondary text-text-secondary border-border",
    success: "bg-success-light text-success-foreground border-success",
    warning: "bg-warning-light text-warning-foreground border-warning",
    error: "bg-error-light text-error-foreground border-error",
    processing: "bg-accent-light text-accent border-accent",
    queued: "bg-surface-tertiary text-text-secondary border-border",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 text-[0.875rem] font-bold rounded-sm border",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
