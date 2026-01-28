"use client";

import { Heart, Github } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useNavbar } from "./NavbarContext";
import { hexToRgba } from "@/lib/color-utils";
import { cn } from "@/lib/utils";

interface GitHubCreditProps {
  githubUsername?: string;
  name?: string;
}

export function GitHubCredit({ githubUsername = "s43khu", name = "Shekhu☺️" }: GitHubCreditProps) {
  const { theme } = useTheme();
  const { dockVisible } = useNavbar();

  return (
    <a
      href={`https://github.com/${githubUsername}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "fixed bottom-6 right-6 z-100",
        "flex items-center gap-2 px-4 py-2.5 rounded-xl border",
        dockVisible && "hidden",
        "transition-all duration-300 ease-out",
        "hover:scale-105 active:scale-95",
        "group"
      )}
      style={{
        borderColor: theme.colors.border,
        // backgroundColor: hexToRgba(theme.colors.background, 0.25),
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
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
      <div className="relative z-10 flex items-center gap-2">
        <span
          className="text-xs font-medium"
          style={{ color: theme.colors.foreground, opacity: 0.8 }}
        >
          Made with
        </span>
        <Heart
          className="w-4 h-4 transition-transform duration-300 group-hover:scale-125"
          style={{ color: theme.colors.accent }}
          fill="currentColor"
        />
        <span
          className="text-xs font-medium"
          style={{ color: theme.colors.foreground, opacity: 0.8 }}
        >
          by
        </span>
        <span className="text-xs font-semibold" style={{ color: theme.colors.primary }}>
          {name}
        </span>
        <Github
          className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12"
          style={{ color: theme.colors.primary, opacity: 0.8 }}
        />
      </div>
    </a>
  );
}
