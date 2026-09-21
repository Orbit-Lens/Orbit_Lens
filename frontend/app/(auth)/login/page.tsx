import type { Metadata } from "next";
import { TelemetryHUD } from "@/components/auth/TelemetryHUD";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Institutional Sign In | OrbitLens Lunar Portal",
  description:
    "Restricted Level-3 scientific access to Chandrayaan-2 lunar remote sensing and multi-modal image registration workstations.",
};

export default function LoginPage() {
  return (
    <div className="py-2 sm:py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
        {/* Left Column: Lunar Surface Imagery with Mission Telemetry HUD */}
        <section
          aria-label="Mission Telemetry and Targeting Display"
          className="lg:col-span-6 flex flex-col"
        >
          <TelemetryHUD />
        </section>

        {/* Right Column: Level-3 Restricted Access Portal Login Card */}
        <section
          aria-label="Restricted Government Access Authentication"
          className="lg:col-span-6 flex flex-col justify-center"
        >
          <LoginForm />
        </section>
      </div>
    </div>
  );
}
