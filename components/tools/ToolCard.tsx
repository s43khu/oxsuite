"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/components/ui/ThemeProvider";
import { cn } from "@/lib/utils";

interface ToolCardProps {
  title: string;
  description: string;
  icon?: ReactNode;
  status: "available" | "coming-soon";
  route?: string | null;
}

export default function ToolCard({ title, description, icon, status, route }: ToolCardProps) {
  const { theme } = useTheme();
  const isAvailable = status === "available";

  const cardContent = (
    <Card
      variant="hacker"
      className={cn(
        "p-6 h-full",
        "transition-all duration-300 ease-out",
        isAvailable && "hover:scale-[1.02] cursor-pointer",
        !isAvailable && "opacity-60 cursor-not-allowed"
      )}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-start gap-4 mb-5">
          {icon && (
            <div
              className="flex-shrink-0 transition-transform duration-300"
              style={{ color: theme.colors.primary }}
            >
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3
              className={cn(
                "text-xl font-bold mb-2",
                "smooch-sans font-effect-anaglyph"
              )}
              style={{ color: theme.colors.primary }}
            >
              {title}
            </h3>
            <p
              className={cn(
                "text-sm font-medium leading-relaxed"
              )}
              style={{ color: theme.colors.foreground, opacity: 0.75 }}
            >
              {description}
            </p>
          </div>
        </div>

        <div className="mt-auto pt-4">
          {!isAvailable ? (
            <div className="flex items-center justify-center">
              <span
                className={cn(
                  "px-4 py-1.5 rounded-full",
                  "text-xs font-semibold uppercase tracking-wider",
                  "border-2"
                )}
                style={{
                  backgroundColor: `${theme.colors.accent}15`,
                  borderColor: theme.colors.accent,
                  color: theme.colors.accent,
                }}
              >
                Coming Soon
              </span>
            </div>
          ) : (
            <Button variant="primary" size="sm" className="w-full">
              Use Tool
            </Button>
          )}
        </div>
      </div>
    </Card>
  );

  if (isAvailable && route) {
    return (
      <Link href={route} className="block h-full" aria-label={`Open ${title} tool`}>
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
