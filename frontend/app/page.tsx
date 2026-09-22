"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { TelemetryHUD } from "@/components/auth/TelemetryHUD";
import { LoginForm } from "@/components/auth/LoginForm";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="py-2 sm:py-6 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
        {/* Left Column: Lunar Surface Imagery with Mission Telemetry HUD */}
        <section
          aria-label="Mission Telemetry and Targeting Display"
          className="lg:col-span-6 flex flex-col"
        >
          <TelemetryHUD />
        </section>

        {/* Right Column: Institutional Authentication / Registration Portal */}
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
