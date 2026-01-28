"use client";

import { useTheme } from "./ThemeProvider";
import { ThemeSelector } from "./ThemeSelector";
import { hexToRgba } from "@/lib/color-utils";
import { cn } from "@/lib/utils";
import { Settings, Library } from "lucide-react";
import { Button } from "./Button";
import { useRouter } from "next/navigation";

interface PageHeaderProps {
  isEditMode?: boolean;
  onEditModeToggle?: () => void;
  hiddenToolsCount?: number;
}

export function PageHeader({ isEditMode = false, onEditModeToggle, hiddenToolsCount = 0 }: PageHeaderProps) {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <header
      className={cn(
        "sticky top-0 z-50",
        "transition-all duration-300",
        "pt-4 pb-4"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",
            "px-4 sm:px-6 py-4 rounded-2xl",
            "border",
            "transition-all duration-300",
            "relative overflow-visible"
          )}
          style={{
            borderColor:theme.colors.border,
            // backgroundColor: hexToRgba(theme.colors.background, 0.25),
            backdropFilter: "blur(5px) saturate(180%)",
            WebkitBackdropFilter: "blur(5px) saturate(180%)",
            boxShadow: `
              0 8px 32px ${hexToRgba(theme.colors.primary, 0.08)},
              inset 0 1px 0 ${hexToRgba(theme.colors.foreground, 0.1)}
            `,
          }}
        >
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: `linear-gradient(135deg, ${hexToRgba(theme.colors.primary, 0.1)} 0%, ${hexToRgba(theme.colors.accent, 0.05)} 100%)`,
              pointerEvents: "none",
            }}
          />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
            <div className="flex flex-col min-w-0">
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
            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap justify-end">
            {onEditModeToggle && (
              <Button
                variant={isEditMode ? "primary" : "outline"}
                size="sm"
                onClick={onEditModeToggle}
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                {isEditMode ? "Done" : "Edit"}
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push("/tools/library")}
              disabled={isEditMode}
              className="flex items-center gap-2"
            >
              <Library className="w-4 h-4" />
              <span className="hidden sm:inline">Library</span>
              {hiddenToolsCount > 0 && (
                <span className="sm:hidden">({hiddenToolsCount})</span>
              )}
            </Button>
              <ThemeSelector disabled={isEditMode} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
