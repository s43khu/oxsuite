import { getTheme, defaultTheme, type Theme } from "@/themes";

const THEME_STORAGE_KEY = "oxsuite-theme";

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
