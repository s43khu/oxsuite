"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ToolCard from "./ToolCard";
import type { Tool } from "./ToolLibrary";
import { useTheme } from "@/components/ui/ThemeProvider";
import {
  getLayoutConfig,
  saveLayoutConfig,
  hasStoredLayoutConfig,
  type ToolLayoutConfig,
} from "@/lib/storage";
import { allTools } from "@/lib/tools/config";
import { hexToRgba } from "@/lib/color-utils";

interface SortableToolCardProps {
  tool: Tool;
  isEditMode: boolean;
  onRemove: (id: string) => void;
  onEnterEditMode?: () => void;
}

function SortableToolCard({
  tool,
  isEditMode,
  onRemove,
  onEnterEditMode,
}: SortableToolCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: tool.id,
    disabled: !isEditMode,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isEditMode ? { ...attributes, ...listeners } : {})}
    >
      <ToolCard
        id={tool.id}
        title={tool.title}
        description={tool.description}
        icon={tool.icon}
        status={tool.status}
        route={tool.route}
        isEditMode={isEditMode}
        onRemove={onRemove}
        onEnterEditMode={onEnterEditMode}
        isDragging={isDragging}
      />
    </div>
  );
}

interface ToolsDashboardProps {
  isEditMode?: boolean;
  onEditModeChange?: (value: boolean) => void;
}

export default function ToolsDashboard({
  isEditMode: externalEditMode,
  onEditModeChange,
}: ToolsDashboardProps) {
  const cardsRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const [internalEditMode, setInternalEditMode] = useState(false);
  const [visibleToolIds, setVisibleToolIds] = useState<string[]>([]);
  const [toolOrder, setToolOrder] = useState<string[]>([]);

  const isEditMode =
    externalEditMode !== undefined ? externalEditMode : internalEditMode;
  const handleEditModeToggle = () => {
    const newValue = !isEditMode;
    if (onEditModeChange) {
      onEditModeChange(newValue);
    } else {
      setInternalEditMode(newValue);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const loadLayoutConfig = () => {
    const hasStored = hasStoredLayoutConfig();
    const config = getLayoutConfig();
    const defaultToolIds = ["web-check", "time-date-converter", "jwt-viewer"];

    if (!hasStored) {
      setVisibleToolIds(defaultToolIds);
      setToolOrder(defaultToolIds);
      const defaultConfig: ToolLayoutConfig = {
        visibleToolIds: defaultToolIds,
        toolOrder: defaultToolIds,
      };
      saveLayoutConfig(defaultConfig);
    } else {
      setVisibleToolIds(config.visibleToolIds);
      setToolOrder(
        config.toolOrder.length > 0 ? config.toolOrder : config.visibleToolIds,
      );
    }
  };

  useEffect(() => {
    loadLayoutConfig();

    const handleFocus = () => {
      loadLayoutConfig();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  useEffect(() => {
    if (cardsRef.current && !isEditMode) {
      const cards = cardsRef.current.children;
      gsap.fromTo(
        Array.from(cards),
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power3.out" },
      );
    }
  }, [visibleToolIds, isEditMode]);

  const visibleTools = toolOrder
    .filter((id) => visibleToolIds.includes(id))
    .map((id) => allTools.find((t) => t.id === id))
    .filter((t): t is Tool => t !== undefined);

  const hiddenTools = allTools.filter((t) => !visibleToolIds.includes(t.id));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setToolOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        saveConfig(newOrder, visibleToolIds);
        return newOrder;
      });
    }
  };

  const handleRemoveTool = (toolId: string) => {
    const newVisibleIds = visibleToolIds.filter((id) => id !== toolId);
    setVisibleToolIds(newVisibleIds);
    saveConfig(toolOrder, newVisibleIds);
  };

  const saveConfig = (order: string[], visible: string[]) => {
    const config: ToolLayoutConfig = {
      visibleToolIds: visible,
      toolOrder: order,
    };
    saveLayoutConfig(config);
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8 sm:mb-10 mt-6">
        <h1
          className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-wider mb-3 sm:mb-4"
          style={{ color: theme.colors.primary }}
        >
          OXsuite Tools
        </h1>
        <p
          className="text-sm sm:text-base font-medium max-w-2xl mx-auto px-4"
          style={{ color: theme.colors.foreground, opacity: 0.8 }}
        >
          {">"} Professional tools for daily use. Choose a tool to get started
          or explore what's coming soon.
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={visibleTools.map((t) => t.id)}
          strategy={rectSortingStrategy}
        >
          <div
            className="rounded-2xl border p-4 sm:p-6 min-h-112 max-w-5xl mx-auto transition-all duration-200 overflow-hidden relative"
            style={{
              backgroundColor: hexToRgba(theme.colors.primary, 0.06),
              borderColor: hexToRgba(theme.colors.primary, 0.15),
              backdropFilter: "blur(5px) saturate(180%)",
              WebkitBackdropFilter: "blur(5px) saturate(180%)",
              boxShadow: `0 8px 32px ${hexToRgba(theme.colors.primary, 0.08)}, inset 0 1px 0 ${hexToRgba(theme.colors.foreground, 0.1)}`,
            }}
          >
            {isEditMode && (
              <button
                type="button"
                onClick={handleEditModeToggle}
                className="absolute top-3 right-3 z-10 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all hover:scale-105"
                style={{
                  color: theme.colors.primary,
                  borderColor: theme.colors.primary,
                  backgroundColor: hexToRgba(theme.colors.primary, 0.12),
                }}
                aria-label="Done"
                title="Done"
              >
                Done
              </button>
            )}
            <div
              ref={cardsRef}
              className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 sm:gap-6 content-start"
            >
              {visibleTools.map((tool) => (
                <SortableToolCard
                  key={tool.id}
                  tool={tool}
                  isEditMode={isEditMode}
                  onRemove={handleRemoveTool}
                  onEnterEditMode={
                    !isEditMode ? () => handleEditModeToggle() : undefined
                  }
                />
              ))}
            </div>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
