"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "./ThemeProvider";
import { Palette } from "lucide-react";

export function ThemeSelector() {
  const { theme, themeId, setTheme, availableThemes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleThemeChange = (newThemeId: string) => {
    setTheme(newThemeId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{
          borderColor: theme.colors.border,
          color: theme.colors.primary,
          backgroundColor: "transparent",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = `${theme.colors.primary}15`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <Palette className="w-4 h-4" />
        <span className="font-mono text-sm">{theme.name}</span>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-48 rounded-lg border-2 shadow-lg z-50 overflow-hidden"
          style={{
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.background,
          }}
        >
          <div className="py-1">
            {availableThemes.map((t) => (
              <button
                key={t.id}
                onClick={() => handleThemeChange(t.id)}
                className="w-full text-left px-4 py-3 transition-all duration-150 flex items-center gap-3"
                style={{
                  color: t.id === themeId ? theme.colors.primary : theme.colors.foreground,
                  backgroundColor:
                    t.id === themeId ? `${theme.colors.primary}20` : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (t.id !== themeId) {
                    e.currentTarget.style.backgroundColor = `${theme.colors.primary}10`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (t.id !== themeId) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                <div
                  className="w-4 h-4 rounded-full border-2"
                  style={{
                    backgroundColor: t.colors.primary,
                    borderColor: t.colors.border,
                  }}
                />
                <span className="font-mono text-sm">{t.name}</span>
                {t.id === themeId && (
                  <span className="ml-auto text-xs" style={{ color: theme.colors.primary }}>
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
