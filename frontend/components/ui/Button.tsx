import React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center font-bold rounded-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2";

  const sizeClasses = {
    sm: "px-3 py-1 text-[0.875rem] min-h-[32px]",
    md: "px-4 py-2 text-[1rem] min-h-[40px]",
    lg: "px-6 py-2.5 text-[1.125rem] min-h-[48px]",
  }[size];

  const variantClasses = {
    primary:
      "bg-accent hover:bg-accent-dark text-accent-foreground border border-accent-dark",
    secondary:
      "bg-surface border border-accent text-accent hover:bg-accent-muted",
    ghost:
      "bg-transparent text-accent underline hover:bg-accent-muted border-none",
    danger:
      "bg-error hover:bg-error-foreground text-surface border border-error-foreground",
  }[variant];

  return (
    <button
      className={cn(baseClasses, sizeClasses, variantClasses, className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
