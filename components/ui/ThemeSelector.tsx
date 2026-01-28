"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "./ThemeProvider";
import { useDock } from "./Dock";
import { Palette, Check } from "lucide-react";
import { hexToRgba } from "@/lib/color-utils";
import { cn } from "@/lib/utils";

interface ThemeSelectorProps {
  disabled?: boolean;
}

export function ThemeSelector({ disabled = false }: ThemeSelectorProps = {}) {
  const { theme, themeId, setTheme, availableThemes } = useTheme();
  const { openUpward } = useDock();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleThemeChange = (newThemeId: string) => {
    setTheme(newThemeId);
    setIsOpen(false);
  };

  return (
    <div className="relative z-1000" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex items-center gap-2.5 px-4 py-2.5",
          "rounded-lg border-2",
          "transition-all duration-200 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "hover:scale-[1.02] active:scale-[0.98]",
        )}
        style={{
          borderColor: theme.colors.border,
          color: theme.colors.primary,
          backgroundColor: isOpen
            ? hexToRgba(theme.colors.primary, 0.1)
            : "transparent",
        }}
        onMouseEnter={(e) => {
          if (!isOpen && !disabled) {
            e.currentTarget.style.backgroundColor = hexToRgba(
              theme.colors.primary,
              0.08,
            );
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = "transparent";
          }
        }}
        aria-label="Select theme"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-disabled={disabled}
      >
        <Palette className="w-4 h-4" aria-hidden="true" />
        <span className="font-medium text-sm hidden sm:inline">
          {theme.name}
        </span>
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute right-0 w-56 rounded-xl border-2 shadow-2xl z-1000 overflow-hidden animate-in fade-in duration-200",
            openUpward
              ? "bottom-full mb-2 slide-in-from-bottom-2"
              : "mt-2 slide-in-from-top-2",
          )}
          style={{
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.background,
            boxShadow: `0 20px 25px -5px ${hexToRgba(theme.colors.primary, 0.15)}, 0 10px 10px -5px ${hexToRgba(theme.colors.primary, 0.1)}`,
          }}
          role="listbox"
        >
          <div className="py-1.5">
            {availableThemes.map((t) => {
              const isSelected = t.id === themeId;
              return (
                <button
                  key={t.id}
                  onClick={() => handleThemeChange(t.id)}
                  className={cn(
                    "w-full text-left px-4 py-3",
                    "transition-all duration-150 ease-out",
                    "flex items-center gap-3",
                    "focus-visible:outline-none focus-visible:bg-opacity-20",
                  )}
                  style={{
                    color: isSelected
                      ? theme.colors.primary
                      : theme.colors.foreground,
                    backgroundColor: isSelected
                      ? hexToRgba(theme.colors.primary, 0.15)
                      : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = hexToRgba(
                        theme.colors.primary,
                        0.08,
                      );
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div
                    className="w-4 h-4 rounded-full border-2 shrink-0"
                    style={{
                      backgroundColor: t.colors.primary,
                      borderColor: t.colors.border,
                    }}
                    aria-hidden="true"
                  />
                  <span className="font-medium text-sm flex-1">{t.name}</span>
                  {isSelected && (
                    <Check
                      className="w-4 h-4 shrink-0"
                      style={{ color: theme.colors.primary }}
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
