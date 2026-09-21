import Link from "next/link";
import { Hero } from "@/components/landing/Hero";
import { DashboardPreview } from "@/components/landing/DashboardPreview";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      <Hero />
      <DashboardPreview />
      <HowItWorks />
      <Features />

      <Panel
        title="Ready to Align Multi-Modal Lunar Imagery?"
        className="mb-8 bg-surface border-2 border-accent"
        headerClassName="bg-accent-muted border-b border-accent/30"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
          <div className="space-y-1">
            <h3 className="text-[1.125rem] font-bold text-text-primary m-0">
              Initialize a High-Resolution Chandrayaan-2 Registration Run
            </h3>
            <p className="text-[0.9375rem] text-text-secondary m-0">
              Select verified OHRC reference frames and register against TMC-2 stereoscopic grids in minutes.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/new-analysis" className="no-underline">
              <Button size="lg" className="min-w-[180px]">
                Start Registration →
              </Button>
            </Link>
            <Link href="/datasets" className="no-underline">
              <Button variant="secondary" size="lg">
                View Datasets
              </Button>
            </Link>
          </div>
        </div>
      </Panel>
    </div>
  );
}
