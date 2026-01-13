"use client";

import { InputHTMLAttributes, forwardRef } from "react";
import { useTheme } from "./ThemeProvider";
import { hexToRgba } from "@/lib/color-utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, style, ...props }, ref) => {
    const { theme } = useTheme();

    const inputStyle = {
      backgroundColor: theme.colors.background,
      borderColor: error ? "#ef4444" : hexToRgba(theme.colors.primary, 0.5),
      color: theme.colors.primary,
      ...style,
    };

    return (
      <div className="w-full">
        {label && (
          <label
            className="block text-sm font-medium font-mono mb-2"
            style={{ color: theme.colors.foreground, opacity: 0.7 }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-3 rounded-lg border-2 transition-all duration-200
            font-mono
            focus:outline-none focus:ring-2
            ${error ? "focus:ring-red-500" : ""}
            ${className}
          `}
          style={inputStyle}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-500 font-mono">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
