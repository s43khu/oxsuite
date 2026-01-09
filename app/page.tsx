"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import ToolsDashboard from "@/components/tools/ToolsDashboard";

export default function Home() {
  const headerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
    <div className="min-h-screen bg-black">
      <div
        ref={headerRef}
        className="border-b-2 border-green-500/30 bg-black/90 backdrop-blur-sm sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-green-500 smooch-sans font-effect-anaglyph tracking-wider">
                OXsuite
              </h1>
              <p className="text-sm text-green-500/70 font-mono mt-1">
                {">"} Professional tools for daily use
              </p>
            </div>
          </div>
        </div>
      </div>

      <div ref={containerRef} className="max-w-7xl mx-auto py-12">
        <ToolsDashboard />
      </div>
    </div>
  );
}
