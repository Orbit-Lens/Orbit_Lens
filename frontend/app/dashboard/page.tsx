"use client";

import React from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SensorBadge } from "@/components/ui/SensorBadge";
import { MOCK_DATASETS } from "@/lib/mock-data";
import {
  Database,
  Target,
  Compass,
  Cpu,
  Layers,
  ArrowRight,
  ShieldCheck,
  Radio,
  FileText,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="space-y-6 py-4">
        {/* Welcome Banner */}
        <div className="bg-surface border-2 border-border p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-success" />
              <span className="text-xs font-mono font-bold text-success uppercase tracking-wider">
                Scientific Workspace Active
              </span>
              <span className="text-xs text-text-muted">•</span>
              <span className="text-xs text-text-muted font-mono">
                Node: SAC-AHM-LUNAR-01
              </span>
            </div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              Welcome back, {user?.name || "Scientist"}
            </h1>
            <p className="text-sm text-text-secondary mt-0.5">
              {user?.institution || "Space Applications Centre (ISRO)"} • Access Level:{" "}
              <span className="font-bold text-navy uppercase">{user?.role || "Researcher"}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/new-analysis" className="no-underline">
              <Button variant="primary" className="flex items-center gap-1.5">
                <Target className="w-4 h-4" />
                <span>New Registration</span>
              </Button>
            </Link>
            <Link href="/datasets" className="no-underline">
              <Button variant="secondary" className="flex items-center gap-1.5">
                <Database className="w-4 h-4" />
                <span>Datasets Library</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* 4 Metric KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface border border-border p-4 shadow-sm">
            <div className="flex items-center justify-between text-text-muted mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Active Datasets</span>
              <Database className="w-4 h-4 text-accent" />
            </div>
            <div className="text-2xl font-bold text-text-primary">6 Products</div>
            <div className="text-xs text-text-muted mt-1">OHRC, TMC-2, IIRS, LROC</div>
          </div>

          <div className="bg-surface border border-border p-4 shadow-sm">
            <div className="flex items-center justify-between text-text-muted mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Sub-Pixel Precision</span>
              <Target className="w-4 h-4 text-success" />
            </div>
            <div className="text-2xl font-bold text-success">0.38 px RMSE</div>
            <div className="text-xs text-text-muted mt-1">Exceeds &le; 0.50 px Gold Standard</div>
          </div>

          <div className="bg-surface border border-border p-4 shadow-sm">
            <div className="flex items-center justify-between text-text-muted mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Spatial Coverage</span>
              <Compass className="w-4 h-4 text-navy" />
            </div>
            <div className="text-2xl font-bold text-text-primary">89.0%</div>
            <div className="text-xs text-text-muted mt-1">Uniform 8&times;8 grid distribution</div>
          </div>

          <div className="bg-surface border border-border p-4 shadow-sm">
            <div className="flex items-center justify-between text-text-muted mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Pipeline Engine</span>
              <Cpu className="w-4 h-4 text-saffron-dark" />
            </div>
            <div className="text-2xl font-bold text-text-primary">USAC + ECC</div>
            <div className="text-xs text-text-muted mt-1">FastAPI Worker + LoFTR Ready</div>
          </div>
        </div>

        {/* Two Columns: Recent Datasets & System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Recent Datasets Panel */}
          <div className="lg:col-span-8">
            <Panel
              title="Recent Chandrayaan-2 Imagery Datasets"
              headerClassName="bg-surface-secondary flex items-center justify-between"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border text-xs text-text-secondary uppercase bg-surface-muted">
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3">Sensor</th>
                      <th className="py-2.5 px-3">Resolution</th>
                      <th className="py-2.5 px-3">Sun Azimuth</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {MOCK_DATASETS.slice(0, 4).map((d) => (
                      <tr key={d.id} className="hover:bg-surface-muted transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-text-primary text-xs">{d.name}</div>
                          <div className="text-[11px] text-text-muted font-mono">{d.filename}</div>
                        </td>
                        <td className="py-3 px-3">
                          <SensorBadge sensor={d.sensor} />
                        </td>
                        <td className="py-3 px-3 text-xs font-mono">
                          {d.resolutionMetersPerPixel ? `${d.resolutionMetersPerPixel} m/px` : "—"}
                        </td>
                        <td className="py-3 px-3 text-xs font-mono">
                          {d.sunAzimuthDeg ? `${d.sunAzimuthDeg}°` : "—"}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link href={`/datasets/${d.id}`} className="no-underline">
                            <Button variant="secondary" size="sm">
                              Inspect
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between mt-3 text-xs">
                <span className="text-text-muted">Showing 4 of {MOCK_DATASETS.length} datasets</span>
                <Link
                  href="/datasets"
                  className="font-bold text-accent hover:underline flex items-center gap-1 no-underline"
                >
                  <span>View All Datasets in Catalog</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Panel>
          </div>

          {/* Right Column: Mission Telemetry & Operations Panel */}
          <div className="lg:col-span-4 space-y-4">
            <Panel title="Mission Operational Node" headerClassName="bg-surface-secondary">
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-text-muted">Express Web Backend</span>
                  <Badge variant="success">Port 5000 Online</Badge>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-text-muted">Database Engine</span>
                  <Badge variant="processing">MongoDB Atlas / Local Active</Badge>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-text-muted">Raster Storage</span>
                  <Badge variant="default">S3 / Local Storage Ready</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">CV / ML Service</span>
                  <Badge variant="warning">Port 8000 Internal</Badge>
                </div>
              </div>
            </Panel>

            <Panel title="Quick Registration Launch" headerClassName="bg-accent-muted border-b border-accent/20">
              <div className="space-y-3 text-xs text-text-secondary">
                <p>
                  Perform coarse-to-fine registration across wide scale ratios (OHRC 25cm &harr; TMC-2 5m).
                </p>
                <div className="p-2.5 bg-surface-muted border border-border space-y-1 font-mono text-[11px]">
                  <div>&bull; Multiscale Gaussian Pyramid</div>
                  <div>&bull; Retinex Log-Domain Illumination</div>
                  <div>&bull; Sub-Pixel ECC Refinement</div>
                </div>
                <Link href="/new-analysis" className="block no-underline pt-1">
                  <Button variant="primary" className="w-full flex items-center justify-center gap-1.5">
                    <Target className="w-4 h-4" />
                    <span>Open Registration Studio</span>
                  </Button>
                </Link>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
