"use client";

import { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/components/ui/ThemeProvider";
import { cn } from "@/lib/utils";
import { hexToRgba } from "@/lib/color-utils";
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
      onClick={onClose}
    >
      <div
        className={cn(
          "relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-lg border-2",
          "backdrop-blur-md"
        )}
        style={{
          backgroundColor: hexToRgba(theme.colors.background, 0.95),
          borderColor: theme.colors.primary,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="p-6 border-b-2"
          style={{ borderColor: theme.colors.primary }}
        >
          <div className="flex items-center justify-between">
            <h2
              className="text-2xl font-bold smooch-sans font-effect-anaglyph"
              style={{ color: theme.colors.primary }}
            >
              Tool Library
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
          <p
            className="text-sm mt-2"
            style={{ color: theme.colors.foreground, opacity: 0.7 }}
          >
            Add tools back to your dashboard
          </p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {hiddenTools.length === 0 ? (
            <div
              className="text-center py-12"
              style={{ color: theme.colors.foreground, opacity: 0.6 }}
            >
              <p className="text-lg">All tools are visible on your dashboard</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {hiddenTools.map((tool) => (
                <Card
                  key={tool.id}
                  variant="hacker"
                  className="p-4 transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="flex items-start gap-3 mb-3">
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
                        className="text-lg font-bold mb-1 smooch-sans font-effect-anaglyph"
                        style={{ color: theme.colors.primary }}
                      >
                        {tool.title}
                      </h3>
                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: theme.colors.foreground, opacity: 0.75 }}
                      >
                        {tool.description}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={() => onAddTool(tool.id)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Dashboard
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
