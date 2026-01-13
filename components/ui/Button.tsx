"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { useTheme } from "./ThemeProvider";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", children, ...props }, ref) => {
    const { theme } = useTheme();

    const getPrimaryColor = (color: string) => {
      const hex = color.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, `;
    };

    const primaryRgba = getPrimaryColor(theme.colors.primary);

    const baseStyles =
      "inline-flex items-center justify-center rounded-lg font-mono font-medium transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variantStyles = {
      primary: {
        backgroundColor: `${primaryRgba}0.2)`,
        borderColor: theme.colors.primary,
        color: theme.colors.primary,
        boxShadow: `0 0 15px ${primaryRgba}0.2)`,
      },
      secondary: {
        backgroundColor: theme.colors.background,
        borderColor: `${primaryRgba}0.5)`,
        color: theme.colors.primary,
      },
      outline: {
        borderColor: theme.colors.primary,
        color: theme.colors.primary,
        backgroundColor: "transparent",
      },
    };

    const sizes = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg",
    };

    const style = {
      ...variantStyles[variant],
      ...(variant === "primary" && {
        "--hover-bg": `${primaryRgba}0.3)`,
        "--hover-border": theme.colors.accent,
        "--hover-shadow": `0 0 25px ${primaryRgba}0.4)`,
      } as React.CSSProperties),
      ...(variant === "secondary" && {
        "--hover-bg": `${primaryRgba}0.1)`,
        "--hover-border": theme.colors.primary,
      } as React.CSSProperties),
      ...(variant === "outline" && {
        "--hover-bg": `${primaryRgba}0.1)`,
      } as React.CSSProperties),
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${sizes[size]} ${className}`}
        style={style}
        onMouseEnter={(e) => {
          if (variant === "primary") {
            e.currentTarget.style.backgroundColor = `${primaryRgba}0.3)`;
            e.currentTarget.style.borderColor = theme.colors.accent;
            e.currentTarget.style.boxShadow = `0 0 25px ${primaryRgba}0.4)`;
          } else if (variant === "secondary") {
            e.currentTarget.style.backgroundColor = `${primaryRgba}0.1)`;
            e.currentTarget.style.borderColor = theme.colors.primary;
          } else {
            e.currentTarget.style.backgroundColor = `${primaryRgba}0.1)`;
          }
        }}
        onMouseLeave={(e) => {
          Object.assign(e.currentTarget.style, variantStyles[variant]);
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
