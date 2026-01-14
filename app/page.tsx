"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import ToolsDashboard from "@/components/tools/ToolsDashboard";
import { PageHeader } from "@/components/ui/PageHeader";
import { useTheme } from "@/components/ui/ThemeProvider";

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.1, ease: "power3.out" }
      );
    }
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
      <PageHeader />
      <main ref={containerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <ToolsDashboard />
      </main>
    </div>
  );
}
