"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import ToolsDashboard from "@/components/tools/ToolsDashboard";
import { ThemeSelector } from "@/components/ui/ThemeSelector";
import { useTheme } from "@/components/ui/ThemeProvider";

export default function Home() {
  const headerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: -30 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
      );
    }

    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.2, ease: "power3.out" }
      );
    }
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
      <div
        ref={headerRef}
        className="border-b-2 backdrop-blur-sm sticky top-0 z-50"
        style={{
          borderColor: theme.colors.border,
          backgroundColor: `${theme.colors.background}e6`,
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1
                className="text-2xl font-bold smooch-sans font-effect-anaglyph tracking-wider"
                style={{ color: theme.colors.primary }}
              >
                OXsuite
              </h1>
              <p className="text-sm font-mono mt-1" style={{ color: theme.colors.foreground }}>
                {">"} Professional tools for daily use
              </p>
            </div>
            <ThemeSelector />
          </div>
        </div>
      </div>

      <div ref={containerRef} className="max-w-7xl mx-auto py-12">
        <ToolsDashboard />
      </div>
    </div>
  );
}
