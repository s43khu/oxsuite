"use client";

import { useState, useRef, useEffect } from "react";
import { gsap } from "gsap";
import { FileText, Download, X, Copy, Check, WrapText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/components/ui/ThemeProvider";
import { Card } from "@/components/ui/Card";
import { hexToRgba } from "@/lib/color-utils";

interface TextViewerProps {
  file: File;
  onClear: () => void;
}

export default function TextViewer({ file, onClear }: TextViewerProps) {
  const { theme } = useTheme();
  const [content, setContent] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [wordWrap, setWordWrap] = useState(true);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!file) return;

    setError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        setContent(text);

        if (containerRef.current) {
          gsap.fromTo(
            containerRef.current,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
          );
        }
      } catch (err) {
        setError("Failed to read text file. Please ensure it's a valid file.");
        console.error("Error reading file:", err);
      }
    };

    reader.onerror = () => {
      setError("Error reading file. Please try again.");
    };

    reader.readAsText(file);
  }, [file]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setContent("");
    setError("");
    onClear();
  };

  const getStats = () => {
    const lines = content.split("\n");
    const words = content.trim() ? content.trim().split(/\s+/) : [];
    return {
      lines: lines.length,
      words: words.length,
      characters: content.length,
      charactersNoSpaces: content.replace(/\s/g, "").length,
    };
  };

  const stats = getStats();
  const lines = content.split("\n");

  return (
    <div className="w-full space-y-6">
      <Card variant="hacker" className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6" style={{ color: theme.colors.primary }} />
            <div>
              <h3
                className="text-lg font-semibold smooch-sans font-effect-anaglyph"
                style={{ color: theme.colors.primary }}
              >
                Text File Viewer
              </h3>
              <p
                className="text-sm font-mono"
                style={{ color: theme.colors.foreground, opacity: 0.7 }}
              >
                {file.name}
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => setWordWrap(!wordWrap)}
              className="flex items-center gap-2"
              size="sm"
            >
              <WrapText className="w-4 h-4" />
              {wordWrap ? "Wrap" : "No Wrap"}
            </Button>
            <Button
              variant="outline"
              onClick={handleCopy}
              className="flex items-center gap-2"
              size="sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleDownload}
              className="flex items-center gap-2"
              size="sm"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
            <Button
              variant="outline"
              onClick={handleClear}
              className="flex items-center gap-2"
              size="sm"
            >
              <X className="w-4 h-4" />
              Clear
            </Button>
          </div>
        </div>
      </Card>

      {error && (
        <Card variant="hacker" className="p-4">
          <div
            className="p-3 border rounded"
            style={{
              backgroundColor: hexToRgba(theme.colors.accent, 0.1),
              borderColor: hexToRgba(theme.colors.accent, 0.3),
            }}
          >
            <p className="text-sm font-mono" style={{ color: theme.colors.accent }}>
              {error}
            </p>
          </div>
        </Card>
      )}

      {content && (
        <div ref={containerRef} className="space-y-4">
          <Card variant="hacker" className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold font-mono" style={{ color: theme.colors.primary }}>
                  {stats.lines}
                </p>
                <p
                  className="text-xs font-mono mt-1"
                  style={{ color: theme.colors.foreground, opacity: 0.7 }}
                >
                  Lines
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold font-mono" style={{ color: theme.colors.primary }}>
                  {stats.words}
                </p>
                <p
                  className="text-xs font-mono mt-1"
                  style={{ color: theme.colors.foreground, opacity: 0.7 }}
                >
                  Words
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold font-mono" style={{ color: theme.colors.primary }}>
                  {stats.characters.toLocaleString()}
                </p>
                <p
                  className="text-xs font-mono mt-1"
                  style={{ color: theme.colors.foreground, opacity: 0.7 }}
                >
                  Characters
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold font-mono" style={{ color: theme.colors.primary }}>
                  {stats.charactersNoSpaces.toLocaleString()}
                </p>
                <p
                  className="text-xs font-mono mt-1"
                  style={{ color: theme.colors.foreground, opacity: 0.7 }}
                >
                  No Spaces
                </p>
              </div>
            </div>
          </Card>

          <Card variant="hacker" className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2
                className="text-xl font-semibold smooch-sans font-effect-anaglyph"
                style={{ color: theme.colors.primary }}
              >
                Content
              </h2>
              <div className="flex items-center gap-2">
                <label
                  className="flex items-center gap-2 text-sm font-mono cursor-pointer"
                  style={{ color: theme.colors.foreground, opacity: 0.7 }}
                >
                  <input
                    type="checkbox"
                    checked={showLineNumbers}
                    onChange={(e) => setShowLineNumbers(e.target.checked)}
                    style={{
                      borderColor: hexToRgba(theme.colors.primary, 0.5),
                      backgroundColor: theme.colors.background,
                      color: theme.colors.primary,
                    }}
                    className="w-4 h-4 rounded focus:ring-2"
                  />
                  Line Numbers
                </label>
              </div>
            </div>

            <div
              className="border rounded overflow-hidden"
              style={{ borderColor: hexToRgba(theme.colors.primary, 0.3) }}
            >
              <div
                className="overflow-x-auto max-h-[600px] overflow-y-auto"
                style={{ backgroundColor: theme.colors.background }}
              >
                {showLineNumbers ? (
                  <div className="flex">
                    <div
                      className="border-r px-3 py-4 text-right select-none sticky left-0 z-10"
                      style={{
                        backgroundColor: hexToRgba(theme.colors.primary, 0.1),
                        borderColor: hexToRgba(theme.colors.primary, 0.3),
                      }}
                    >
                      <div
                        className="font-mono text-xs"
                        style={{ color: theme.colors.primary, opacity: 0.5 }}
                      >
                        {lines.map((_, index) => (
                          <div
                            key={index}
                            className="leading-[1.5rem] min-h-[1.5rem]"
                            style={{ lineHeight: "1.5rem" }}
                          >
                            {index + 1}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <pre
                        className={`p-4 font-mono text-sm ${
                          wordWrap ? "whitespace-pre-wrap break-words" : "whitespace-pre"
                        }`}
                        style={{
                          backgroundColor: theme.colors.background,
                          color: theme.colors.foreground,
                          opacity: 0.8,
                          lineHeight: "1.5rem",
                          fontFamily: "monospace",
                          margin: 0,
                        }}
                      >
                        {content}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <pre
                    className={`p-4 font-mono text-sm ${
                      wordWrap ? "whitespace-pre-wrap break-words" : "whitespace-pre"
                    }`}
                    style={{
                      backgroundColor: theme.colors.background,
                      color: theme.colors.foreground,
                      opacity: 0.8,
                      lineHeight: "1.5rem",
                      fontFamily: "monospace",
                      margin: 0,
                    }}
                  >
                    {content}
                  </pre>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
