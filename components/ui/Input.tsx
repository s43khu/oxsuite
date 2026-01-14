"use client";

import { InputHTMLAttributes, forwardRef } from "react";
import { useTheme } from "./ThemeProvider";
import { hexToRgba } from "@/lib/color-utils";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, helperText, style, disabled, ...props }, ref) => {
    const { theme } = useTheme();

    const baseInputStyles = cn(
      "w-full px-4 py-3 rounded-lg border-2",
      "transition-all duration-200 ease-out",
      "font-medium text-sm",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      "placeholder:opacity-50",
      className
    );

    const focusBorderColor = error ? theme.colors.accent : theme.colors.primary;
    const focusRingColor = hexToRgba(error ? theme.colors.accent : theme.colors.primary, 0.2);

    const inputStyle: React.CSSProperties = {
      backgroundColor: theme.colors.background,
      borderColor: error
        ? theme.colors.accent
        : disabled
          ? hexToRgba(theme.colors.primary, 0.2)
          : hexToRgba(theme.colors.primary, 0.4),
      color: theme.colors.foreground,
      ...style,
    };

    return (
      <div className="w-full">
        {label && (
          <label
            className={cn(
              "block text-sm font-semibold mb-2",
              "transition-colors duration-200"
            )}
            style={{
              color: error ? theme.colors.accent : theme.colors.foreground,
              opacity: disabled ? 0.5 : 0.9,
            }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={baseInputStyles}
          style={inputStyle}
          disabled={disabled}
          onFocus={(e) => {
            if (!disabled) {
              e.currentTarget.style.borderColor = focusBorderColor;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${focusRingColor}`;
            }
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error
              ? theme.colors.accent
              : hexToRgba(theme.colors.primary, 0.4);
            e.currentTarget.style.boxShadow = "none";
          }}
          {...props}
        />
        {(error || helperText) && (
          <p
            className={cn(
              "mt-1.5 text-xs font-medium",
              "transition-colors duration-200"
            )}
            style={{
              color: error ? theme.colors.accent : theme.colors.foreground,
              opacity: error ? 1 : 0.7,
            }}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
