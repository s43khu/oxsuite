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
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import {
  Settings,
  Library,
} from "lucide-react";
import ToolCard from "./ToolCard";
import { type Tool } from "./ToolLibrary";
import { useTheme } from "@/components/ui/ThemeProvider";
import { Button } from "@/components/ui/Button";
import { getLayoutConfig, saveLayoutConfig, hasStoredLayoutConfig, type ToolLayoutConfig } from "@/lib/storage";
import { allTools } from "@/lib/tools/config";

interface SortableToolCardProps {
  tool: Tool;
  isEditMode: boolean;
  onRemove: (id: string) => void;
}

function SortableToolCard({ tool, isEditMode, onRemove }: SortableToolCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tool.id,
    disabled: !isEditMode,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ToolCard
        id={tool.id}
        title={tool.title}
        description={tool.description}
        icon={tool.icon}
        status={tool.status}
        route={tool.route}
        isEditMode={isEditMode}
        onRemove={onRemove}
        isDragging={isDragging}
        dragHandleProps={isEditMode ? { ...attributes, ...listeners } : undefined}
      />
    </div>
  );
}

export default function ToolsDashboard() {
  const router = useRouter();
  const cardsRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const [isEditMode, setIsEditMode] = useState(false);
  const [visibleToolIds, setVisibleToolIds] = useState<string[]>([]);
  const [toolOrder, setToolOrder] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
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
      setToolOrder(config.toolOrder.length > 0 ? config.toolOrder : config.visibleToolIds);
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
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power3.out" }
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
      <div className="text-center mb-12 sm:mb-16">
        <h1
          className="text-4xl sm:text-5xl lg:text-6xl font-bold smooch-sans font-effect-anaglyph tracking-wider mb-4 sm:mb-6"
          style={{ color: theme.colors.primary }}
        >
          OXsuite Tools
        </h1>
        <p
          className="text-base sm:text-lg font-medium max-w-2xl mx-auto px-4"
          style={{ color: theme.colors.foreground, opacity: 0.8 }}
        >
          {">"} Professional tools for daily use. Choose a tool to get started or explore what's
          coming soon.
        </p>
      </div>

      <div className="flex justify-center gap-4 mb-8">
        <Button
          variant={isEditMode ? "primary" : "outline"}
          size="md"
          onClick={() => setIsEditMode(!isEditMode)}
        >
          <Settings className="w-4 h-4 mr-2" />
          {isEditMode ? "Done Editing" : "Edit Layout"}
        </Button>
        {isEditMode && (
          <Button variant="secondary" size="md" onClick={() => router.push("/tools/library")}>
            <Library className="w-4 h-4 mr-2" />
            Tool Library ({hiddenTools.length})
          </Button>
        )}
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
            ref={cardsRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          >
            {visibleTools.map((tool) => (
              <SortableToolCard
                key={tool.id}
                tool={tool}
                isEditMode={isEditMode}
                onRemove={handleRemoveTool}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
