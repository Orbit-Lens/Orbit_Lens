import { cn } from "@/lib/utils";

type AccuracyBarProps = {
  accuracyMeters: number;
  maxMeters?: number;
  showLabel?: boolean;
  className?: string;
};

export function AccuracyBar({
  accuracyMeters,
  maxMeters = 15,
  showLabel = true,
  className,
}: AccuracyBarProps) {
  let statusText = "High confidence";
  let fillColor = "bg-success";
  let textColor = "text-success";

  if (accuracyMeters <= 3) {
    statusText = "High confidence";
    fillColor = "bg-success";
    textColor = "text-success";
  } else if (accuracyMeters <= 5) {
    statusText = "Acceptable";
    fillColor = "bg-success";
    textColor = "text-success";
  } else if (accuracyMeters <= 10) {
    statusText = "Caution";
    fillColor = "bg-warning-fill";
    textColor = "text-warning";
  } else {
    statusText = "Low confidence";
    fillColor = "bg-error";
    textColor = "text-error";
  }

  const percentage = Math.max(
    5,
    Math.min(100, ((maxMeters - Math.min(accuracyMeters, maxMeters)) / maxMeters) * 100)
  );

  return (
    <div className={cn("flex flex-col gap-1 w-full", className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-[0.875rem]">
          <span className="font-bold tabular-nums text-text-primary">
            {accuracyMeters.toFixed(2)}m
          </span>
          <span className={cn("font-bold text-[0.8125rem]", textColor)}>{statusText}</span>
        </div>
      )}
      <div className="h-2 w-full bg-border-light border border-border rounded-sm overflow-hidden">
        <div
          className={cn("h-full transition-all duration-300", fillColor)}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={accuracyMeters}
          aria-valuemin={0}
          aria-valuemax={maxMeters}
        />
      </div>
    </div>
  );
}
