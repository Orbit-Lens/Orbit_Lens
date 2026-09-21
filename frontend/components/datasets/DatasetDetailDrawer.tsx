"use client";

import Image from "next/image";
import Link from "next/link";
import { X, Download, Compass, Layers } from "lucide-react";
import { ExtendedDataset } from "@/lib/mock-data";
import { Button } from "@/components/ui/Button";

interface DatasetDetailDrawerProps {
  dataset: ExtendedDataset | null;
  onClose: () => void;
}

export function DatasetDetailDrawer({ dataset, onClose }: DatasetDetailDrawerProps) {
  if (!dataset) {
    return null;
  }

  const maxBinVal = Math.max(...dataset.dnSpread.bins, 1);

  return (
    <div className="bg-surface border-2 border-border p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-sm">
      {/* Top Header */}
      <div className="border-b border-border pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <span className="inline-block text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 bg-navy text-white rounded-sm">
              PDS-4 TARGET {dataset.pdsLevel}
            </span>
            <h2 className="text-base sm:text-lg font-bold font-mono text-accent break-all leading-tight">
              {dataset.name}
            </h2>
            <p className="text-xs text-text-secondary">{dataset.instrumentMode}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-text-muted hover:text-text-primary hover:bg-surface-secondary rounded-sm cursor-pointer"
            aria-label="Close dataset inspector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Lunar Crater Preview Image with Telemetry HUD Overlay */}
      <div className="relative w-full aspect-square bg-black border border-border rounded-sm overflow-hidden group">
        <Image
          src={dataset.previewUrl || "/lunar-hud-bg.jpg"}
          alt={`Planetary raster preview for ${dataset.name}`}
          fill
          priority
          className="object-cover contrast-125"
        />

        {/* Top HUD Data Tags */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none text-[10px] font-mono text-white font-bold drop-shadow">
          <span className="bg-black/75 px-1.5 py-0.5 border border-slate-700/80 rounded-sm">
            ORBIT: 1245 | IMG: 89
          </span>
          <span className="bg-black/75 px-1.5 py-0.5 border border-slate-700/80 rounded-sm">
            SUN ELEV: {dataset.sunElevationDeg}&deg;
          </span>
          <span className="bg-black/75 px-1.5 py-0.5 border border-[#38bdf8]/60 text-[#38bdf8] rounded-sm">
            GSD: {dataset.resolutionMetersPerPixel?.toFixed(3)} m/px
          </span>
        </div>

        {/* Reticle grid marks in center */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40 group-hover:opacity-80 transition-opacity">
          <div className="w-16 h-16 border border-dashed border-white/60 rounded-full" />
        </div>

        {/* Bottom Coordinate Readout */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none text-[10px] font-mono text-slate-200 bg-black/80 px-2 py-0.5 border border-slate-700/80 rounded-sm">
          <span>500 m T GRID</span>
          <span>N 85.2418&deg; S, 128.9204&deg; E</span>
        </div>
      </div>

      {/* PDS4 Orbital Telemetry Grid */}
      <div className="border border-border-light bg-surface-muted p-3 rounded-sm space-y-2.5 text-xs font-mono">
        <div className="flex items-center justify-between text-[11px] font-bold text-navy border-b border-border-light pb-1">
          <span>PDS4 ORBITAL TELEMETRY</span>
          <span className="text-text-muted">IAU_2000_MOON</span>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
          <div>
            <div className="text-[10px] text-text-muted font-bold">PRODUCT LOGICAL UID</div>
            <div className="text-text-primary truncate" title={`urn:isro:ch2:${dataset.name}`}>
              urn:isro:ch2:{dataset.name}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-text-muted font-bold">PIXEL GROUND SCALE</div>
            <div className="text-text-primary">
              {dataset.resolutionMetersPerPixel?.toFixed(3)} m/px @ 100km
            </div>
          </div>
          <div>
            <div className="text-[10px] text-text-muted font-bold">SOLAR INCIDENCE (i)</div>
            <div className="text-text-primary">
              {dataset.incidenceAngleDeg}&deg; (Grazing Relief)
            </div>
          </div>
          <div>
            <div className="text-[10px] text-text-muted font-bold">SOLAR AZIMUTH (&Phi;)</div>
            <div className="text-text-primary">{dataset.sunAzimuthDeg}&deg;</div>
          </div>
          <div>
            <div className="text-[10px] text-text-muted font-bold">SENSOR EMISSION (e)</div>
            <div className="text-text-primary">
              {dataset.emissionAngleDeg}&deg; (Nadir Track &plusmn;1&deg;)
            </div>
          </div>
          <div>
            <div className="text-[10px] text-text-muted font-bold">EPHEMERIS KERNEL</div>
            <div className="text-success font-bold">{dataset.ephemerisKernel}</div>
          </div>
          <div>
            <div className="text-[10px] text-text-muted font-bold">REFERENCE DATUM</div>
            <div className="text-text-primary">Sphere R=1,737,400 m</div>
          </div>
          <div>
            <div className="text-[10px] text-text-muted font-bold">RADIOMETRIC UNITS</div>
            <div className="text-text-primary truncate">W / (m&sup2; &bull; sr &bull; &micro;m)</div>
          </div>
        </div>

        <div className="pt-2 border-t border-border-light flex items-center justify-between text-[11px]">
          <span className="text-text-muted">Package:</span>
          <span className="font-bold text-accent">
            Cloud-Optimized GeoTIFF (COG) {(dataset.fileSizeBytes! / 1048576).toFixed(1)} MB + PDS4 XML
          </span>
        </div>
      </div>

      {/* 12-Bit Radiometric DN Spread Histogram */}
      <div className="border border-border p-3 bg-surface rounded-sm space-y-1.5 font-mono">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-text-primary text-[11px] uppercase tracking-wider">
            Radiometric DN Spread (12-Bit)
          </span>
          <span className="text-[10px] text-text-muted">
            Min: {dataset.dnSpread.min} | Max: {dataset.dnSpread.max} | Mean: {dataset.dnSpread.mean}
          </span>
        </div>

        {/* Histogram Bars */}
        <div className="h-14 flex items-end gap-1 pt-2 px-1 bg-surface-secondary border border-border-light rounded-sm">
          {dataset.dnSpread.bins.map((count, i) => {
            const heightPct = Math.round((count / maxBinVal) * 100);
            return (
              <div
                key={i}
                className="flex-1 bg-navy hover:bg-accent rounded-t-[1px] transition-colors relative group"
                style={{ height: `${heightPct}%` }}
              >
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block px-1.5 py-0.5 bg-black text-white text-[9px] rounded-sm pointer-events-none z-10 whitespace-nowrap">
                  Bin {i + 1}: {count}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2 border-t border-border">
        <Link
          href={`/new-analysis?refId=${dataset.id}`}
          className="w-full py-2.5 px-4 bg-navy hover:bg-navy-dark text-white font-bold text-sm rounded-sm flex items-center justify-center gap-2 transition-colors no-underline"
        >
          <Layers className="w-4 h-4" />
          <span>Launch Analysis Workstation &rarr;</span>
        </Link>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            onClick={() => alert(`Opening ${dataset.name} in planetary 3D GIS viewer...`)}
            className="flex items-center justify-center gap-1.5 text-xs py-2 px-2"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Open in 3D GIS</span>
          </Button>

          <Button
            variant="secondary"
            onClick={() =>
              alert(`Exporting PDS4 XML metadata bundle for ${dataset.name} (14.2 KB)...`)
            }
            className="flex items-center justify-center gap-1.5 text-xs py-2 px-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export XML Bundle</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
