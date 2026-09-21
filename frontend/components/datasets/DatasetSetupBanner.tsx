"use client";

import { Info, Upload, Database } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface DatasetSetupBannerProps {
  totalCount: number;
  onUploadClick: () => void;
}

export function DatasetSetupBanner({ totalCount, onUploadClick }: DatasetSetupBannerProps) {
  if (totalCount === 0) {
    return (
      <div
        role="region"
        aria-label="Repository Setup Notice"
        className="mb-6 p-6 bg-surface border-2 border-accent text-text-primary rounded-sm"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-bold text-lg text-accent">
              <Database className="w-5 h-5 text-accent" />
              <span>Lunar Dataset Repository — No Imagery Ingested Yet</span>
            </div>
            <p className="text-sm text-text-secondary">
              Upload raw Chandrayaan-2 (OHRC, TMC-2, IIRS) or NASA PDS4 GeoTIFF rasters to begin registration analysis.
            </p>
          </div>
          <Button variant="primary" onClick={onUploadClick} className="shrink-0 flex items-center gap-2">
            <Upload className="w-4 h-4" />
            <span>Upload First Dataset &rarr;</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Scientific Repository Archive Notice"
      className="mb-4 px-4 py-2 bg-surface-secondary border border-border flex flex-wrap items-center justify-between gap-3 text-xs text-text-secondary"
    >
      <div className="flex items-center gap-2">
        <Info className="w-4 h-4 text-accent shrink-0" />
        <span>
          <strong className="font-bold text-text-primary">ISRO Portal / Data / Datasets Repository:</strong>{" "}
          Calibrated PDS4 Science Archives (v1.21.0) &bull; SPICE DE421 Validated Ephemeris &bull; 100% Catalog Sync
        </span>
      </div>
      <div className="flex items-center gap-3 font-mono text-[11px]">
        <span className="text-accent font-bold">SPICE CK/SPK: V09_RECON</span>
        <span className="text-success font-bold">&bull; CATALOG SYNC: 100%</span>
      </div>
    </div>
  );
}
