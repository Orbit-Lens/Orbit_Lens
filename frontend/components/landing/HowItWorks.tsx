import { Panel } from "@/components/ui/Panel";

export function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Ingest & Calibrate",
      detail:
        "Select or upload calibrated Level-2B products from OHRC, TMC-2, and IIRS. SPICE kernels validate ephemeris and reproject coordinates to the IAU2000 Moon frame.",
    },
    {
      num: "02",
      title: "Detect Control Points",
      detail:
        "Scale-invariant feature transform (SIFT) detects crater rims and ridge contours. FLANN k-NN matching associates pairs under Lowe's 0.75 ratio test.",
    },
    {
      num: "03",
      title: "Sub-Pixel Optimization",
      detail:
        "RANSAC estimates planar homography matrix (H). Inliers undergo Levenberg-Marquardt optimization achieving sub-pixel reprojection error under 1.0 px tolerance.",
    },
    {
      num: "04",
      title: "Photogrammetric Delivery",
      detail:
        "Produce verified fused composites, spatial anomaly alerts, slope-illumination landing hazard scores, and exportable PDS-4 / GeoTIFF archive bundles.",
    },
  ];

  return (
    <div className="mb-8">
      <Panel title="Four-Stage Automated Photogrammetric Pipeline" className="bg-surface">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((s) => (
            <div
              key={s.num}
              className="p-3 bg-surface-secondary border border-border rounded-sm flex flex-col"
            >
              <div className="text-[1.5rem] font-bold text-accent mb-1 tabular-nums">{s.num}</div>
              <h3 className="text-[1rem] font-bold text-text-primary mb-2 m-0">{s.title}</h3>
              <p className="text-[0.875rem] text-text-secondary leading-normal m-0">{s.detail}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
