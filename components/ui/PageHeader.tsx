"use client";

import { useTheme } from "./ThemeProvider";
import { ThemeSelector } from "./ThemeSelector";
import { hexToRgba } from "@/lib/color-utils";
import { cn } from "@/lib/utils";

export function PageHeader() {
  const { theme } = useTheme();

  return (
    <header
      className={cn(
        "border-b-2 backdrop-blur-md",
        "sticky top-0 z-50",
        "transition-all duration-300"
      )}
      style={{
        borderColor: theme.colors.border,
        backgroundColor: hexToRgba(theme.colors.background, 0.9),
        backdropFilter: "blur(12px) saturate(180%)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <div className="flex flex-col">
            <h1
              className={cn(
                "text-2xl sm:text-3xl font-bold",
                "smooch-sans font-effect-anaglyph",
                "tracking-wider"
              )}
              style={{ color: theme.colors.primary }}
            >
              OXsuite
            </h1>
            <p
              className={cn(
                "text-xs sm:text-sm font-medium mt-1",
                "transition-opacity duration-200"
              )}
              style={{ color: theme.colors.foreground, opacity: 0.75 }}
            >
              {">"} Professional tools for daily use
            </p>
          </div>
          <div className="flex-shrink-0">
            <ThemeSelector />
          </div>
        </div>
      </div>
    </header>
  );
}
