import React from "react";
import { cn } from "@/lib/utils";

type PanelProps = {
  title?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
};

export function Panel({
  title,
  actions,
  children,
  className,
  bodyClassName,
  headerClassName,
}: PanelProps) {
  return (
    <section className={cn("bg-surface border border-border rounded-sm", className)}>
      {title && (
        <div
          className={cn(
            "bg-surface-tertiary border-b border-border px-4 py-2.5 flex items-center justify-between",
            headerClassName
          )}
        >
          <h2 className="text-[1.125rem] font-bold text-accent leading-tight m-0">{title}</h2>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}
