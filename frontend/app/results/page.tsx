"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import {
  Download,
  FileText,
  Share2,
  CheckCircle2,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Search,
  Crosshair,
  Hash,
  ShieldCheck,
  Compass,
  Layers,
  ArrowLeft,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

function ResultsContent() {
  const searchParams = useSearchParams();
  const rawJobId = searchParams.get("jobId");
  const jobId = rawJobId && rawJobId !== "undefined" ? rawJobId : "CH2-GEO-MATCH-8842";
  const srcParam = searchParams.get("src") || "ch2_tmc2_1187";
  const refParam = searchParams.get("ref") || "ch2_ohrc_0421";

  // Viewer interactive states
  const [activeTab, setActiveTab] = useState<"checkerboard" | "heatmap" | "vectors">("heatmap");
  const [blendAlpha, setBlendAlpha] = useState<number>(80);
  const [sobelFilter, setSobelFilter] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  // Trigger export downloads
  const handleExportGeoTIFF = () => {
    setDownloadNotice("Exporting Cloud-Optimized GeoTIFF (COG)...");
    const blob = new Blob(["ORBITLENS_GEOTIFF_REGISTERED_PRODUCT_BINARY"], { type: "image/tiff" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${jobId}_registered_product.tif`;
    a.click();
    setTimeout(() => setDownloadNotice(null), 3000);
  };

  const handleExportXML = () => {
    setDownloadNotice("Downloading PDS-4 L2B XML Label Archive...");
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Product_Observational xmlns="http://pds.nasa.gov/pds4/pds/v1">
  <Identification_Area>
    <logical_identifier>urn:isro:ch2:orbitlens:${jobId}</logical_identifier>
    <version_id>1.0</version_id>
    <title>OrbitLens Chandrayaan-2 Co-Registered Photogrammetric Product</title>
  </Identification_Area>
  <Observation_Area>
    <Mission_Area>Chandrayaan-2</Mission_Area>
    <Target_Area>Moon (Schrödinger Basin / South Pole)</Target_Area>
    <Solar_Azimuth unit="deg">145.20</Solar_Azimuth>
    <Solar_Elevation unit="deg">32.50</Solar_Elevation>
    <Registration_RMSE unit="pixel">0.72</Registration_RMSE>
  </Observation_Area>
</Product_Observational>`;
    const blob = new Blob([xmlContent], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${jobId}_pds4_label.xml`;
    a.click();
    setTimeout(() => setDownloadNotice(null), 3000);
  };

  const handleScientificReport = () => {
    setDownloadNotice("Compiling Mission-Readiness Scientific Report PDF...");
    window.print();
    setTimeout(() => setDownloadNotice(null), 3000);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setDownloadNotice("Results link copied to clipboard!");
    setTimeout(() => setDownloadNotice(null), 3000);
  };

  // Residual histogram bars (matching n=842 pts from result.jpeg)
  const histogramBars = [
    { label: "0.0", height: 25 },
    { label: "0.2", height: 48 },
    { label: "0.4", height: 75 },
    { label: "0.6", height: 95, isMean: true },
    { label: "0.8", height: 82 },
    { label: "1.0", height: 50 },
    { label: "1.2", height: 32 },
    { label: "1.4", height: 18 },
    { label: "1.6", height: 10 },
    { label: "2.0", height: 6 },
  ];

  return (
    <div className="space-y-4 py-3 max-w-[1280px] mx-auto text-text-primary">
      {/* Download / Share Toast Notification */}
      {downloadNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-navy text-white px-4 py-2.5 rounded-sm shadow-lg border border-saffron flex items-center gap-2 text-xs font-mono animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-saffron" />
          <span>{downloadNotice}</span>
        </div>
      )}

      {/* Top Header with Breadcrumb, Title and Action Buttons */}
      <div className="bg-surface border border-border p-4 shadow-sm">
        <div className="flex items-center justify-between text-xs text-text-muted mb-1.5 font-mono">
          <div className="flex items-center gap-1.5">
            <Link href="/" className="text-accent hover:underline no-underline">
              ISRO Portal
            </Link>
            <span>&gt;</span>
            <Link href="/dashboard" className="text-accent hover:underline no-underline">
              Workspace
            </Link>
            <span>&gt;</span>
            <span className="font-bold text-text-primary">Results</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-[11px] uppercase font-bold text-success">
              Processing Convergence Met
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-navy m-0 flex items-center gap-2">
              <span>Analysis Results: {jobId}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-success-lightest border border-success text-success-foreground font-bold rounded-sm">
                <span className="w-2 h-2 rounded-full bg-success" />
                Alignment Converged (0.72 px RMSE)
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-accent-muted border border-accent/40 text-accent font-bold rounded-sm">
                <Check className="w-3.5 h-3.5 text-accent" />
                PDS-4 Validated
              </span>
              <span className="px-2 py-0.5 bg-surface-secondary border border-border text-text-secondary font-mono text-[11px] rounded-sm">
                SAC-AHM-04
              </span>
            </div>
          </div>

          {/* Action Buttons Matching result.jpeg */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportGeoTIFF}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-navy hover:bg-navy-dark text-white rounded-sm text-xs font-bold transition-colors cursor-pointer border border-navy-dark"
            >
              <Download className="w-3.5 h-3.5 text-saffron" />
              <span>EXPORT GEOTIFF (COG)</span>
            </button>

            <button
              type="button"
              onClick={handleExportXML}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface hover:bg-surface-secondary text-text-primary rounded-sm text-xs font-bold transition-colors cursor-pointer border border-border"
            >
              <FileText className="w-3.5 h-3.5 text-accent" />
              <span>PDS-4 XML ARCHIVE</span>
            </button>

            <button
              type="button"
              onClick={handleScientificReport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface hover:bg-surface-secondary text-text-primary rounded-sm text-xs font-bold transition-colors cursor-pointer border border-border"
            >
              <FileText className="w-3.5 h-3.5 text-navy" />
              <span>SCIENTIFIC REPORT</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              title="Share or Copy Link"
              className="p-1.5 bg-surface hover:bg-surface-secondary text-text-secondary rounded-sm border border-border cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4 Summary Stat Cards Matching result.jpeg */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Inlier Consensus */}
        <div className="bg-surface border border-border p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-text-muted mb-1 text-xs font-bold uppercase tracking-wider">
            <span>INLIER CONSENSUS</span>
            <CheckCircle2 className="w-4 h-4 text-accent" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-navy tabular-nums">91.4%</span>
            <span className="text-xs text-text-muted font-mono">842 / 921 pts</span>
          </div>
          <div className="w-full bg-surface-secondary h-1.5 rounded-full mt-2 overflow-hidden border border-border-light">
            <div className="bg-accent h-full rounded-full" style={{ width: "91.4%" }} />
          </div>
        </div>

        {/* Card 2: Reprojection Error */}
        <div className="bg-surface border border-border p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-text-muted mb-1 text-xs font-bold uppercase tracking-wider">
            <span>REPROJECTION ERROR</span>
            <span className="px-1.5 py-0.2 bg-accent-muted text-accent border border-accent/40 text-[10px] font-bold rounded-sm">
              SUB-PIXEL
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-navy tabular-nums">0.72 px</span>
            <span className="text-xs text-success font-bold font-mono">&plusmn;0.14</span>
          </div>
          <div className="text-[11px] text-text-muted mt-1.5">L-M Optimization Converged</div>
        </div>

        {/* Card 3: Structural Index (SSIM) */}
        <div className="bg-surface border border-border p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-text-muted mb-1 text-xs font-bold uppercase tracking-wider">
            <span>STRUCTURAL INDEX (SSIM)</span>
            <Hash className="w-4 h-4 text-accent" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-navy tabular-nums">0.884</span>
            <span className="px-1.5 py-0.2 bg-success-lightest text-success border border-success/40 text-[10px] font-bold rounded-sm">
              Grade A
            </span>
          </div>
          <div className="text-[11px] text-text-muted mt-1.5">Radiometric correlation high</div>
        </div>

        {/* Card 4: Coordinate Residual Delta */}
        <div className="bg-surface border border-border p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-text-muted mb-1 text-xs font-bold uppercase tracking-wider">
            <span>COORDINATE RESIDUAL &Delta;</span>
            <Crosshair className="w-4 h-4 text-accent" />
          </div>
          <div className="space-y-0.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-text-muted">LAT:</span>
              <span className="font-bold text-text-primary">+0.0012&deg; (~36.3m)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">LON:</span>
              <span className="font-bold text-text-primary">-0.0008&deg; (~24.2m)</span>
            </div>
          </div>
          <div className="text-[10px] text-text-muted mt-1 font-mono">
            Lunar South Pole 85.2&deg;S Frame
          </div>
        </div>
      </div>

      {/* Main Workspace Layout (Left: Co-Registration Viewer, Right: Analytics Panels) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Co-Registration Viewer (VIEW A) */}
        <div className="lg:col-span-8 bg-surface border border-border shadow-sm flex flex-col">
          {/* Subheader and Tabs matching result.jpeg */}
          <div className="p-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-surface-secondary">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 bg-navy text-white text-[11px] font-bold rounded-sm">
                VIEW A
              </span>
              <span className="text-xs font-bold text-text-primary">
                Schr&ouml;dinger Basin / South Pole Wall Co-registration
              </span>
            </div>

            {/* View Mode Switcher Tabs */}
            <div className="flex items-center gap-1 bg-surface border border-border p-0.5 rounded-sm text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab("checkerboard")}
                className={`px-2.5 py-1 rounded-sm transition-colors cursor-pointer ${
                  activeTab === "checkerboard"
                    ? "bg-navy text-white"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                CHECKERBOARD
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("heatmap")}
                className={`px-2.5 py-1 rounded-sm transition-colors cursor-pointer ${
                  activeTab === "heatmap"
                    ? "bg-navy text-white"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                RESIDUAL HEATMAP
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("vectors")}
                className={`px-2.5 py-1 rounded-sm transition-colors cursor-pointer ${
                  activeTab === "vectors"
                    ? "bg-navy text-white"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                VECTORS
              </button>
            </div>
          </div>

          {/* Interactive Lunar Surface Visualizer Canvas */}
          <div className="relative bg-overlay-dark min-h-[460px] overflow-hidden flex items-center justify-center select-none border-b border-border">
            {/* Top-Left Canvas HUD Coordinates */}
            <div className="absolute top-3 left-3 z-20 px-2 py-1 bg-black/80 text-white font-mono text-[11px] border border-white/20 rounded-sm">
              LAT: 85.2418&deg; S | LON: 128.9294&deg; E
            </div>

            {/* Top-Right Compass Orientation Indicator */}
            <div className="absolute top-3 right-3 z-20 px-2 py-1 bg-black/80 text-saffron font-mono text-[11px] border border-white/20 rounded-sm flex items-center gap-1">
              <span>&#9650; NORTH 0.0&deg;</span>
            </div>

            {/* Simulated Imagery Layers with Blend Alpha & Filter */}
            <div
              className="w-full h-full min-h-[460px] relative transition-transform duration-200 flex items-center justify-center"
              style={{ transform: `scale(${zoomLevel / 100})` }}
            >
              {/* Base High-Resolution Lunar Imagery */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: "url('/lunar-hud-bg.jpg')",
                  filter: sobelFilter ? "contrast(1.3) brightness(0.95)" : "none",
                }}
              />

              {/* Heatmap / Difference Map Overlay */}
              <div
                className="absolute inset-0 transition-opacity duration-150 mix-blend-screen pointer-events-none"
                style={{
                  opacity: blendAlpha / 100,
                  background:
                    activeTab === "heatmap"
                      ? "radial-gradient(circle at 50% 50%, rgba(0, 255, 200, 0.45) 0%, rgba(0, 150, 255, 0.35) 40%, rgba(255, 100, 50, 0.25) 75%, transparent 100%)"
                      : activeTab === "checkerboard"
                      ? "repeating-conic-gradient(rgba(0,0,0,0.5) 0% 25%, transparent 0% 50%) 50% / 40px 40px"
                      : "transparent",
                }}
              />

              {/* Center Targeting Reticle */}
              <div className="absolute w-32 h-32 border border-dashed border-cyan-400/60 rounded-full flex items-center justify-center pointer-events-none">
                <div className="w-2 h-2 rounded-full bg-cyan-400" />
                <div className="absolute -top-4 text-[10px] font-mono text-cyan-300">
                  Schr&ouml;dinger Crater (75.0&deg;S, 132.0&deg;E)
                </div>
              </div>

              {/* Inlier Vector Grid (if activeTab === "vectors") */}
              {activeTab === "vectors" && (
                <div className="absolute inset-0 pointer-events-none grid grid-cols-6 grid-rows-6 p-8">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-success" />
                      <div className="w-4 h-0.5 bg-success/80 rotate-12 origin-left" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom-Left Scale Bar Overlay */}
            <div className="absolute bottom-3 left-3 z-20 px-2 py-1 bg-black/80 text-white font-mono text-[11px] border border-white/20 rounded-sm flex items-center gap-2">
              <span className="w-12 h-1 bg-white inline-block" />
              <span>5.0 km | 1 px &asymp; 0.25 m</span>
            </div>

            {/* Bottom-Right Elevation & Residual Legend */}
            <div className="absolute bottom-3 right-3 z-20 px-2.5 py-1.5 bg-black/80 text-white font-mono text-[10px] border border-white/20 rounded-sm space-y-1">
              <div className="flex items-center justify-between gap-4">
                <span>-15m</span>
                <span>0m</span>
                <span>+15m</span>
              </div>
              <div className="w-28 h-2 bg-gradient-to-r from-blue-500 via-green-400 to-red-500 rounded-sm" />
            </div>
          </div>

          {/* Bottom Interactive Toolbar (Blend Alpha, High-Pass, Zoom Controls) */}
          <div className="p-3 bg-surface-secondary flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Blend Alpha Slider */}
            <div className="flex items-center gap-3">
              <span className="font-bold text-text-secondary uppercase text-[11px]">
                BLEND ALPHA:
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={blendAlpha}
                onChange={(e) => setBlendAlpha(Number(e.target.value))}
                className="w-36 accent-navy cursor-pointer"
              />
              <span className="font-mono font-bold text-navy w-9">{blendAlpha}%</span>
            </div>

            {/* Sobel Filter Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer font-bold text-text-secondary select-none">
              <input
                type="checkbox"
                checked={sobelFilter}
                onChange={(e) => setSobelFilter(e.target.checked)}
                className="w-4 h-4 accent-navy rounded-sm cursor-pointer"
              />
              <span>Sobel Edge High-Pass</span>
            </label>

            {/* Canvas Zoom Tools */}
            <div className="flex items-center gap-1 bg-surface border border-border p-0.5 rounded-sm">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(z - 15, 70))}
                title="Zoom Out"
                className="p-1 hover:bg-surface-secondary rounded-sm cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1 font-mono text-[11px] text-text-muted">{zoomLevel}%</span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(z + 15, 200))}
                title="Zoom In"
                className="p-1 hover:bg-surface-secondary rounded-sm cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(100)}
                title="Reset Scale"
                className="p-1 hover:bg-surface-secondary rounded-sm cursor-pointer border-l border-border"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Analytics & Matrices Panels */}
        <div className="lg:col-span-4 space-y-4">
          {/* Panel 1: 3x3 Homography Matrix (H) */}
          <div className="bg-surface border border-border p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2 font-bold text-navy text-xs uppercase tracking-wider">
                <Hash className="w-4 h-4 text-accent" />
                <span>3&times;3 HOMOGRAPHY MATRIX (H)</span>
              </div>
              <span className="px-1.5 py-0.5 bg-accent-muted text-accent border border-accent/40 font-mono text-[11px] font-bold rounded-sm">
                DET: 0.968
              </span>
            </div>

            {/* 3x3 Values Grid */}
            <div className="p-2.5 bg-surface-muted border border-border font-mono text-xs text-text-primary space-y-1">
              <div className="grid grid-cols-3 gap-2 text-right">
                <span>+0.984210</span>
                <span>-0.012480</span>
                <span>+142.812</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-right">
                <span>+0.011920</span>
                <span>+0.983900</span>
                <span>-84.150</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-right text-text-muted">
                <span>-0.000008</span>
                <span>+0.000002</span>
                <span>+1.000000</span>
              </div>
            </div>

            {/* Rotation & Scale Breakdown */}
            <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
              <div className="p-2 bg-surface-secondary border border-border rounded-sm">
                <div className="text-text-muted text-[10px] font-bold uppercase">Rotational Yaw</div>
                <div className="font-mono font-bold text-navy mt-0.5">+0.712&deg; CW</div>
              </div>
              <div className="p-2 bg-surface-secondary border border-border rounded-sm">
                <div className="text-text-muted text-[10px] font-bold uppercase">Scale Factor</div>
                <div className="font-mono font-bold text-navy mt-0.5">1 : 19.88x</div>
              </div>
            </div>
          </div>

          {/* Panel 2: Residual Distribution Histogram */}
          <div className="bg-surface border border-border p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="text-xs font-bold text-navy uppercase tracking-wider">
                RESIDUAL DISTRIBUTION (PX)
              </div>
              <span className="text-[11px] font-mono text-text-muted">n=842 pts</span>
            </div>

            {/* Bar Histogram Visualization */}
            <div className="h-28 flex items-end justify-between gap-1 pt-4 pb-1 px-2 bg-surface-muted border border-border relative">
              {/* Mean Marker Line */}
              <div
                className="absolute top-1 bottom-1 w-px bg-error z-10 flex flex-col items-center"
                style={{ left: "42%" }}
              >
                <span className="text-[9px] font-mono font-bold text-error bg-surface px-1 -mt-1 rounded-sm border border-error/40">
                  &mu; = 0.72 px
                </span>
              </div>

              {histogramBars.map((b, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div
                    className={`w-full rounded-t-sm transition-all ${
                      b.isMean ? "bg-accent" : "bg-navy/70 hover:bg-navy"
                    }`}
                    style={{ height: `${b.height}%` }}
                    title={`${b.label} px: ${b.height * 9} pts`}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-between text-[10px] font-mono text-text-muted px-1">
              <span>0.0 px</span>
              <span className="text-error font-bold">&mu; = 0.72 px</span>
              <span>1.0 px</span>
              <span>2.0 px</span>
            </div>
          </div>

          {/* Panel 3: Sensor Calibration Validation Box */}
          <div className="bg-surface border border-border p-3.5 shadow-sm space-y-2">
            <div className="flex items-start gap-2.5 text-xs text-text-secondary">
              <ShieldCheck className="w-5 h-5 text-success shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-text-primary text-[11px] uppercase tracking-wider">
                  SENSOR CALIBRATION VALIDATED
                </div>
                <p className="text-[11px] leading-relaxed text-text-muted mt-0.5 m-0">
                  Planetary ephemeris verified against SPICE CH2_DE421 kernels with zero coordinate drift at 85.2&deg;S.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Photogrammetric Product Specifications Table Matching result.jpeg */}
      <div className="bg-surface border border-border p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-accent" />
            <span>REGISTERED PHOTOGRAMMETRIC PRODUCT SPECIFICATIONS</span>
          </div>
          <span className="px-2 py-0.5 bg-surface-secondary border border-border font-mono text-[11px] font-bold text-text-secondary rounded-sm">
            L2B Planetary Record
          </span>
        </div>

        {/* 6-Column Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 text-xs font-mono">
          {/* Col 1 */}
          <div className="p-2.5 bg-surface-muted border border-border space-y-1">
            <div className="text-[10px] font-bold text-text-muted uppercase">Reference Sensor (Base)</div>
            <div className="font-bold text-navy">CH2_OHRC_0421 | 0.25 m/px</div>
            <div className="text-[11px] text-text-muted">Solar Elevation: 18.4&deg; | Orbit #1245</div>
          </div>

          {/* Col 2 */}
          <div className="p-2.5 bg-surface-muted border border-border space-y-1">
            <div className="text-[10px] font-bold text-text-muted uppercase">Warp Target Sensor</div>
            <div className="font-bold text-navy">CH2_TMC2_1187 | Resampled</div>
            <div className="text-[11px] text-text-muted">Native GSD: 5.0 m/px | Orbit #1187</div>
          </div>

          {/* Col 3 */}
          <div className="p-2.5 bg-surface-muted border border-border space-y-1">
            <div className="text-[10px] font-bold text-text-muted uppercase">Cartographic Projection</div>
            <div className="font-bold text-text-primary">IAU2000 Moon Polar Stereo</div>
            <div className="text-[11px] text-text-muted">Datum Radius: 1737.4 km</div>
          </div>

          {/* Col 4 */}
          <div className="p-2.5 bg-surface-muted border border-border space-y-1">
            <div className="text-[10px] font-bold text-text-muted uppercase">Storage Footprint &amp; Assets</div>
            <div className="font-bold text-text-primary">34.2 MB Cloud-Optimized COG</div>
            <div className="text-[11px] text-text-muted">+14 KB PDS-4 L2B Label XML</div>
          </div>

          {/* Col 5 */}
          <div className="p-2.5 bg-surface-muted border border-border space-y-1">
            <div className="text-[10px] font-bold text-text-muted uppercase">Coverage Footprint Corridor</div>
            <div className="font-bold text-text-primary">85.2418&deg; S, 128.9204&deg; E</div>
            <div className="text-[11px] text-text-muted">Shackleton-Manzinus C Corridor</div>
          </div>

          {/* Col 6 */}
          <div className="p-2.5 bg-surface-muted border border-border space-y-1">
            <div className="text-[10px] font-bold text-text-muted uppercase">Checksum &amp; Verification</div>
            <div className="font-bold text-text-primary truncate" title="4f82a9d20c58e19b6319e7">
              SHA-256: 4f82a9...6319e7
            </div>
            <div className="text-[11px] text-success font-bold">CRC32 Integrity Confirmed</div>
          </div>
        </div>
      </div>

      {/* Terminal Node Bar at Bottom matching result.jpeg */}
      <div className="p-2.5 bg-navy text-white text-[11px] font-mono flex flex-wrap items-center justify-between gap-2 border border-navy-dark">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success" />
          <span>ISRO Scientific Processing Node: SAC-AHM-LUNAR-04</span>
          <span>|</span>
          <span className="text-saffron">Node Status: ONLINE</span>
        </div>
        <div className="flex items-center gap-3 text-text-on-navy-muted">
          <span>Ephemeris: SPICE-CH2-DE421</span>
          <span>|</span>
          <span>CRS: Lunar 2000 Sphere IAU/IAG</span>
          <span>|</span>
          <span className="text-success">Latency: 28ms</span>
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="p-8 text-center text-sm font-mono">Loading Photogrammetric Results...</div>}>
        <ResultsContent />
      </Suspense>
    </ProtectedRoute>
  );
}
