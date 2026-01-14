"use client";

import { HTMLAttributes, forwardRef } from "react";
import { useTheme } from "./ThemeProvider";
import { hexToRgba, createRgbaString } from "@/lib/color-utils";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outlined" | "hacker";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", variant = "default", children, ...props }, ref) => {
    const { theme } = useTheme();
    const primaryRgba = createRgbaString(theme.colors.primary);

    const baseStyles = cn(
      "rounded-xl transition-all duration-300",
      "backdrop-blur-sm",
      className
    );

    const getVariantStyles = (): React.CSSProperties => {
      const baseShadow = `0 4px 6px -1px ${hexToRgba(theme.colors.primary, 0.1)}, 0 2px 4px -1px ${hexToRgba(theme.colors.primary, 0.06)}`;

      switch (variant) {
        case "default":
          return {
            backgroundColor: theme.colors.background,
            border: `1px solid ${hexToRgba(theme.colors.primary, 0.2)}`,
          };
        case "elevated":
          return {
            backgroundColor: theme.colors.background,
            border: `2px solid ${hexToRgba(theme.colors.primary, 0.3)}`,
            boxShadow: `0 10px 25px -5px ${hexToRgba(theme.colors.primary, 0.2)}, ${baseShadow}`,
            "--hover-shadow": `0 20px 40px -5px ${hexToRgba(theme.colors.primary, 0.3)}, 0 10px 20px -5px ${hexToRgba(theme.colors.primary, 0.15)}`,
          } as React.CSSProperties;
        case "outlined":
          return {
            backgroundColor: "transparent",
            border: `2px solid ${theme.colors.primary}`,
          };
        case "hacker":
          return {
            backgroundColor: theme.colors.background,
            border: `2px solid ${theme.colors.primary}`,
            boxShadow: `0 8px 20px -4px ${hexToRgba(theme.colors.primary, 0.25)}, 0 0 0 1px ${hexToRgba(theme.colors.primary, 0.1)}`,
            "--hover-border": theme.colors.accent,
            "--hover-shadow": `0 12px 30px -4px ${hexToRgba(theme.colors.primary, 0.35)}, 0 0 0 1px ${hexToRgba(theme.colors.accent, 0.2)}`,
          } as React.CSSProperties;
        default:
          return {};
      }
    };

    const style = getVariantStyles();

    return (
      <div
        ref={ref}
        className={baseStyles}
        style={style}
        onMouseEnter={(e) => {
          if (variant === "elevated") {
            e.currentTarget.style.boxShadow = `var(--hover-shadow)`;
            e.currentTarget.style.transform = "translateY(-2px)";
          } else if (variant === "hacker") {
            e.currentTarget.style.borderColor = `var(--hover-border)`;
            e.currentTarget.style.boxShadow = `var(--hover-shadow)`;
            e.currentTarget.style.transform = "translateY(-1px)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          Object.assign(e.currentTarget.style, getVariantStyles());
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
