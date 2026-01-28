"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useTheme } from "./ThemeProvider";
import { hexToRgba } from "@/lib/color-utils";
import { cn } from "@/lib/utils";

const MOBILE_BREAKPOINT = 640;

interface DockContextValue {
  openUpward: boolean;
}

const DockContext = createContext<DockContextValue>({ openUpward: false });

export function useDock() {
  return useContext(DockContext);
}

interface DockProps {
  visible: boolean;
  children: React.ReactNode;
}

export function Dock({ visible, children }: DockProps) {
  const { theme } = useTheme();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () =>
      setIsMobile(
        typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT,
      );
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!isMobile || typeof document === "undefined") return null;

  return createPortal(
    <DockContext.Provider value={{ openUpward: true }}>
      <div
        className="fixed z-100 sm:hidden pointer-events-none flex flex-col justify-end"
        style={{
          isolation: "isolate",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          height: "100%",
        }}
        aria-hidden
      >
        <div
          className={cn(
            "pointer-events-auto shrink-0",
            "flex items-center justify-center gap-4",
            "px-4 py-3 border border-b-0 rounded-t-2xl",
            "transition-transform duration-300 ease-out",
            "relative overflow-visible min-h-[56px]",
            visible ? "translate-y-0" : "translate-y-full",
          )}
          style={{
            borderColor: theme.colors.border,
            backdropFilter: "blur(5px) saturate(180%)",
            WebkitBackdropFilter: "blur(5px) saturate(180%)",
            boxShadow: `
            0 -8px 32px ${hexToRgba(theme.colors.primary, 0.08)},
            inset 0 1px 0 ${hexToRgba(theme.colors.foreground, 0.1)}
          `,
          }}
        >
          <div
            className="absolute inset-0 opacity-30 rounded-t-2xl"
            style={{
              background: `linear-gradient(135deg, ${hexToRgba(theme.colors.primary, 0.1)} 0%, ${hexToRgba(theme.colors.accent, 0.05)} 100%)`,
              pointerEvents: "none",
            }}
          />
          <div className="relative z-10 flex items-center justify-center gap-4">
            {children}
          </div>
        </div>
      </div>
    </DockContext.Provider>,
    document.body,
  );
}
