import type { Metadata } from "next";
import "./globals.css";
import { PortalProvider } from "@/context/PortalContext";
import { AuthProvider } from "@/context/AuthContext";
import { TricolourStrip } from "@/components/layout/TricolourStrip";
import { UtilityBar } from "@/components/layout/UtilityBar";
import { PortalHeader } from "@/components/layout/PortalHeader";
import { Navbar } from "@/components/layout/Navbar";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "OrbitLens | Multi-Modal Lunar Image Registration Portal",
  description:
    "Official multi-modal lunar image registration platform for Chandrayaan-2 (OHRC, TMC-2, IIRS) — Smart India Hackathon 2026.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-background text-text-primary">
        <PortalProvider>
          <AuthProvider>
            <TricolourStrip />
            <UtilityBar />
            <PortalHeader />
            <Navbar />
            <Breadcrumb />
            <main
              id="main-content"
              tabIndex={-1}
              className="flex-1 w-full max-w-[1280px] mx-auto p-4 sm:p-6 outline-none flex flex-col"
            >
              {children}
            </main>
            <Footer />
          </AuthProvider>
        </PortalProvider>
      </body>
    </html>
  );
}
