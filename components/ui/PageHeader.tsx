"use client";

import { useEffect, useState } from "react";
import { useTheme } from "./ThemeProvider";
import { useNavbar } from "./NavbarContext";
import { ThemeSelector } from "./ThemeSelector";
import { Dock } from "./Dock";
import { hexToRgba } from "@/lib/color-utils";
import { cn } from "@/lib/utils";
import { Settings, Library } from "lucide-react";
import { Button } from "./Button";
import { useRouter } from "next/navigation";

const MOBILE_BREAKPOINT = 640;
const SCROLL_THRESHOLD = 60;

interface PageHeaderProps {
  isEditMode?: boolean;
  onEditModeToggle?: () => void;
  hiddenToolsCount?: number;
}

export function PageHeader({
  isEditMode = false,
  onEditModeToggle,
  hiddenToolsCount = 0,
}: PageHeaderProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const { setDockVisible } = useNavbar();
  const [isMobile, setIsMobile] = useState(false);
  const [showDock, setShowDock] = useState(false);

  useEffect(() => {
    const checkMobile = () =>
      setIsMobile(
        typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT,
      );
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    let rafId: number | null = null;
    const updateDock = () => {
      if (typeof window === "undefined" || typeof document === "undefined")
        return;
      const scrollY =
        window.scrollY ??
        document.documentElement.scrollTop ??
        document.body.scrollTop ??
        0;
      const isMobileWidth = window.innerWidth < MOBILE_BREAKPOINT;
      setShowDock(scrollY > SCROLL_THRESHOLD && isMobileWidth);
    };
    const onScroll = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateDock);
    };
    updateDock();
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("scroll", onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    setDockVisible(showDock);
  }, [showDock, setDockVisible]);

  const headerActionButtons = (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => router.push("/tools/library")}
        disabled={isEditMode}
        className="flex items-center justify-center p-2 min-w-8 min-h-8"
        aria-label={
          hiddenToolsCount > 0
            ? `Library (${hiddenToolsCount} hidden)`
            : "Library"
        }
        title={
          hiddenToolsCount > 0
            ? `Library (${hiddenToolsCount} hidden)`
            : "Library"
        }
      >
        <Library className="w-3.5 h-3.5" />
      </Button>
      <ThemeSelector disabled={isEditMode} />
    </>
  );

  const dockActionButtons = (
    <>
      {onEditModeToggle && (
        <Button
          variant={isEditMode ? "primary" : "outline"}
          size="sm"
          onClick={onEditModeToggle}
          className="flex items-center justify-center p-2 min-w-8 min-h-8"
          aria-label={isEditMode ? "Done" : "Edit layout"}
          title={isEditMode ? "Done" : "Edit layout"}
        >
          <Settings className="w-3.5 h-3.5" />
        </Button>
      )}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => router.push("/tools/library")}
        disabled={isEditMode}
        className="flex items-center justify-center p-2 min-w-8 min-h-8"
        aria-label={
          hiddenToolsCount > 0
            ? `Library (${hiddenToolsCount} hidden)`
            : "Library"
        }
        title={
          hiddenToolsCount > 0
            ? `Library (${hiddenToolsCount} hidden)`
            : "Library"
        }
      >
        <Library className="w-3.5 h-3.5" />
      </Button>
      <ThemeSelector disabled={isEditMode} />
    </>
  );

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50",
          "transition-transform duration-200 ease-out",
          "pt-3 pb-3",
          isMobile && showDock && "-translate-y-full",
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={cn(
              "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3",
              "px-3 sm:px-4 py-3 rounded-xl",
              "border",
              "transition-all duration-200",
              "relative overflow-visible",
            )}
            style={{
              borderColor: theme.colors.border,
              backdropFilter: "blur(5px) saturate(180%)",
              WebkitBackdropFilter: "blur(5px) saturate(180%)",
              boxShadow: `
                0 8px 32px ${hexToRgba(theme.colors.primary, 0.08)},
                inset 0 1px 0 ${hexToRgba(theme.colors.foreground, 0.1)}
              `,
            }}
          >
            <div
              className="absolute inset-0 opacity-30 rounded-xl"
              style={{
                background: `linear-gradient(135deg, ${hexToRgba(theme.colors.primary, 0.1)} 0%, ${hexToRgba(theme.colors.accent, 0.05)} 100%)`,
                pointerEvents: "none",
              }}
            />
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
              <div className="flex flex-col min-w-0">
                <h1
                  className={cn(
                    "text-xl sm:text-2xl font-bold",
                    "font-semibold",
                    "tracking-wider",
                  )}
                  style={{ color: theme.colors.primary }}
                >
                  OXsuite
                </h1>
                <p
                  className={cn(
                    "text-[10px] sm:text-xs font-medium mt-0.5",
                    "transition-opacity duration-200",
                  )}
                  style={{ color: theme.colors.foreground, opacity: 0.75 }}
                >
                  {">"} Professional tools for daily use
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
                {headerActionButtons}
              </div>
            </div>
          </div>
        </div>
      </header>

      <Dock visible={isMobile && showDock}>{dockActionButtons}</Dock>
    </>
  );
}
