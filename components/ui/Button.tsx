"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { useTheme } from "./ThemeProvider";
import { hexToRgba } from "@/lib/color-utils";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", children, disabled, ...props }, ref) => {
    const { theme } = useTheme();

    const baseStyles = cn(
      "inline-flex items-center justify-center",
      "rounded-lg font-medium",
      "transition-all duration-300 ease-out",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      "disabled:opacity-50 disabled:pointer-events-none",
      "active:scale-[0.98]",
      className
    );

    const variantClasses = {
      primary: "border-2 font-semibold",
      secondary: "border-2",
      outline: "border-2 bg-transparent",
      ghost: "border-0",
    };

    const sizeClasses = {
      sm: "px-4 py-2 text-sm gap-2",
      md: "px-6 py-3 text-base gap-2",
      lg: "px-8 py-4 text-lg gap-3",
    };

    const getVariantStyles = (): React.CSSProperties => {
      switch (variant) {
        case "primary":
          return {
            backgroundColor: hexToRgba(theme.colors.primary, 0.15),
            borderColor: theme.colors.primary,
            color: theme.colors.primary,
            boxShadow: `0 4px 14px ${hexToRgba(theme.colors.primary, 0.2)}`,
          };
        case "secondary":
          return {
            backgroundColor: theme.colors.background,
            borderColor: hexToRgba(theme.colors.primary, 0.4),
            color: theme.colors.primary,
          };
        case "outline":
          return {
            borderColor: theme.colors.primary,
            color: theme.colors.primary,
            backgroundColor: "transparent",
          };
        case "ghost":
          return {
            color: theme.colors.primary,
            backgroundColor: "transparent",
          };
        default:
          return {};
      }
    };

    const baseStyles_obj = getVariantStyles();
    const hoverStyles = (() => {
      switch (variant) {
        case "primary":
          return {
            backgroundColor: hexToRgba(theme.colors.primary, 0.25),
            borderColor: theme.colors.accent,
            boxShadow: `0 6px 20px ${hexToRgba(theme.colors.primary, 0.3)}`,
          };
        case "secondary":
          return {
            backgroundColor: hexToRgba(theme.colors.primary, 0.1),
            borderColor: theme.colors.primary,
          };
        case "outline":
        case "ghost":
          return {
            backgroundColor: hexToRgba(theme.colors.primary, 0.1),
          };
        default:
          return {};
      }
    })();

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantClasses[variant], sizeClasses[size])}
        style={baseStyles_obj}
        disabled={disabled}
        onMouseEnter={(e) => {
          if (disabled) return;
          Object.assign(e.currentTarget.style, baseStyles_obj, hoverStyles);
        }}
        onMouseLeave={(e) => {
          if (disabled) return;
          Object.assign(e.currentTarget.style, baseStyles_obj);
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
