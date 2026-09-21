import Image from "next/image";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";

export function DashboardPreview() {
  return (
    <Panel
      title="Scientific Processing Console & Mission Telemetry Preview"
      actions={
        <Link href="/dashboard">
          <Button variant="secondary" size="sm">
            Open Interactive Console
          </Button>
        </Link>
      }
      className="mb-8"
      bodyClassName="p-0 bg-overlay overflow-hidden"
    >
      <div className="relative aspect-[16/9] w-full bg-overlay flex items-center justify-center border-t border-border">
        <Image
          src="/dashboard.jpeg"
          alt="OrbitLens Live Dashboard and Telemetry Console displaying daily throughput, registration metrics, and lunar crater footprint previews"
          fill
          className="object-contain"
          priority
        />
      </div>
      <div className="bg-overlay-dark px-4 py-2 border-t border-border flex flex-wrap items-center justify-between text-[0.8125rem] text-text-on-overlay">
        <div className="flex items-center gap-4">
          <span>
            OPERATIONAL NODE: <strong className="text-saffron">SAC-AHM-LUNAR-04</strong>
          </span>
          <span className="text-border">|</span>
          <span>
            SPATIAL REFERENCE: <strong>IAU2000 Moon Polar Stereographic</strong>
          </span>
        </div>
        <div>
          STATUS: <span className="text-success font-bold">ONLINE (LATENCY: 28ms)</span>
        </div>
      </div>
    </Panel>
  );
}
