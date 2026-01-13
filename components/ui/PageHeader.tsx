"use client";

import { useTheme } from "./ThemeProvider";
import { ThemeSelector } from "./ThemeSelector";

export function PageHeader() {
  const { theme } = useTheme();

  return (
    <div
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
            <p className="text-sm font-mono mt-1" style={{ color: theme.colors.foreground, opacity: 0.7 }}>
              {">"} Professional tools for daily use
            </p>
          </div>
          <ThemeSelector />
        </div>
      </div>
    </div>
  );
}
