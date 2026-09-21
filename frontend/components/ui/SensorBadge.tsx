import { cn } from "@/lib/utils";
import { SensorType } from "@/types/api";

type SensorBadgeProps = {
  sensor: SensorType | "TMC" | "LROC NAC" | "DFSAR";
  mode?: string;
  className?: string;
};

export function SensorBadge({ sensor, mode, className }: SensorBadgeProps) {
  const getColors = () => {
    switch (sensor) {
      case "OHRC":
        return "bg-ohrc-light text-ohrc border-ohrc";
      case "TMC":
      case "TMC-2":
        return "bg-tmc-light text-tmc border-tmc";
      case "IIRS":
        return "bg-iirs-light text-iirs border-iirs";
      case "LRO_NAC":
      case "LROC NAC":
      case "LRO_WAC":
        return "bg-accent-light text-accent-dark border-accent";
      default:
        return "bg-surface-secondary text-text-secondary border-border";
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 text-[0.875rem] font-bold rounded-sm border",
        getColors(),
        className
      )}
    >
      <span>{sensor}</span>
      {mode && <span className="text-[0.75rem] opacity-80 font-normal">({mode})</span>}
    </span>
  );
}
