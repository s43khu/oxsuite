"use client";

import { useState, useRef, useEffect } from "react";
import { gsap } from "gsap";
import { QrCode, Download, Copy, RotateCcw, Settings } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useTheme } from "@/components/ui/ThemeProvider";
import { hexToRgba } from "@/lib/color-utils";
import { QRCodeSVG } from "qrcode.react";

export default function QRCodeGenerator() {
  const { theme } = useTheme();
  const [text, setText] = useState("");
  const [size, setSize] = useState(256);
  const [errorLevel, setErrorLevel] = useState<"L" | "M" | "Q" | "H">("M");
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [includeMargin, setIncludeMargin] = useState(true);
  const qrRef = useRef<HTMLDivElement>(null);
  const qrContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (qrRef.current && text) {
      gsap.fromTo(
        qrRef.current,
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.5, ease: "power3.out" }
      );
    }
  }, [text, size, errorLevel, fgColor, bgColor, includeMargin]);

  const handleDownload = (format: "png" | "svg" = "png") => {
    if (!text || !qrContainerRef.current) return;

    const svg = qrContainerRef.current.querySelector("svg");
    if (!svg) return;

    if (format === "svg") {
      const svgData = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgData], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `qrcode-${Date.now()}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const url = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `qrcode-${Date.now()}.png`;
        link.href = url;
        link.click();
      }
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleCopy = async () => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const handleClear = () => {
    setText("");
  };

  const handleReset = () => {
    setSize(256);
    setErrorLevel("M");
    setFgColor("#000000");
    setBgColor("#FFFFFF");
    setIncludeMargin(true);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <Card variant="hacker" className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <QrCode className="w-8 h-8" style={{ color: theme.colors.primary }} />
          <h2
            className="text-3xl font-bold smooch-sans font-effect-anaglyph"
            style={{ color: theme.colors.primary }}
          >
            QR Code Generator
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium font-mono mb-2"
                style={{ color: theme.colors.foreground, opacity: 0.7 }}
              >
                Text or URL
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text or URL to generate QR code..."
                className="w-full px-4 py-3 font-mono focus:outline-none focus:ring-2 resize-none rounded-lg border-2"
                rows={6}
                style={{
                  backgroundColor: theme.colors.background,
                  color: theme.colors.primary,
                  borderColor: hexToRgba(theme.colors.primary, 0.5),
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.primary;
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${hexToRgba(theme.colors.primary, 0.2)}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = hexToRgba(theme.colors.primary, 0.5);
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleCopy}
                variant="outline"
                size="md"
                className="flex items-center gap-2"
                disabled={!text}
              >
                <Copy className="w-4 h-4" />
                Copy Text
              </Button>
              <Button
                onClick={handleClear}
                variant="outline"
                size="md"
                className="flex items-center gap-2"
                disabled={!text}
              >
                <RotateCcw className="w-4 h-4" />
                Clear
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <Card variant="outlined" className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5" style={{ color: theme.colors.primary }} />
                <h3
                  className="text-lg font-semibold font-mono"
                  style={{ color: theme.colors.primary }}
                >
                  Settings
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium font-mono mb-2"
                    style={{ color: theme.colors.foreground, opacity: 0.7 }}
                  >
                    Size: {size}px
                  </label>
                  <input
                    type="range"
                    min="128"
                    max="512"
                    step="32"
                    value={size}
                    onChange={(e) => setSize(Number(e.target.value))}
                    className="w-full"
                    style={{
                      accentColor: theme.colors.primary,
                    }}
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium font-mono mb-2"
                    style={{ color: theme.colors.foreground, opacity: 0.7 }}
                  >
                    Error Correction Level
                  </label>
                  <select
                    value={errorLevel}
                    onChange={(e) => setErrorLevel(e.target.value as "L" | "M" | "Q" | "H")}
                    className="w-full px-4 py-2 font-mono rounded-lg border-2 focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: theme.colors.background,
                      color: theme.colors.primary,
                      borderColor: hexToRgba(theme.colors.primary, 0.5),
                    }}
                  >
                    <option value="L">L - Low (~7%)</option>
                    <option value="M">M - Medium (~15%)</option>
                    <option value="Q">Q - Quartile (~25%)</option>
                    <option value="H">H - High (~30%)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-sm font-medium font-mono mb-2"
                      style={{ color: theme.colors.foreground, opacity: 0.7 }}
                    >
                      Foreground Color
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="w-12 h-10 rounded border-2 cursor-pointer"
                        style={{
                          borderColor: hexToRgba(theme.colors.primary, 0.5),
                        }}
                      />
                      <Input
                        type="text"
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="flex-1 font-mono"
                        placeholder="#000000"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium font-mono mb-2"
                      style={{ color: theme.colors.foreground, opacity: 0.7 }}
                    >
                      Background Color
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-12 h-10 rounded border-2 cursor-pointer"
                        style={{
                          borderColor: hexToRgba(theme.colors.primary, 0.5),
                        }}
                      />
                      <Input
                        type="text"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="flex-1 font-mono"
                        placeholder="#FFFFFF"
                      />
                    </div>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeMargin}
                    onChange={(e) => setIncludeMargin(e.target.checked)}
                    className="w-4 h-4 rounded"
                    style={{
                      accentColor: theme.colors.primary,
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.primary,
                    }}
                  />
                  <span
                    className="text-sm font-mono"
                    style={{ color: theme.colors.foreground, opacity: 0.7 }}
                  >
                    Include margin
                  </span>
                </label>

                <Button
                  onClick={handleReset}
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset to Defaults
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </Card>

      {text && (
        <Card variant="hacker" className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold font-mono" style={{ color: theme.colors.primary }}>
              Generated QR Code
            </h3>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleDownload("png")}
                variant="primary"
                size="md"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download PNG
              </Button>
              <Button
                onClick={() => handleDownload("svg")}
                variant="outline"
                size="md"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download SVG
              </Button>
            </div>
          </div>

          <div
            ref={qrRef}
            className="flex flex-col items-center justify-center p-6 rounded-lg border-2"
            style={{
              borderColor: hexToRgba(theme.colors.primary, 0.3),
              backgroundColor: hexToRgba(theme.colors.background, 0.5),
            }}
          >
            <div
              ref={qrContainerRef}
              className="p-4 rounded-lg"
              style={{
                backgroundColor: bgColor,
              }}
            >
              <QRCodeSVG
                value={text}
                size={size}
                level={errorLevel}
                fgColor={fgColor}
                bgColor={bgColor}
                includeMargin={includeMargin}
              />
            </div>
            <p
              className="mt-4 text-sm font-mono text-center max-w-md"
              style={{ color: theme.colors.foreground, opacity: 0.7 }}
            >
              {text.length > 100 ? `${text.substring(0, 100)}...` : text}
            </p>
          </div>
        </Card>
      )}

      {!text && (
        <Card variant="outlined" className="p-6">
          <div className="text-center">
            <QrCode
              className="w-16 h-16 mx-auto mb-4"
              style={{ color: theme.colors.primary, opacity: 0.3 }}
            />
            <p
              className="text-sm font-mono"
              style={{ color: theme.colors.foreground, opacity: 0.7 }}
            >
              Enter text or URL above to generate a QR code
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
