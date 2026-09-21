"use client";

import { Search, X, Lock, Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";

export type PayloadFilter = "ALL" | "OHRC" | "TMC-2" | "IIRS" | "LROC NAC" | "DFSAR";
export type PixelScaleFilter = "ALL" | "ULTRA" | "STEREO" | "SPECTROSCOPY";
export type RegionFilter = "ALL" | "South Pole Rim" | "Shackleton Crater" | "De Gerlache" | "Amundsen Basin" | "Manzinus C";

interface DatasetFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedPayload: PayloadFilter;
  onPayloadChange: (p: PayloadFilter) => void;
  selectedScale: PixelScaleFilter;
  onScaleChange: (s: PixelScaleFilter) => void;
  selectedRegion: RegionFilter;
  onRegionChange: (r: RegionFilter) => void;
  selectedCount: number;
  onUploadClick: () => void;
  onBatchDownloadClick: () => void;
}

export function DatasetFilters({
  searchQuery,
  onSearchChange,
  selectedPayload,
  onPayloadChange,
  selectedScale,
  onScaleChange,
  selectedRegion,
  onRegionChange,
  selectedCount,
  onUploadClick,
  onBatchDownloadClick,
}: DatasetFiltersProps) {
  const payloads: { id: PayloadFilter; label: string }[] = [
    { id: "ALL", label: "ALL" },
    { id: "OHRC", label: "OHRC (High-Res PAN)" },
    { id: "TMC-2", label: "TMC-2 (Triple Stereo)" },
    { id: "IIRS", label: "IIRS (Hyperspectral)" },
    { id: "LROC NAC", label: "LROC NAC (Reference)" },
    { id: "DFSAR", label: "DFSAR (Radar S-Band)" },
  ];

  const scales: { id: PixelScaleFilter; label: string }[] = [
    { id: "ALL", label: "ALL SCALES" },
    { id: "ULTRA", label: "< 0.50 m/px (Ultra High)" },
    { id: "STEREO", label: "0.5 - 5.0 m/px (Stereo DEM)" },
    { id: "SPECTROSCOPY", label: "> 10 m/px (Spectroscopy)" },
  ];

  const regions: { id: RegionFilter; label: string }[] = [
    { id: "ALL", label: "ALL TARGETS" },
    { id: "South Pole Rim", label: "South Pole Rim" },
    { id: "Shackleton Crater", label: "Shackleton Rim" },
    { id: "De Gerlache", label: "De Gerlache" },
    { id: "Amundsen Basin", label: "Amundsen Basin" },
    { id: "Manzinus C", label: "Manzinus C" },
  ];

  return (
    <div className="bg-surface border border-border p-4 mb-4 space-y-4">
      {/* Top Header Row with Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-border-light">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
            LUNAR SCIENTIFIC DATASET REPOSITORY
          </h1>
          <p className="text-xs text-text-secondary mt-0.5 max-w-3xl">
            Query, inspect and ingest PDS4-compliant lunar orbital imagery, elevation profiles, and cartographic products from Chandrayaan and coordinated reference archives.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="primary"
            onClick={onUploadClick}
            className="flex items-center gap-2 text-xs py-2 px-3"
          >
            <Upload className="w-4 h-4" />
            <span>+ Upload Lunar Imagery</span>
          </Button>

          <Button
            variant="secondary"
            onClick={onBatchDownloadClick}
            className="flex items-center gap-1.5 text-xs py-2 px-3"
            disabled={selectedCount === 0}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Batch Download ({selectedCount})</span>
          </Button>
        </div>
      </div>

      {/* Search Input and Coordinate Lock Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search Granule UID, Sensor, or PDS4 Identifier (e.g. CH2_OHRC_0421)..."
            className="w-full bg-surface border border-border-input pl-9 pr-8 py-2 text-sm text-text-primary rounded-sm font-mono focus:outline-3 focus:outline-accent placeholder:text-text-muted"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer p-0.5"
              aria-label="Clear search query"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Coordinate Locking Tag */}
        <div className="flex items-center gap-2 px-3 py-2 bg-surface-secondary border border-border-input/60 rounded-sm font-mono text-xs text-text-secondary shrink-0">
          <span className="font-bold text-text-primary">LAT/LON:</span>
          <span>-85.2&deg; / 128.9&deg; &plusmn;0.5&deg;</span>
          <span className="flex items-center gap-1 text-accent font-bold ml-1">
            <Lock className="w-3 h-3" />
            <span>Lock</span>
          </span>
        </div>
      </div>

      {/* Filter Rows */}
      <div className="space-y-2 pt-2 border-t border-border-light text-xs">
        {/* Payload Row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-24 font-bold text-text-primary shrink-0 uppercase tracking-wider text-[11px]">
            Payload:
          </span>
          <div className="flex flex-wrap gap-1">
            {payloads.map((p) => {
              const active = selectedPayload === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onPayloadChange(p.id)}
                  className={`px-2 py-0.5 rounded-sm font-bold border transition-colors cursor-pointer ${
                    active
                      ? "bg-navy text-white border-navy"
                      : "bg-surface border-border-input text-text-secondary hover:bg-surface-secondary"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pixel Scale Row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-24 font-bold text-text-primary shrink-0 uppercase tracking-wider text-[11px]">
            Pixel Scale:
          </span>
          <div className="flex flex-wrap gap-1">
            {scales.map((s) => {
              const active = selectedScale === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onScaleChange(s.id)}
                  className={`px-2 py-0.5 rounded-sm font-bold border transition-colors cursor-pointer ${
                    active
                      ? "bg-navy text-white border-navy"
                      : "bg-surface border-border-input text-text-secondary hover:bg-surface-secondary"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Region Target Row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-24 font-bold text-text-primary shrink-0 uppercase tracking-wider text-[11px]">
            Region Target:
          </span>
          <div className="flex flex-wrap gap-1">
            {regions.map((r) => {
              const active = selectedRegion === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onRegionChange(r.id)}
                  className={`px-2 py-0.5 rounded-sm font-bold border transition-colors cursor-pointer ${
                    active
                      ? "bg-navy text-white border-navy"
                      : "bg-surface border-border-input text-text-secondary hover:bg-surface-secondary"
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
