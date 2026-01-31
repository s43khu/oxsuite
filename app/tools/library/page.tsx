"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import {
  ArrowLeft,
  Plus,
  Check,
  Minus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { useTheme } from "@/components/ui/ThemeProvider";
import { allTools } from "@/lib/tools/config";
import {
  getLayoutConfig,
  saveLayoutConfig,
  type ToolLayoutConfig,
} from "@/lib/storage";
import type { Tool } from "@/components/tools/ToolLibrary";
import { cn } from "@/lib/utils";
import { hexToRgba } from "@/lib/color-utils";

function StoreRow({
  tool,
  theme,
  action,
  onAction,
  disabled,
  added,
}: {
  tool: Tool;
  theme: {
    colors: {
      primary: string;
      foreground: string;
      accent: string;
      border?: string;
    };
  };
  action: "add" | "remove";
  onAction: () => void;
  disabled?: boolean;
  added?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const descRef = useRef<HTMLParagraphElement>(null);

  const checkTruncated = () => {
    const el = descRef.current;
    if (!el || expanded) return;
    setIsTruncated(el.scrollHeight > el.clientHeight);
  };

  useLayoutEffect(() => {
    checkTruncated();
  }, [expanded, tool.description]);

  useEffect(() => {
    const el = descRef.current;
    if (!el || expanded) return;
    const ro = new ResizeObserver(checkTruncated);
    ro.observe(el);
    return () => ro.disconnect();
  }, [expanded, tool.description]);

  const showMoreButton = isTruncated || expanded;

  return (
    <div
      className="flex items-start gap-4 py-3 px-4 rounded-xl transition-all duration-200 border border-transparent hover:bg-black/5"
      style={{ borderColor: "transparent" }}
    >
      <div
        className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center [&>svg]:w-6 [&>svg]:h-6"
        style={{
          color: theme.colors.primary,
          backgroundColor: `${theme.colors.primary}18`,
        }}
      >
        {tool.icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3
          className="text-sm font-semibold truncate"
          style={{ color: theme.colors.primary }}
        >
          {tool.title}
        </h3>
        <p
          ref={descRef}
          className={cn(
            "text-xs mt-0.5 transition-all duration-200",
            !expanded && "line-clamp-1",
          )}
          style={{ color: theme.colors.foreground, opacity: 0.75 }}
        >
          {tool.description}
        </p>
        {showMoreButton && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-1 mt-1.5 text-xs font-medium transition-colors hover:opacity-80"
            style={{ color: theme.colors.primary }}
            aria-label={expanded ? "Show less" : "View full description"}
            title={expanded ? "Show less" : "View full description"}
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Less</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>More</span>
              </>
            )}
          </button>
        )}
      </div>
      <button
        onClick={onAction}
        disabled={disabled}
        className={cn(
          "shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 mt-0.5",
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "hover:scale-105 active:scale-95 cursor-pointer",
        )}
        style={
          action === "add"
            ? {
                backgroundColor: added
                  ? hexToRgba(theme.colors.primary, 0.25)
                  : hexToRgba(theme.colors.primary, 0.15),
                border: `1px solid ${theme.colors.primary}`,
                color: theme.colors.primary,
              }
            : {
                backgroundColor: hexToRgba(theme.colors.accent, 0.15),
                border: `1px solid ${theme.colors.accent}`,
                color: theme.colors.accent,
              }
        }
        aria-label={
          action === "add"
            ? added
              ? "Added to dashboard"
              : "Add to dashboard"
            : "Remove from dashboard"
        }
        title={
          action === "add"
            ? added
              ? "Added to dashboard"
              : "Add to dashboard"
            : "Remove from dashboard"
        }
      >
        {action === "add" ? (
          added ? (
            <Check className="w-4 h-4" />
          ) : (
            <Plus className="w-4 h-4" />
          )
        ) : (
          <Minus className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}

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
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power3.out" },
      );
    }
  }, []);

  const hiddenTools = allTools.filter((t) => !visibleToolIds.includes(t.id));
  const visibleTools = allTools.filter((t) => visibleToolIds.includes(t.id));

  const handleAddTool = (toolId: string) => {
    if (!visibleToolIds.includes(toolId)) {
      const newVisibleIds = [...visibleToolIds, toolId];
      const newOrder = toolOrder.includes(toolId)
        ? toolOrder
        : [...toolOrder, toolId];

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

      <div
        ref={containerRef}
        className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
      >
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/")}
            className="mb-4 flex items-center justify-center p-2 min-w-8 min-h-8"
            aria-label="Back to dashboard"
            title="Back to dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </Button>

          <div className="mb-6">
            <h1
              className="text-2xl sm:text-3xl font-semibold tracking-tight"
              style={{ color: theme.colors.primary }}
            >
              Store
            </h1>
            <p
              className="text-sm mt-1"
              style={{ color: theme.colors.foreground, opacity: 0.75 }}
            >
              Add or remove tools from your dashboard
            </p>
          </div>
        </div>

        {hiddenTools.length > 0 && (
          <section className="mb-8">
            <div
              className="rounded-2xl border p-4 sm:p-6 transition-all duration-200 overflow-hidden relative"
              style={{
                backgroundColor: hexToRgba(theme.colors.primary, 0.06),
                borderColor: hexToRgba(theme.colors.primary, 0.15),
                backdropFilter: "blur(5px) saturate(180%)",
                WebkitBackdropFilter: "blur(5px) saturate(180%)",
                boxShadow: `0 8px 32px ${hexToRgba(theme.colors.primary, 0.08)}, inset 0 1px 0 ${hexToRgba(theme.colors.foreground, 0.1)}`,
              }}
            >
              <h2
                className="text-sm font-semibold uppercase tracking-wider mb-3"
                style={{ color: theme.colors.foreground, opacity: 0.8 }}
              >
                In the Store
              </h2>
              <div className="flex flex-col gap-0.5">
                {hiddenTools.map((tool) => (
                  <StoreRow
                    key={tool.id}
                    tool={tool}
                    theme={theme}
                    action="add"
                    onAction={() => handleAddTool(tool.id)}
                    disabled={addedTools.has(tool.id)}
                    added={addedTools.has(tool.id)}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {visibleTools.length > 0 && (
          <section>
            <div
              className="rounded-2xl border p-4 sm:p-6 transition-all duration-200 overflow-hidden relative"
              style={{
                backgroundColor: hexToRgba(theme.colors.primary, 0.06),
                borderColor: hexToRgba(theme.colors.primary, 0.15),
                backdropFilter: "blur(5px) saturate(180%)",
                WebkitBackdropFilter: "blur(5px) saturate(180%)",
                boxShadow: `0 8px 32px ${hexToRgba(theme.colors.primary, 0.08)}, inset 0 1px 0 ${hexToRgba(theme.colors.foreground, 0.1)}`,
              }}
            >
              <h2
                className="text-sm font-semibold uppercase tracking-wider mb-3"
                style={{ color: theme.colors.foreground, opacity: 0.8 }}
              >
                On Your Dashboard
              </h2>
              <div className="flex flex-col gap-0.5">
                {visibleTools.map((tool) => (
                  <StoreRow
                    key={tool.id}
                    tool={tool}
                    theme={theme}
                    action="remove"
                    onAction={() => handleRemoveTool(tool.id)}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {hiddenTools.length === 0 && visibleTools.length > 0 && (
          <div className="py-8 text-center">
            <p
              className="text-sm"
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
