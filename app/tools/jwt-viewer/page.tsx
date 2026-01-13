"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import JWTViewer from "@/components/tools/JWTViewer";
import Link from "next/link";

export default function JWTViewerPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <div className="border-b-2 border-green-500/30 bg-black/90 backdrop-blur-sm sticky top-0 z-50">
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

      <div ref={containerRef} className="max-w-7xl mx-auto py-12 px-6">
        <Link href="/">
          <Button
            variant="outline"
            size="sm"
            className="mb-6 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tools
          </Button>
        </Link>
        <JWTViewer />
      </div>
    </div>
  );
}
