"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getTheme, themes, type Theme, defaultTheme } from "@/themes";
import { getStoredThemeId, setStoredThemeId } from "@/lib/storage";

interface ThemeContextType {
  theme: Theme;
  themeId: string;
  setTheme: (themeId: string) => void;
  availableThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  root.style.setProperty("--background", theme.colors.background);
  root.style.setProperty("--foreground", theme.colors.foreground);
  root.style.setProperty("--primary", theme.colors.primary);
  root.style.setProperty("--secondary", theme.colors.secondary);
  root.style.setProperty("--accent", theme.colors.accent);
  root.style.setProperty("--border", theme.colors.border);
  root.style.setProperty("--scrollbar-thumb", theme.colors.scrollbarThumb);
  root.style.setProperty("--scrollbar-track", theme.colors.scrollbarTrack);
  root.style.setProperty("--font-body", theme.fonts.body);
  root.style.setProperty("--font-mono", theme.fonts.mono);

  root.setAttribute("data-theme", theme.id);

  document.body.style.backgroundColor = theme.colors.background;
  document.body.style.color = theme.colors.foreground;
  document.body.style.fontFamily = theme.fonts.body;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<string>(defaultTheme);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const stored = getStoredThemeId();
    if (stored && getTheme(stored)) {
      const theme = getTheme(stored);
      applyTheme(theme);
      setThemeId(stored);
    } else {
      const defaultThemeObj = getTheme(defaultTheme);
      applyTheme(defaultThemeObj);
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      const theme = getTheme(themeId);
      applyTheme(theme);
      setStoredThemeId(themeId);
    }
  }, [themeId, isMounted]);

  const setTheme = (newThemeId: string) => {
    if (getTheme(newThemeId)) {
      setThemeId(newThemeId);
    }
  };

  const value: ThemeContextType = {
    theme: getTheme(themeId),
    themeId,
    setTheme,
    availableThemes: Object.values(themes),
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
