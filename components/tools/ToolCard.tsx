"use client";

import { useRef, useCallback } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useTheme } from "@/components/ui/ThemeProvider";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

const LONG_PRESS_MS = 100;

interface ToolCardProps {
  id: string;
  title: string;
  description: string;
  icon?: ReactNode;
  status: "available" | "coming-soon";
  route?: string | null;
  isEditMode?: boolean;
  onRemove?: (id: string) => void;
  onEnterEditMode?: () => void;
  isDragging?: boolean;
  dragHandleProps?: {
    [key: string]: unknown;
  };
}

const ICON_SIZE = 56;

export default function ToolCard({
  id,
  title,
  description,
  icon,
  status,
  route,
  isEditMode = false,
  onRemove,
  onEnterEditMode,
  isDragging = false,
  dragHandleProps,
}: ToolCardProps) {
  const { theme } = useTheme();
  const isAvailable = status === "available";
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFiredRef = useRef(false);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (isEditMode || !onEnterEditMode || !isAvailable) return;
      longPressFiredRef.current = false;
      longPressTimerRef.current = setTimeout(() => {
        longPressTimerRef.current = null;
        longPressFiredRef.current = true;
        onEnterEditMode();
      }, LONG_PRESS_MS);
    },
    [isEditMode, onEnterEditMode, isAvailable],
  );

  const handlePointerUp = useCallback(() => {
    clearLongPressTimer();
  }, [clearLongPressTimer]);

  const handlePointerLeave = useCallback(() => {
    clearLongPressTimer();
  }, [clearLongPressTimer]);

  const handleLinkClick = useCallback((e: React.MouseEvent) => {
    if (longPressFiredRef.current) {
      e.preventDefault();
      longPressFiredRef.current = false;
    }
  }, []);

  const iconBlock = (
    <div
      {...(isEditMode && dragHandleProps ? dragHandleProps : {})}
      {...(!isEditMode && {
        onPointerDown: handlePointerDown,
        onPointerUp: handlePointerUp,
        onPointerLeave: handlePointerLeave,
        onPointerCancel: handlePointerLeave,
      })}
      className={cn(
        "relative rounded-2xl flex items-center justify-center shrink-0 transition-all duration-200 ease-out select-none",
        isAvailable && !isEditMode && "hover:scale-105 cursor-pointer",
        !isAvailable && "opacity-60 cursor-not-allowed",
        isDragging && "opacity-50 scale-95 cursor-grabbing",
        isEditMode && "cursor-grab active:cursor-grabbing",
      )}
      style={{
        width: ICON_SIZE,
        height: ICON_SIZE,
        backgroundColor: `${theme.colors.primary}18`,
        color: theme.colors.primary,
      }}
      title={isEditMode ? "Drag to reorder" : "Long press to edit"}
    >
      {icon && (
        <div className="[&>svg]:w-7 [&>svg]:h-7 pointer-events-none">
          {icon}
        </div>
      )}
      {!isAvailable && (
        <span
          className="absolute bottom-0 right-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase pointer-events-none"
          style={{
            backgroundColor: theme.colors.accent,
            color: theme.colors.background,
          }}
        >
          Soon
        </span>
      )}
      {isEditMode && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove(id);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center shadow-md z-10 cursor-pointer hover:scale-110 transition-transform"
          style={{
            color: theme.colors.background,
            backgroundColor: theme.colors.accent,
          }}
          aria-label={`Remove ${title}`}
          title="Remove from dashboard"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );

  const label = (
    <span
      className={cn(
        "block text-center text-xs font-medium mt-2 line-clamp-2 px-0.5",
        !isAvailable && "opacity-70",
      )}
      style={{ color: theme.colors.foreground }}
    >
      {title}
    </span>
  );

  const tile = (
    <div
      className="group relative flex flex-col items-center w-full min-w-0"
      title={description}
    >
      {iconBlock}
      {label}
    </div>
  );

  if (isAvailable && route && !isEditMode) {
    return (
      <Link
        href={route}
        className="block w-full min-w-0"
        aria-label={`Open ${title} tool`}
        onClick={handleLinkClick}
      >
        {tile}
      </Link>
    );
  }

  return tile;
}
