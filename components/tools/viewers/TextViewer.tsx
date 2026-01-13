"use client";

import { useState, useRef, useEffect } from "react";
import { gsap } from "gsap";
import { FileText, Download, X, Copy, Check, WrapText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface TextViewerProps {
  file: File;
  onClear: () => void;
}

export default function TextViewer({ file, onClear }: TextViewerProps) {
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
            <FileText className="w-6 h-6 text-green-500" />
            <div>
              <h3 className="text-lg font-semibold text-green-500 smooch-sans font-effect-anaglyph">
                Text File Viewer
              </h3>
              <p className="text-sm text-green-500/70 font-mono">{file.name}</p>
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
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded">
            <p className="text-sm text-red-500 font-mono">{error}</p>
          </div>
        </Card>
      )}

      {content && (
        <div ref={containerRef} className="space-y-4">
          <Card variant="hacker" className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-500 font-mono">{stats.lines}</p>
                <p className="text-xs text-green-500/70 font-mono mt-1">Lines</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-500 font-mono">{stats.words}</p>
                <p className="text-xs text-green-500/70 font-mono mt-1">Words</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-500 font-mono">
                  {stats.characters.toLocaleString()}
                </p>
                <p className="text-xs text-green-500/70 font-mono mt-1">Characters</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-500 font-mono">
                  {stats.charactersNoSpaces.toLocaleString()}
                </p>
                <p className="text-xs text-green-500/70 font-mono mt-1">No Spaces</p>
              </div>
            </div>
          </Card>

          <Card variant="hacker" className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-green-500 smooch-sans font-effect-anaglyph">
                Content
              </h2>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-green-500/70 font-mono cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showLineNumbers}
                    onChange={(e) => setShowLineNumbers(e.target.checked)}
                    className="w-4 h-4 rounded border-green-500/50 bg-black text-green-500 focus:ring-green-500"
                  />
                  Line Numbers
                </label>
              </div>
            </div>

            <div className="border border-green-500/30 rounded overflow-hidden">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto bg-black">
                {showLineNumbers ? (
                  <div className="flex">
                    <div className="bg-green-500/10 border-r border-green-500/30 px-3 py-4 text-right select-none sticky left-0 z-10">
                      <div className="font-mono text-xs text-green-500/50">
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
                        className={`p-4 bg-black text-green-500/80 font-mono text-sm ${
                          wordWrap ? "whitespace-pre-wrap break-words" : "whitespace-pre"
                        }`}
                        style={{
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
                    className={`p-4 bg-black text-green-500/80 font-mono text-sm ${
                      wordWrap ? "whitespace-pre-wrap break-words" : "whitespace-pre"
                    }`}
                    style={{
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
