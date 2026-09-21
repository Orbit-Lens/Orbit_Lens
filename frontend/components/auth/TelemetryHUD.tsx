"use client";

import Image from "next/image";
import { Crosshair, Radio } from "lucide-react";

export function TelemetryHUD() {
  return (
    <div className="relative w-full h-full min-h-[560px] lg:min-h-[700px] bg-black overflow-hidden flex flex-col justify-between border-2 border-navy-dark shadow-inner">
      {/* Background Lunar Satellite Imagery */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/lunar-hud-bg.jpg"
          alt="Chandrayaan-2 OHRC high-resolution lunar south pole surface imagery"
          fill
          priority
          className="object-cover object-center opacity-90 contrast-125"
        />
        {/* Subtle vignette and scanline effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
      </div>

      {/* Top Telemetry Header and Metric HUD Box */}
      <div className="relative z-10 p-5 sm:p-6 space-y-4">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-black/80 border border-[#3b82f6]/50 rounded-sm text-xs font-bold tracking-wider text-[#93c5fd] backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#3b82f6] animate-pulse" />
            LUNAR REMOTE SENSING SYSTEM // CHANDRAYAAN
          </div>
          <div className="px-3 py-1 bg-black/70 border border-slate-700 rounded-sm text-xs font-bold tracking-wider text-slate-300 backdrop-blur-md">
            PAYLOAD: OHRC / SAC
          </div>
        </div>

        {/* Optical Metric & CRS Card */}
        <div className="max-w-md bg-black/80 border border-slate-700/80 p-3.5 rounded-sm backdrop-blur-md text-white font-mono space-y-2.5">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                OPTICAL METRIC
              </div>
              <div className="font-bold text-slate-100 text-[11px] sm:text-xs">
                GSD: 0.25 m/px @ 100km Alt
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                TARGET SECTOR
              </div>
              <div className="font-bold text-slate-100 text-[11px] sm:text-xs">
                SOUTH POLE (85.2°S - 90.0°S)
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                COORDINATE REFERENCE SYSTEM
              </div>
              <div className="text-[11px] font-bold text-slate-200">
                IAU2000 Moon Orthographic (Lon: 0.0°, Lat: -90.0°)
              </div>
            </div>
            <Crosshair className="w-4 h-4 text-[#38bdf8] shrink-0 ml-2" />
          </div>
        </div>
      </div>

      {/* Center Targeting Reticle */}
      <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none py-6">
        <div className="relative flex flex-col items-center">
          {/* Target label */}
          <div className="text-xs font-mono font-bold tracking-widest text-slate-300 bg-black/70 px-2 py-0.5 border border-slate-600/70 mb-2">
            [TGT-09] POLAR-A
          </div>

          {/* Reticle Circle & Crosshair */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
            {/* Outer dotted reticle */}
            <div className="absolute inset-0 rounded-full border border-dashed border-slate-400/50 animate-[spin_40s_linear_infinite]" />
            {/* Inner crosshair circle */}
            <div className="w-12 h-12 rounded-full border border-[#38bdf8]/70 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-[#38bdf8] animate-ping" />
              <div className="w-1.5 h-1.5 rounded-full bg-white absolute" />
            </div>
            {/* Crosshair ticks */}
            <div className="absolute top-0 w-0.5 h-3 bg-[#38bdf8]" />
            <div className="absolute bottom-0 w-0.5 h-3 bg-[#38bdf8]" />
            <div className="absolute left-0 h-0.5 w-3 bg-[#38bdf8]" />
            <div className="absolute right-0 h-0.5 w-3 bg-[#38bdf8]" />
          </div>

          {/* Precision telemetry readout */}
          <div className="flex gap-4 mt-2 text-[11px] font-mono font-bold text-slate-300 bg-black/75 px-3 py-1 border border-slate-700/60 rounded-sm">
            <span>RAD- OK</span>
            <span className="text-[#4ade80]">CORR: 99.4%</span>
          </div>
        </div>
      </div>

      {/* Bottom Operational Node Banner */}
      <div className="relative z-10 bg-[#040914]/95 border-t border-slate-800 p-5 backdrop-blur-md">
        <div className="flex items-center gap-1.5 text-xs tracking-wider text-[#38bdf8] font-bold">
          <Radio className="w-3.5 h-3.5 shrink-0" />
          <span>OPERATIONAL NODE: SPACE APPLICATIONS CENTRE (SAC), AHMEDABAD</span>
        </div>
        <h2 className="text-base sm:text-lg font-bold text-white mt-1 leading-snug">
          Indian Lunar Remote Sensing &amp; Image Analysis System
        </h2>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-xl">
          Multimodal correspondence, sub-pixel feature registration and elevation extraction for Chandrayaan-2/3 mission payloads.
        </p>
      </div>
    </div>
  );
}
