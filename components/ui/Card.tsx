"use client";

import { HTMLAttributes, forwardRef } from "react";
import { useTheme } from "./ThemeProvider";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outlined" | "hacker";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", variant = "default", children, ...props }, ref) => {
    const { theme } = useTheme();

    const getPrimaryColor = (color: string) => {
      const hex = color.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, `;
    };

    const primaryRgba = getPrimaryColor(theme.colors.primary);

    const baseStyles = "rounded-lg transition-all duration-300";

    const variantStyles: Record<string, React.CSSProperties> = {
      default: {
        backgroundColor: theme.colors.background,
        border: `1px solid ${primaryRgba}0.3)`,
      },
      elevated: {
        backgroundColor: theme.colors.background,
        border: `2px solid ${theme.colors.primary}`,
        boxShadow: `0 0 20px ${primaryRgba}0.2)`,
      },
      outlined: {
        backgroundColor: "transparent",
        border: `2px solid ${theme.colors.primary}`,
      },
      hacker: {
        backgroundColor: theme.colors.background,
        border: `2px solid ${theme.colors.primary}`,
        boxShadow: `0 0 15px ${primaryRgba}0.2)`,
      },
    };

    const style = variantStyles[variant] || variantStyles.default;

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${className}`}
        style={style}
        onMouseEnter={(e) => {
          if (variant === "elevated") {
            e.currentTarget.style.boxShadow = `0 0 30px ${primaryRgba}0.3)`;
          } else if (variant === "hacker") {
            e.currentTarget.style.borderColor = theme.colors.accent;
            e.currentTarget.style.boxShadow = `0 0 25px ${primaryRgba}0.4)`;
          }
        }}
        onMouseLeave={(e) => {
          Object.assign(e.currentTarget.style, style);
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
