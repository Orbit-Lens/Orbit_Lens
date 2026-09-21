"use client";

import { useState, useMemo, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DatasetSetupBanner } from "@/components/datasets/DatasetSetupBanner";
import {
  DatasetFilters,
  PayloadFilter,
  PixelScaleFilter,
  RegionFilter,
} from "@/components/datasets/DatasetFilters";
import { DatasetTable } from "@/components/datasets/DatasetTable";
import { DatasetDetailDrawer } from "@/components/datasets/DatasetDetailDrawer";
import { DatasetUploadModal } from "@/components/datasets/DatasetUploadModal";
import { MOCK_DATASETS, ExtendedDataset } from "@/lib/mock-data";
import { Dataset } from "@/types/api";

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<ExtendedDataset[]>(MOCK_DATASETS);
  const [selectedDataset, setSelectedDataset] = useState<ExtendedDataset | null>(
    MOCK_DATASETS[0]
  );
  const [checkedIds, setCheckedIds] = useState<Set<string>>(
    new Set([MOCK_DATASETS[0].id])
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPayload, setSelectedPayload] = useState<PayloadFilter>("ALL");
  const [selectedScale, setSelectedScale] = useState<PixelScaleFilter>("ALL");
  const [selectedRegion, setSelectedRegion] = useState<RegionFilter>("ALL");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Fetch real images from backend if running, merging with mock library
  useEffect(() => {
    let ignore = false;
    async function fetchImages() {
      try {
        const res = await fetch("/api/v1/images", { credentials: "same-origin" });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0 && !ignore) {
            const mappedImages: ExtendedDataset[] = json.data.map((img: Dataset) => ({
              ...img,
              instrumentMode: `${img.sensor} / Precision Raster`,
              targetMorphology: "South Pole Rim",
              pdsLevel: "Calibrated L2B" as const,
              previewUrl: "/lunar-hud-bg.jpg",
              dnSpread: {
                min: 114,
                max: 3949,
                mean: 1842,
                bins: [12, 28, 65, 140, 230, 390, 520, 710, 840, 680, 510, 320, 180, 85, 34, 15],
              },
            }));

            setDatasets((prev) => {
              const existingIds = new Set(prev.map((d) => d.id));
              const newItems = mappedImages.filter((m) => !existingIds.has(m.id));
              return [...newItems, ...prev];
            });
          }
        }
      } catch {
        // Backend offline: MOCK_DATASETS serves as visual layout reference
      }
    }

    fetchImages();
    return () => {
      ignore = true;
    };
  }, []);

  const filteredDatasets = useMemo(() => {
    return datasets.filter((d) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesUid = d.name.toLowerCase().includes(q);
        const matchesSensor = d.sensor.toLowerCase().includes(q);
        const matchesMorph = d.targetMorphology.toLowerCase().includes(q);
        if (!matchesUid && !matchesSensor && !matchesMorph) return false;
      }

      // Payload filter
      if (selectedPayload !== "ALL") {
        if (selectedPayload === "OHRC" && d.sensor !== "OHRC") return false;
        if (selectedPayload === "TMC-2" && d.sensor !== "TMC-2") return false;
        if (selectedPayload === "IIRS" && d.sensor !== "IIRS") return false;
        if (selectedPayload === "LROC NAC" && d.sensor !== "LRO_NAC") return false;
        if (selectedPayload === "DFSAR" && d.sensor !== "OTHER") return false;
      }

      // Pixel Scale filter
      if (selectedScale !== "ALL") {
        const gsd = d.resolutionMetersPerPixel || 1.0;
        if (selectedScale === "ULTRA" && gsd >= 0.5) return false;
        if (selectedScale === "STEREO" && (gsd < 0.5 || gsd > 5.0)) return false;
        if (selectedScale === "SPECTROSCOPY" && gsd <= 10.0) return false;
      }

      // Region filter
      if (selectedRegion !== "ALL") {
        if (!d.targetMorphology.includes(selectedRegion.replace(" Rim", ""))) return false;
      }

      return true;
    });
  }, [datasets, searchQuery, selectedPayload, selectedScale, selectedRegion]);

  const handleToggleCheck = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleAll = () => {
    if (filteredDatasets.every((d) => checkedIds.has(d.id))) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(filteredDatasets.map((d) => d.id)));
    }
  };

  const handleUploadSuccess = (newDataset: ExtendedDataset) => {
    setDatasets((prev) => [newDataset, ...prev]);
    setSelectedDataset(newDataset);
    setCheckedIds((prev) => new Set(prev).add(newDataset.id));
  };

  return (
    <ProtectedRoute>
      <div className="space-y-4 py-2">
        {/* Repository Setup / Notice Banner */}
        <DatasetSetupBanner
          totalCount={datasets.length}
          onUploadClick={() => setIsUploadModalOpen(true)}
        />

        {/* Search & Multi-Criteria Filtering Controls */}
        <DatasetFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedPayload={selectedPayload}
          onPayloadChange={setSelectedPayload}
          selectedScale={selectedScale}
          onScaleChange={setSelectedScale}
          selectedRegion={selectedRegion}
          onRegionChange={setSelectedRegion}
          selectedCount={checkedIds.size}
          onUploadClick={() => setIsUploadModalOpen(true)}
          onBatchDownloadClick={() =>
            alert(`Preparing batch PDS4 archive for ${checkedIds.size} selected granule(s)...`)
          }
        />

        {/* Main Grid: Library Table (left) + Dataset Detail Drawer (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className={selectedDataset ? "lg:col-span-8" : "lg:col-span-12"}>
            <DatasetTable
              datasets={filteredDatasets}
              selectedDatasetId={selectedDataset?.id || null}
              onSelectDataset={(ds) => setSelectedDataset(ds)}
              checkedIds={checkedIds}
              onToggleCheck={handleToggleCheck}
              onToggleAll={handleToggleAll}
            />
          </div>

          {selectedDataset && (
            <div className="lg:col-span-4 sticky top-4">
              <DatasetDetailDrawer
                dataset={selectedDataset}
                onClose={() => setSelectedDataset(null)}
              />
            </div>
          )}
        </div>

        {/* Compliance Footer Note from datasets.jpeg */}
        <div className="px-4 py-2.5 bg-surface-secondary border border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-text-muted">
          <span>
            All datasets strictly follow NASA-PDS / ISRO Space Applications Centre Cartographic Specifications v4.2.
          </span>
          <span className="text-text-secondary">
            Projection: Polar Stereographic (South) | True Scale: 90.0&deg;S | Central Meridian: 0.0&deg;E
          </span>
        </div>

        {/* Upload Modal Dialog */}
        <DatasetUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onUploadSuccess={handleUploadSuccess}
        />
      </div>
    </ProtectedRoute>
  );
}
