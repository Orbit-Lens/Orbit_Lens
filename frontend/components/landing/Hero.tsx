import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export function Hero() {
  return (
    <div className="py-8 md:py-12 border-b border-border mb-8">
      <div className="max-w-4xl space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="processing">CHANDRAYAAN-2 PAYLOAD SUITE</Badge>
          <Badge variant="success">SUB-PIXEL ACCURACY &lt; 1.0 px</Badge>
          <Badge variant="queued">PDS-4 ARCHIVE READY</Badge>
        </div>

        <h1 className="text-[1.75rem] md:text-[2.25rem] font-bold text-text-primary leading-tight m-0">
          Automated Multi-Modal Lunar Image Registration &amp; Photogrammetric Fusion
        </h1>

        <p className="text-[1.125rem] text-text-secondary leading-relaxed max-w-3xl">
          OrbitLens automates the photogrammetric alignment of disparate lunar remote sensing
          instruments — OHRC (0.25 m/px optical), TMC-2 (stereoscopic elevation), and IIRS
          (hyperspectral). Control points are detected autonomously, replacing manual tie-point
          selection with robust homography and sub-pixel Levenberg-Marquardt refinement.
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-4">
          <Link href="/new-analysis" className="no-underline">
            <Button size="lg" className="gap-2">
              Launch Analysis Workstation →
            </Button>
          </Link>
          <Link href="/dashboard" className="no-underline">
            <Button variant="secondary" size="lg">
              View Scientific Dashboard
            </Button>
          </Link>
          <Link href="/datasets" className="no-underline">
            <Button variant="ghost" size="lg">
              Browse Dataset Repository
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
