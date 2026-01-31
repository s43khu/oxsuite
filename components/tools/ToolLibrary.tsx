"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/components/ui/ThemeProvider";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

export interface Tool {
  id: string;
  title: string;
  description: string;
  icon?: ReactNode;
  status: "available" | "coming-soon";
  route?: string | null;
}

interface ToolLibraryProps {
  hiddenTools: Tool[];
  onAddTool: (toolId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function ToolLibrary({
  hiddenTools,
  onAddTool,
  isOpen,
  onClose,
}: ToolLibraryProps) {
  const { theme } = useTheme();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
      onClick={onClose}
    >
      <div
        className={cn(
          "relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-xl border",
          "backdrop-blur-md transition-all duration-200",
        )}
        style={{
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="p-4 border-b flex items-center justify-between"
          style={{ borderColor: theme.colors.border }}
        >
          <div>
            <h2
              className="text-lg font-semibold"
              style={{ color: theme.colors.primary }}
            >
              Store
            </h2>
            <p
              className="text-xs mt-0.5"
              style={{ color: theme.colors.foreground, opacity: 0.7 }}
            >
              Add tools to your dashboard
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="px-3 py-1.5 text-xs"
          >
            Close
          </Button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(85vh-80px)]">
          {hiddenTools.length === 0 ? (
            <div
              className="text-center py-8"
              style={{ color: theme.colors.foreground, opacity: 0.6 }}
            >
              <p className="text-sm">All tools are on your dashboard</p>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {hiddenTools.map((tool) => (
                <div
                  key={tool.id}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors hover:bg-black/5"
                >
                  <div
                    className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5"
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
                      className="text-[11px] truncate mt-0.5"
                      style={{
                        color: theme.colors.foreground,
                        opacity: 0.75,
                      }}
                    >
                      {tool.description}
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    className="shrink-0 text-xs py-1.5 px-3"
                    onClick={() => onAddTool(tool.id)}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Add
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
