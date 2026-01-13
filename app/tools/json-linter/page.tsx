"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import JSONLinter from "@/components/tools/JSONLinter";
import Link from "next/link";
import { useTheme } from "@/components/ui/ThemeProvider";

export default function JSONLinterPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

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
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
      <PageHeader />

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
        <JSONLinter />
      </div>
    </div>
  );
}
