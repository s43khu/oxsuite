import { getTheme, defaultTheme, type Theme } from "@/themes";

const THEME_STORAGE_KEY = "oxsuite-theme";
const LAYOUT_STORAGE_KEY = "oxsuite-tools-layout";

export interface ToolLayoutConfig {
  visibleToolIds: string[];
  toolOrder: string[];
}

const defaultLayoutConfig: ToolLayoutConfig = {
  visibleToolIds: [],
  toolOrder: [],
};

export function getStoredThemeId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to read theme from localStorage:", error);
    return null;
  }
}

export function setStoredThemeId(themeId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, themeId);
  } catch (error) {
    console.warn("Failed to save theme to localStorage:", error);
  }
}

export function getStoredTheme(): Theme {
  const storedId = getStoredThemeId();
  if (storedId) {
    const theme = getTheme(storedId);
    if (theme) {
      return theme;
    }
  }
  return getTheme(defaultTheme);
}

export function clearStoredTheme(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(THEME_STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear theme from localStorage:", error);
  }
}

export function getLayoutConfig(): ToolLayoutConfig {
  if (typeof window === "undefined") {
    return defaultLayoutConfig;
  }

  try {
    const stored = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as ToolLayoutConfig;
    }
  } catch (error) {
    console.error("Failed to load layout config:", error);
  }

  return defaultLayoutConfig;
}

export function saveLayoutConfig(config: ToolLayoutConfig): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error("Failed to save layout config:", error);
  }
}

export function resetLayoutConfig(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(LAYOUT_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to reset layout config:", error);
  }
}
