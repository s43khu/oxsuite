"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { ArrowLeft, Plus, Check, Minus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { useTheme } from "@/components/ui/ThemeProvider";
import { allTools } from "@/lib/tools/config";
import { getLayoutConfig, saveLayoutConfig, type ToolLayoutConfig } from "@/lib/storage";
import { type Tool } from "@/components/tools/ToolLibrary";
import { cn } from "@/lib/utils";
import { hexToRgba } from "@/lib/color-utils";

export default function ToolLibraryPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleToolIds, setVisibleToolIds] = useState<string[]>([]);
  const [toolOrder, setToolOrder] = useState<string[]>([]);
  const [addedTools, setAddedTools] = useState<Set<string>>(new Set());

  useEffect(() => {
    const config = getLayoutConfig();
    setVisibleToolIds(config.visibleToolIds);
    setToolOrder(config.toolOrder);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power3.out" }
      );
    }
  }, []);

  const hiddenTools = allTools.filter((t) => !visibleToolIds.includes(t.id));
  const visibleTools = allTools.filter((t) => visibleToolIds.includes(t.id));

  const handleAddTool = (toolId: string) => {
    if (!visibleToolIds.includes(toolId)) {
      const newVisibleIds = [...visibleToolIds, toolId];
      const newOrder = toolOrder.includes(toolId) ? toolOrder : [...toolOrder, toolId];
      
      setVisibleToolIds(newVisibleIds);
      setToolOrder(newOrder);
      
      const config: ToolLayoutConfig = {
        visibleToolIds: newVisibleIds,
        toolOrder: newOrder,
      };
      saveLayoutConfig(config);
      
      setAddedTools((prev) => new Set([...prev, toolId]));
      
      setTimeout(() => {
        setAddedTools((prev) => {
          const next = new Set(prev);
          next.delete(toolId);
          return next;
        });
      }, 2000);
    }
  };

  const handleRemoveTool = (toolId: string) => {
    if (visibleToolIds.includes(toolId)) {
      const newVisibleIds = visibleToolIds.filter((id) => id !== toolId);
      const newOrder = toolOrder.filter((id) => id !== toolId);
      
      setVisibleToolIds(newVisibleIds);
      setToolOrder(newOrder);
      
      const config: ToolLayoutConfig = {
        visibleToolIds: newVisibleIds,
        toolOrder: newOrder,
      };
      saveLayoutConfig(config);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "transparent" }}>
      <PageHeader />
      
      <div ref={containerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/")}
            className="mb-6 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          
          <div className="text-center mb-8">
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold smooch-sans font-effect-anaglyph tracking-wider mb-4"
              style={{ color: theme.colors.primary }}
            >
              Tool Library
            </h1>
          </div>
        </div>

        {hiddenTools.length > 0 && (
          <div className="mb-12">
            <h2
              className="text-2xl font-bold mb-6 smooch-sans font-effect-anaglyph"
              style={{ color: theme.colors.primary }}
            >
              Available Tools
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {hiddenTools.map((tool) => (
                <Card
                  key={tool.id}
                  variant="hacker"
                  className="p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                >
                  <div className="flex items-start gap-4 mb-4">
                    {tool.icon && (
                      <div
                        className="flex-shrink-0"
                        style={{ color: theme.colors.primary }}
                      >
                        {tool.icon}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3
                        className="text-xl font-bold mb-2 smooch-sans font-effect-anaglyph"
                        style={{ color: theme.colors.primary }}
                      >
                        {tool.title}
                      </h3>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: theme.colors.foreground, opacity: 0.75 }}
                      >
                        {tool.description}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddTool(tool.id)}
                    disabled={addedTools.has(tool.id)}
                    className={cn(
                      "w-full h-12 rounded-lg",
                      "flex items-center justify-center",
                      "transition-all duration-200",
                      "border-2",
                      addedTools.has(tool.id)
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:scale-105 active:scale-95 cursor-pointer"
                    )}
                    style={{
                      backgroundColor: addedTools.has(tool.id)
                        ? hexToRgba(theme.colors.primary, 0.2)
                        : hexToRgba(theme.colors.primary, 0.1),
                      borderColor: theme.colors.primary,
                      color: theme.colors.primary,
                    }}
                    aria-label={addedTools.has(tool.id) ? "Added to dashboard" : "Add to dashboard"}
                    title={addedTools.has(tool.id) ? "Added to dashboard" : "Add to dashboard"}
                  >
                    {addedTools.has(tool.id) ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
                  </button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {visibleTools.length > 0 && (
          <div>
            <h2
              className="text-2xl font-bold mb-6 smooch-sans font-effect-anaglyph"
              style={{ color: theme.colors.primary }}
            >
              Tools on Dashboard
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {visibleTools.map((tool) => (
                <Card
                  key={tool.id}
                  variant="hacker"
                  className="p-6 opacity-75"
                >
                  <div className="flex items-start gap-4 mb-4">
                    {tool.icon && (
                      <div
                        className="flex-shrink-0"
                        style={{ color: theme.colors.primary }}
                      >
                        {tool.icon}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3
                        className="text-xl font-bold mb-2 smooch-sans font-effect-anaglyph"
                        style={{ color: theme.colors.primary }}
                      >
                        {tool.title}
                      </h3>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: theme.colors.foreground, opacity: 0.75 }}
                      >
                        {tool.description}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveTool(tool.id)}
                    className={cn(
                      "w-full h-12 rounded-lg",
                      "flex items-center justify-center",
                      "transition-all duration-200",
                      "border-2",
                      "hover:scale-105 active:scale-95 cursor-pointer"
                    )}
                    style={{
                      backgroundColor: hexToRgba(theme.colors.accent, 0.1),
                      borderColor: theme.colors.accent,
                      color: theme.colors.accent,
                    }}
                    aria-label="Remove from dashboard"
                    title="Remove from dashboard"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {hiddenTools.length === 0 && visibleTools.length > 0 && (
          <div className="text-center py-12">
            <p
              className="text-lg"
              style={{ color: theme.colors.foreground, opacity: 0.6 }}
            >
              All tools are already on your dashboard
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
