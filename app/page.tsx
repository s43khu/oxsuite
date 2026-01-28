"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import ToolsDashboard from "@/components/tools/ToolsDashboard";
import { PageHeader } from "@/components/ui/PageHeader";
import { useTheme } from "@/components/ui/ThemeProvider";
import { allTools } from "@/lib/tools/config";
import { getLayoutConfig } from "@/lib/storage";

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const [isEditMode, setIsEditMode] = useState(false);
  const [hiddenToolsCount, setHiddenToolsCount] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.1, ease: "power3.out" }
      );
    }
  }, []);

  useEffect(() => {
    const updateHiddenCount = () => {
      const config = getLayoutConfig();
      const visibleCount = config.visibleToolIds.length;
      const totalCount = allTools.length;
      setHiddenToolsCount(totalCount - visibleCount);
    };

    updateHiddenCount();
    const interval = setInterval(updateHiddenCount, 500);
    return () => clearInterval(interval);
  }, [isEditMode]);

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: "transparent" }}>
      <div className="relative z-10">
        <PageHeader
          isEditMode={isEditMode}
          onEditModeToggle={() => setIsEditMode(!isEditMode)}
          hiddenToolsCount={hiddenToolsCount}
        />
        <main ref={containerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <ToolsDashboard isEditMode={isEditMode} onEditModeChange={setIsEditMode} />
        </main>
      </div>
    </div>
  );
}
