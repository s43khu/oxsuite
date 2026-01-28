"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/components/ui/ThemeProvider";
import { cn } from "@/lib/utils";
import { GripVertical, X } from "lucide-react";

interface ToolCardProps {
  id: string;
  title: string;
  description: string;
  icon?: ReactNode;
  status: "available" | "coming-soon";
  route?: string | null;
  isEditMode?: boolean;
  onRemove?: (id: string) => void;
  isDragging?: boolean;
  dragHandleProps?: {
    [key: string]: unknown;
  };
}

export default function ToolCard({
  id,
  title,
  description,
  icon,
  status,
  route,
  isEditMode = false,
  onRemove,
  isDragging = false,
  dragHandleProps,
}: ToolCardProps) {
  const { theme } = useTheme();
  const isAvailable = status === "available";

  const cardContent = (
    <Card
      variant="hacker"
      className={cn(
        "p-6 h-full relative",
        "transition-all duration-300 ease-out",
        isAvailable && !isEditMode && "hover:scale-[1.02] cursor-pointer",
        !isAvailable && "opacity-60 cursor-not-allowed",
        isDragging && "opacity-50 scale-95",
        isEditMode && "cursor-move"
      )}
    >
      {isEditMode && (
        <div className="absolute top-3 right-3 flex gap-2 z-10">
          <div
            {...dragHandleProps}
            className="p-2 rounded-md cursor-grab active:cursor-grabbing transition-colors hover:bg-primary/20"
            style={{ color: theme.colors.primary }}
            title="Drag to reorder"
          >
            <GripVertical className="w-5 h-5" />
          </div>
          {onRemove && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove(id);
              }}
              className="p-2 rounded-md transition-colors hover:bg-red-500/30 border-2"
              style={{
                color: theme.colors.accent,
                borderColor: theme.colors.accent,
                backgroundColor: `${theme.colors.accent}10`,
              }}
              aria-label={`Remove ${title}`}
              title="Remove from dashboard"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
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
              className={cn("text-xl font-bold mb-2", "smooch-sans font-effect-anaglyph")}
              style={{ color: theme.colors.primary }}
            >
              {title}
            </h3>
            <p
              className={cn("text-sm font-medium leading-relaxed")}
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

  if (isAvailable && route && !isEditMode) {
    return (
      <Link href={route} className="block h-full" aria-label={`Open ${title} tool`}>
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
