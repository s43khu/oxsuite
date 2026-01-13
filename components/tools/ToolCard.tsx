"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/components/ui/ThemeProvider";

interface ToolCardProps {
  title: string;
  description: string;
  icon?: ReactNode;
  status: "available" | "coming-soon";
  route?: string | null;
}

export default function ToolCard({ title, description, icon, status, route }: ToolCardProps) {
  const { theme } = useTheme();

  const cardContent = (
    <Card
      variant="hacker"
      className={`p-6 transition-all duration-300 hover:scale-105 ${
        status === "coming-soon" ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-start gap-4 mb-4">
          {icon && (
            <div className="flex-shrink-0" style={{ color: theme.colors.primary }}>
              {icon}
            </div>
          )}
          <div className="flex-1">
            <h3
              className="text-xl font-semibold smooch-sans font-effect-anaglyph mb-2"
              style={{ color: theme.colors.primary }}
            >
              {title}
            </h3>
            <p
              className="text-sm font-mono"
              style={{ color: theme.colors.foreground, opacity: 0.7 }}
            >
              {description}
            </p>
          </div>
        </div>

        <div className="mt-auto">
          {status === "coming-soon" ? (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-yellow-500/10 border border-yellow-500 text-yellow-500 rounded-full text-xs font-mono font-medium">
                COMING SOON
              </span>
            </div>
          ) : (
            <Button variant="primary" size="sm" className="w-full">
              USE TOOL
            </Button>
          )}
        </div>
      </div>
    </Card>
  );

  if (status === "available" && route) {
    return (
      <Link href={route} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
