"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Panel } from "@/components/ui/Panel";
import { Shield } from "lucide-react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center items-center">
        <Panel title="Security Verification" className="max-w-md w-full text-center py-6">
          <div className="flex flex-col items-center gap-3">
            <Shield className="w-8 h-8 text-accent animate-pulse" />
            <p className="text-sm font-bold text-text-primary">
              Verifying cryptographic clearance...
            </p>
            <p className="text-xs text-text-muted">
              Communicating with Space Applications Centre authentication gateway.
            </p>
          </div>
        </Panel>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
