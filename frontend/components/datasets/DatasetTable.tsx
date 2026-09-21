"use client";

import Image from "next/image";
import { ExtendedDataset } from "@/lib/mock-data";
import { SensorBadge } from "@/components/ui/SensorBadge";
import { Badge } from "@/components/ui/Badge";
import { ArrowUpDown } from "lucide-react";

interface DatasetTableProps {
  datasets: ExtendedDataset[];
  selectedDatasetId: string | null;
  onSelectDataset: (dataset: ExtendedDataset) => void;
  checkedIds: Set<string>;
  onToggleCheck: (id: string, e: React.MouseEvent) => void;
  onToggleAll: () => void;
}

export function DatasetTable({
  datasets,
  selectedDatasetId,
  onSelectDataset,
  checkedIds,
  onToggleCheck,
  onToggleAll,
}: DatasetTableProps) {
  const allChecked = datasets.length > 0 && datasets.every((d) => checkedIds.has(d.id));

  const formatPdsBadge = (level: ExtendedDataset["pdsLevel"]) => {
    switch (level) {
      case "Calibrated L2B":
        return <Badge variant="success">&bull; Calibrated</Badge>;
      case "Orthorectified":
        return <Badge variant="processing">&bull; Orthorectified</Badge>;
      case "Level-1 Raw":
        return <Badge variant="warning">&bull; Level-1 Raw</Badge>;
      default:
        return <Badge variant="default">{level}</Badge>;
    }
  };

  const formatAcquisitionTime = (isoString?: string) => {
    if (!isoString) return "N/A";
    const d = new Date(isoString);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const min = String(d.getUTCMinutes()).padStart(2, "0");
    const ss = String(d.getUTCSeconds()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss} UTC`;
  };

  return (
    <div className="bg-surface border border-border">
      {/* Table Metadata Bar */}
      <div className="px-4 py-2 bg-surface-secondary border-b border-border flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="font-bold text-text-primary">
            {datasets.length} Granules Found
          </span>
          <span className="hidden sm:inline text-text-muted">|</span>
          <span className="hidden sm:inline text-text-secondary">
            PDS4 Collection: <span className="text-accent">urn:isro:ch2:science_archive:data_calibrated</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-text-secondary cursor-pointer hover:text-text-primary">
          <span>Sort: Acquisition Time</span>
          <ArrowUpDown className="w-3.5 h-3.5 text-accent" />
        </div>
      </div>

      {/* Responsive Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse" aria-label="Lunar Planetary Datasets">
          <caption className="sr-only">
            List of PDS4 calibrated lunar imagery granules and elevation models
          </caption>
          <thead>
            <tr className="bg-navy text-white text-xs font-bold border-b border-navy-dark">
              <th scope="col" className="p-3 w-10 text-center border-r border-navy-dark">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={onToggleAll}
                  aria-label="Select all datasets"
                  className="w-4 h-4 accent-saffron cursor-pointer"
                />
              </th>
              <th scope="col" className="p-3 w-16 text-center border-r border-navy-dark">
                PREVIEW
              </th>
              <th scope="col" className="p-3 border-r border-navy-dark">
                DATASET UID
              </th>
              <th scope="col" className="p-3 border-r border-navy-dark">
                INSTRUMENT / MODE
              </th>
              <th scope="col" className="p-3 text-right border-r border-navy-dark">
                GSD
              </th>
              <th scope="col" className="p-3 text-center border-r border-navy-dark">
                RASTER DIM
              </th>
              <th scope="col" className="p-3 border-r border-navy-dark">
                ACQ UTC
              </th>
              <th scope="col" className="p-3 border-r border-navy-dark">
                TARGET MORPH
              </th>
              <th scope="col" className="p-3 text-center">
                PDS LEVEL
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-xs text-text-primary">
            {datasets.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-text-muted">
                  No matching lunar science granules found for the selected query or filters.
                </td>
              </tr>
            ) : (
              datasets.map((d, index) => {
                const isSelected = selectedDatasetId === d.id;
                const isChecked = checkedIds.has(d.id);
                return (
                  <tr
                    key={d.id}
                    onClick={() => onSelectDataset(d)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-accent-muted border-l-4 border-l-accent"
                        : index % 2 === 0
                        ? "bg-surface hover:bg-surface-secondary"
                        : "bg-surface-muted hover:bg-surface-secondary"
                    }`}
                  >
                    <td
                      className="p-3 text-center border-r border-border"
                      onClick={(e) => onToggleCheck(d.id, e)}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        aria-label={`Select ${d.name}`}
                        className="w-4 h-4 accent-saffron cursor-pointer"
                      />
                    </td>
                    <td className="p-2 border-r border-border text-center">
                      <div className="w-12 h-12 relative mx-auto bg-black border border-border rounded-sm overflow-hidden">
                        <Image
                          src={d.previewUrl || "/lunar-hud-bg.jpg"}
                          alt={`Thumbnail preview of ${d.name}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </td>
                    <td className="p-3 font-mono font-bold text-accent border-r border-border">
                      <span className="hover:underline">{d.name}</span>
                    </td>
                    <td className="p-3 border-r border-border">
                      <div className="space-y-1">
                        <SensorBadge sensor={d.sensor} />
                        <div className="text-[11px] text-text-secondary line-clamp-1">
                          {d.instrumentMode}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono font-bold border-r border-border tabular-nums text-text-primary">
                      {d.resolutionMetersPerPixel?.toFixed(2)} m/px
                    </td>
                    <td className="p-3 text-center font-mono border-r border-border tabular-nums text-text-secondary">
                      {d.width && d.height ? `${d.width}×${d.height}` : "Variable"}
                    </td>
                    <td className="p-3 font-mono border-r border-border text-text-secondary text-[11px]">
                      {formatAcquisitionTime(d.acquisitionTime)}
                    </td>
                    <td className="p-3 border-r border-border font-medium text-text-primary">
                      {d.targetMorphology}
                    </td>
                    <td className="p-3 text-center">
                      {formatPdsBadge(d.pdsLevel)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer matching datasets.jpeg */}
      <div className="px-4 py-3 bg-surface-secondary border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
        <div className="text-text-secondary">
          Displaying 1–{datasets.length} of 1,482 archive records |{" "}
          <span className="font-bold text-text-primary">
            Selected: {checkedIds.size} Granule{checkedIds.size !== 1 ? "s" : ""}{" "}
            {checkedIds.size > 0 && "(34.2 MB)"}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="px-2 py-1 bg-surface border border-border-input text-text-muted hover:text-text-primary rounded-sm cursor-pointer disabled:opacity-50"
            disabled
          >
            |&lt;
          </button>
          <button
            type="button"
            className="px-2 py-1 bg-surface border border-border-input text-text-muted hover:text-text-primary rounded-sm cursor-pointer disabled:opacity-50"
            disabled
          >
            &lt;
          </button>
          <button
            type="button"
            className="px-2.5 py-1 bg-navy text-white font-bold border border-navy rounded-sm cursor-pointer"
          >
            1
          </button>
          <button
            type="button"
            className="px-2.5 py-1 bg-surface border border-border-input text-text-secondary hover:bg-surface-tertiary rounded-sm cursor-pointer"
          >
            2
          </button>
          <button
            type="button"
            className="px-2.5 py-1 bg-surface border border-border-input text-text-secondary hover:bg-surface-tertiary rounded-sm cursor-pointer"
          >
            3
          </button>
          <span className="px-1 text-text-muted">...</span>
          <button
            type="button"
            className="px-2.5 py-1 bg-surface border border-border-input text-text-secondary hover:bg-surface-tertiary rounded-sm cursor-pointer"
          >
            247
          </button>
          <button
            type="button"
            className="px-2 py-1 bg-surface border border-border-input text-text-secondary hover:bg-surface-tertiary rounded-sm cursor-pointer"
          >
            &gt;
          </button>
          <button
            type="button"
            className="px-2 py-1 bg-surface border border-border-input text-text-secondary hover:bg-surface-tertiary rounded-sm cursor-pointer"
          >
            &gt;|
          </button>
        </div>
      </div>
    </div>
  );
}
