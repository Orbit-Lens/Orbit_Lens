import { Panel } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";
import { SensorBadge } from "@/components/ui/SensorBadge";

export function Features() {
  const featuresList = [
    {
      title: "1. Autonomous Multi-Modal Registration",
      badge: "SUB-PIXEL PRECISION",
      badgeVariant: "success" as const,
      description:
        "Eliminates manual tie-point selection across disparate optical, stereoscopic, and hyperspectral datasets. Employs SIFT difference-of-Gaussians with FLANN k-NN descriptor matching, RANSAC (USAC) outlier pruning, and 8-DoF homography refined via Levenberg-Marquardt to consistently achieve sub-pixel reprojection error (< 1.0 px).",
      sensors: ["OHRC", "TMC-2"] as const,
    },
    {
      title: "2. Radiometric Normalization & Confidence Heatmaps",
      badge: "CROSS-SENSOR AUDIT",
      badgeVariant: "processing" as const,
      description:
        "Harmonizes steep grazing-incidence illumination angles at the lunar south pole via CLAHE and 16-to-8 bit dynamic stretching. Computes structural similarity (SSIM) and mutual information indices, projecting a spatial confidence heatmap directly over regolith imagery to highlight sensor inconsistencies.",
      sensors: ["OHRC", "IIRS"] as const,
    },
    {
      title: "3. Mission Dossiers & PDS-4 Planetary Export",
      badge: "ISRO / NASA COMPLIANT",
      badgeVariant: "queued" as const,
      description:
        "Synthesizes slope, solar incidence, and mineralogical spectral signatures into an automated landing-site hazard score. Generates ISRO-compliant Cloud-Optimized GeoTIFF (COG), PDS-4 planetary labels, and photogrammetric mission-readiness PDF verification reports with one click.",
      sensors: ["OHRC", "TMC-2", "IIRS"] as const,
    },
  ];

  return (
    <div className="mb-8">
      <div className="border-b border-border pb-2 mb-6">
        <h2 className="text-[1.375rem] font-bold text-text-primary m-0">
          Core Photogrammetric Architecture &amp; Capabilities
        </h2>
        <p className="text-[0.9375rem] text-text-muted mt-1 mb-0">
          Engineered to national space agency photogrammetry standards for polar exploration.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {featuresList.map((f, i) => (
          <Panel
            key={i}
            title={f.title}
            actions={<Badge variant={f.badgeVariant}>{f.badge}</Badge>}
            className="h-full flex flex-col"
            bodyClassName="flex-1 flex flex-col justify-between"
          >
            <p className="text-[0.9375rem] text-text-secondary leading-relaxed mb-4">
              {f.description}
            </p>
            <div className="pt-3 border-t border-border-light flex items-center gap-1.5 flex-wrap">
              <span className="text-[0.75rem] font-bold text-text-muted mr-1">
                COMPATIBLE SENSORS:
              </span>
              {f.sensors.map((s) => (
                <SensorBadge key={s} sensor={s} />
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
