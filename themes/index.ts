export interface Theme {
  id: string;
  name: string;
  colors: {
    background: string;
    foreground: string;
    primary: string;
    secondary: string;
    accent: string;
    border: string;
    scrollbarThumb: string;
    scrollbarTrack: string;
  };
  fonts: {
    body: string;
    mono: string;
  };
}

export const themes: Record<string, Theme> = {
  dark: {
    id: "dark",
    name: "Dark Terminal",
    colors: {
      background: "#000000",
      foreground: "#00ff00",
      primary: "#00ff00",
      secondary: "#00cc00",
      accent: "#00ff00",
      border: "rgba(0, 255, 0, 0.3)",
      scrollbarThumb: "rgba(0, 255, 0, 0.5)",
      scrollbarTrack: "rgba(0, 0, 0, 0.3)",
    },
    fonts: {
      body: '"Courier New", monospace',
      mono: '"Courier New", monospace',
    },
  },
  light: {
    id: "light",
    name: "Light",
    colors: {
      background: "#ffffff",
      foreground: "#1a1a1a",
      primary: "#2563eb",
      secondary: "#1e40af",
      accent: "#3b82f6",
      border: "rgba(0, 0, 0, 0.1)",
      scrollbarThumb: "rgba(0, 0, 0, 0.3)",
      scrollbarTrack: "rgba(0, 0, 0, 0.05)",
    },
    fonts: {
      body: "system-ui, sans-serif",
      mono: '"Courier New", monospace',
    },
  },
  blue: {
    id: "blue",
    name: "Ocean Blue",
    colors: {
      background: "#0a1929",
      foreground: "#90caf9",
      primary: "#42a5f5",
      secondary: "#1e88e5",
      accent: "#64b5f6",
      border: "rgba(66, 165, 245, 0.3)",
      scrollbarThumb: "rgba(66, 165, 245, 0.5)",
      scrollbarTrack: "rgba(10, 25, 41, 0.3)",
    },
    fonts: {
      body: "system-ui, sans-serif",
      mono: '"Courier New", monospace',
    },
  },
  purple: {
    id: "purple",
    name: "Purple Dream",
    colors: {
      background: "#1a0b2e",
      foreground: "#c77dff",
      primary: "#9d4edd",
      secondary: "#7b2cbf",
      accent: "#b77dff",
      border: "rgba(157, 78, 221, 0.3)",
      scrollbarThumb: "rgba(157, 78, 221, 0.5)",
      scrollbarTrack: "rgba(26, 11, 46, 0.3)",
    },
    fonts: {
      body: "system-ui, sans-serif",
      mono: '"Courier New", monospace',
    },
  },
  orange: {
    id: "orange",
    name: "Sunset Orange",
    colors: {
      background: "#1a0f00",
      foreground: "#ff9800",
      primary: "#ff6b35",
      secondary: "#f4511e",
      accent: "#ff9800",
      border: "rgba(255, 107, 53, 0.3)",
      scrollbarThumb: "rgba(255, 107, 53, 0.5)",
      scrollbarTrack: "rgba(26, 15, 0, 0.3)",
    },
    fonts: {
      body: "system-ui, sans-serif",
      mono: '"Courier New", monospace',
    },
  },
  red: {
    id: "red",
    name: "Crimson",
    colors: {
      background: "#1a0000",
      foreground: "#ff4444",
      primary: "#dc2626",
      secondary: "#b91c1c",
      accent: "#ef4444",
      border: "rgba(220, 38, 38, 0.3)",
      scrollbarThumb: "rgba(220, 38, 38, 0.5)",
      scrollbarTrack: "rgba(26, 0, 0, 0.3)",
    },
    fonts: {
      body: "system-ui, sans-serif",
      mono: '"Courier New", monospace',
    },
  },
};

export const defaultTheme = "dark";

export function getTheme(themeId: string): Theme {
  return themes[themeId] || themes[defaultTheme];
}
