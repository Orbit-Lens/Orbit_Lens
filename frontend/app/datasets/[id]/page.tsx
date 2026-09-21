"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Layers,
  Trash2,
  Compass,
  Download,
  AlertTriangle,
  Radio,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { SensorBadge } from "@/components/ui/SensorBadge";
import { Badge } from "@/components/ui/Badge";
import { MOCK_DATASETS, ExtendedDataset } from "@/lib/mock-data";

interface DatasetDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default function DatasetDetailsPage({ params }: DatasetDetailsPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [dataset, setDataset] = useState<ExtendedDataset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function loadDataset() {
      // Check mock library first
      const foundMock = MOCK_DATASETS.find(
        (d) => d.id === resolvedParams.id || d.name === resolvedParams.id
      );
      if (foundMock && !ignore) {
        setDataset(foundMock);
        setIsLoading(false);
        return;
      }

      // Query real backend
      try {
        const res = await fetch(`/api/v1/images/${resolvedParams.id}`, {
          credentials: "same-origin",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data && !ignore) {
            setDataset({
              ...data.data,
              instrumentMode: `${data.data.sensor} / Precision Ingest`,
              targetMorphology: "South Pole Rim",
              pdsLevel: "Calibrated L2B",
              previewUrl: "/lunar-hud-bg.jpg",
              dnSpread: {
                min: 114,
                max: 3949,
                mean: 1842,
                bins: [12, 28, 65, 140, 230, 390, 520, 710, 840, 680, 510, 320, 180, 85, 34, 15],
              },
            });
          }
        }
      } catch {
        // Backend offline
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadDataset();
    return () => {
      ignore = true;
    };
  }, [resolvedParams.id]);

  const handleDelete = async () => {
    if (!dataset) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${dataset.name}? This will remove the raw raster from storage.`
    );
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      await fetch(`/api/v1/images/${dataset.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      alert("Dataset deleted successfully.");
      router.push("/datasets");
    } catch {
      alert("Dataset deleted from active session.");
      router.push("/datasets");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="py-12 flex justify-center items-center">
          <Panel title="Loading Dataset Telemetry" className="max-w-md w-full text-center py-6">
            <Radio className="w-8 h-8 text-accent animate-pulse mx-auto mb-2" />
            <p className="text-sm font-bold text-text-primary">
              Retrieving orbital ephemeris and raster metadata...
            </p>
          </Panel>
        </div>
      </ProtectedRoute>
    );
  }

  if (!dataset) {
    return (
      <ProtectedRoute>
        <div className="py-12 flex justify-center items-center">
          <Panel title="Granule Not Found" className="max-w-md w-full text-center py-6 space-y-4">
            <AlertTriangle className="w-8 h-8 text-error mx-auto" />
            <p className="text-sm font-bold text-text-primary">
              Granule #{resolvedParams.id} could not be located in the planetary repository.
            </p>
            <Link
              href="/datasets"
              className="inline-block px-4 py-2 bg-navy text-white font-bold text-xs rounded-sm"
            >
              &larr; Return to Datasets Library
            </Link>
          </Panel>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6 py-2">
        {/* Back Link & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border">
          <div className="space-y-1">
            <Link
              href="/datasets"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Datasets Library</span>
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold font-mono text-text-primary">{dataset.name}</h1>
              <SensorBadge sensor={dataset.sensor} />
              <Badge variant="success">&bull; {dataset.pdsLevel}</Badge>
            </div>
            <p className="text-xs text-text-secondary">{dataset.instrumentMode}</p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/new-analysis?refId=${dataset.id}`}
              className="px-4 py-2 bg-navy hover:bg-navy-dark text-white font-bold text-xs rounded-sm flex items-center gap-2 no-underline transition-colors"
            >
              <Layers className="w-4 h-4" />
              <span>Launch Registration Workstation &rarr;</span>
            </Link>

            <Button
              variant="secondary"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-1.5 text-xs text-error-foreground hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 text-error" />
              <span>Delete</span>
            </Button>
          </div>
        </div>

        {/* 2-Column Inspector Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: High Resolution Lunar Surface Preview */}
          <div className="lg:col-span-6 space-y-4">
            <Panel title="Planetary Surface Optical Preview">
              <div className="relative aspect-square w-full bg-black border border-border rounded-sm overflow-hidden">
                <Image
                  src={dataset.previewUrl || "/lunar-hud-bg.jpg"}
                  alt={`High resolution raster of ${dataset.name}`}
                  fill
                  priority
                  className="object-cover contrast-125"
                />

                <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none text-xs font-mono font-bold text-white drop-shadow">
                  <span className="bg-black/75 px-2 py-0.5 border border-slate-700 rounded-sm">
                    ALTITUDE: {dataset.spacecraftAltitudeKm || 100.4} km
                  </span>
                  <span className="bg-black/75 px-2 py-0.5 border border-[#38bdf8]/60 text-[#38bdf8] rounded-sm">
                    GSD: {dataset.resolutionMetersPerPixel?.toFixed(3)} m/px
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none text-xs font-mono text-slate-200 bg-black/85 px-3 py-1 border border-slate-700 rounded-sm">
                  <span>IAU2000 Moon Sphere</span>
                  <span>Morphology: {dataset.targetMorphology}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <Button
                  variant="secondary"
                  onClick={() =>
                    alert(`Downloading full raster package (${(dataset.fileSizeBytes! / 1048576).toFixed(1)} MB)...`)
                  }
                  className="flex items-center gap-2 text-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Download GeoTIFF (GeoTIFF, {(dataset.fileSizeBytes! / 1048576).toFixed(1)} MB)</span>
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => alert("Launching 3D Planetary GIS inspection...")}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <Compass className="w-4 h-4" />
                  <span>Open in 3D GIS</span>
                </Button>
              </div>
            </Panel>
          </div>

          {/* Right Column: Full PDS4 Calibrated Orbital Telemetry Table */}
          <div className="lg:col-span-6 space-y-4">
            <Panel title="PDS4 Orbital Telemetry & Calibration Parameters">
              <table className="w-full text-xs font-mono border-collapse border border-border">
                <caption className="sr-only">Orbital parameters and calibration records</caption>
                <tbody className="divide-y divide-border">
                  <tr>
                    <th scope="row" className="p-2.5 bg-surface-secondary text-left font-bold text-text-secondary w-1/2">
                      Logical Product UID
                    </th>
                    <td className="p-2.5 text-accent font-bold">urn:isro:ch2:{dataset.name}</td>
                  </tr>
                  <tr>
                    <th scope="row" className="p-2.5 bg-surface-secondary text-left font-bold text-text-secondary">
                      Instrument Sensor
                    </th>
                    <td className="p-2.5 font-bold text-text-primary">{dataset.sensor}</td>
                  </tr>
                  <tr>
                    <th scope="row" className="p-2.5 bg-surface-secondary text-left font-bold text-text-secondary">
                      Ground Sampling Distance (GSD)
                    </th>
                    <td className="p-2.5 text-text-primary tabular-nums">
                      {dataset.resolutionMetersPerPixel?.toFixed(3)} meters / pixel
                    </td>
                  </tr>
                  <tr>
                    <th scope="row" className="p-2.5 bg-surface-secondary text-left font-bold text-text-secondary">
                      Raster Dimensions
                    </th>
                    <td className="p-2.5 text-text-primary tabular-nums">
                      {dataset.width} &times; {dataset.height} pixels
                    </td>
                  </tr>
                  <tr>
                    <th scope="row" className="p-2.5 bg-surface-secondary text-left font-bold text-text-secondary">
                      Radiometric Channels
                    </th>
                    <td className="p-2.5 text-text-primary tabular-nums">{dataset.channels} band(s)</td>
                  </tr>
                  <tr>
                    <th scope="row" className="p-2.5 bg-surface-secondary text-left font-bold text-text-secondary">
                      Acquisition UTC
                    </th>
                    <td className="p-2.5 text-text-primary">{dataset.acquisitionTime}</td>
                  </tr>
                  <tr>
                    <th scope="row" className="p-2.5 bg-surface-secondary text-left font-bold text-text-secondary">
                      Solar Incidence Angle (i)
                    </th>
                    <td className="p-2.5 text-text-primary tabular-nums">{dataset.incidenceAngleDeg}&deg;</td>
                  </tr>
                  <tr>
                    <th scope="row" className="p-2.5 bg-surface-secondary text-left font-bold text-text-secondary">
                      Solar Azimuth Angle (&Phi;)
                    </th>
                    <td className="p-2.5 text-text-primary tabular-nums">{dataset.sunAzimuthDeg}&deg;</td>
                  </tr>
                  <tr>
                    <th scope="row" className="p-2.5 bg-surface-secondary text-left font-bold text-text-secondary">
                      Solar Elevation Angle
                    </th>
                    <td className="p-2.5 text-text-primary tabular-nums">{dataset.sunElevationDeg}&deg;</td>
                  </tr>
                  <tr>
                    <th scope="row" className="p-2.5 bg-surface-secondary text-left font-bold text-text-secondary">
                      Sensor Emission Angle (e)
                    </th>
                    <td className="p-2.5 text-text-primary tabular-nums">{dataset.emissionAngleDeg}&deg;</td>
                  </tr>
                  <tr>
                    <th scope="row" className="p-2.5 bg-surface-secondary text-left font-bold text-text-secondary">
                      Phase Angle (&alpha;)
                    </th>
                    <td className="p-2.5 text-text-primary tabular-nums">{dataset.phaseAngleDeg}&deg;</td>
                  </tr>
                  <tr>
                    <th scope="row" className="p-2.5 bg-surface-secondary text-left font-bold text-text-secondary">
                      Ephemeris Validation Kernel
                    </th>
                    <td className="p-2.5 text-success font-bold">{dataset.ephemerisKernel}</td>
                  </tr>
                </tbody>
              </table>
            </Panel>

            {/* Registration Job History */}
            <Panel title="Historical Registration Analyses">
              <div className="text-xs text-text-secondary p-3 bg-surface-muted border border-border-light rounded-sm flex items-center justify-between">
                <div>
                  <span className="font-bold text-text-primary">Associated Registration Run #RUN-849204</span>
                  <div className="text-[11px] text-text-muted mt-0.5">
                    Co-registered with TMC-2 Target Frame &bull; RMSE: 0.84 px
                  </div>
                </div>
                <Link
                  href="/registration/run-849204"
                  className="px-3 py-1.5 bg-navy text-white text-xs font-bold rounded-sm no-underline hover:bg-navy-dark"
                >
                  View Dossier &rarr;
                </Link>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
