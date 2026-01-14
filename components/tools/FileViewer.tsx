"use client";

import { useState, useRef } from "react";
import { gsap } from "gsap";
import { File, Upload, X, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useTheme } from "@/components/ui/ThemeProvider";
import { hexToRgba } from "@/lib/color-utils";
import { detectFileType, type FileType, isSupportedFileType } from "@/lib/file-type-detector";
import XLSXViewer from "./viewers/XLSXViewer";
import TextViewer from "./viewers/TextViewer";

export default function FileViewer() {
  const { theme } = useTheme();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<FileType | null>(null);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    const detected = detectFileType(file);
    setFileType(detected.type);

    if (!isSupportedFileType(detected.type)) {
      setError(
        `File type "${detected.description}" is not yet supported. Supported types: XLSX, XLS, CSV, JSON, TXT, PDF`
      );
      return;
    }

    setSelectedFile(file);

    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
      );
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setFileType(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const renderViewer = () => {
    if (!selectedFile || !fileType) return null;

    switch (fileType) {
      case "xlsx":
      case "xls":
        return <XLSXViewer file={selectedFile} onClear={handleClear} />;
      case "csv":
        return (
          <Card variant="hacker" className="p-6">
            <p
              className="font-mono text-center py-8"
              style={{ color: theme.colors.foreground, opacity: 0.7 }}
            >
              CSV viewer coming soon
            </p>
          </Card>
        );
      case "json":
        return (
          <Card variant="hacker" className="p-6">
            <p
              className="font-mono text-center py-8"
              style={{ color: theme.colors.foreground, opacity: 0.7 }}
            >
              JSON viewer coming soon
            </p>
          </Card>
        );
      case "txt":
        return <TextViewer file={selectedFile} onClear={handleClear} />;
      case "pdf":
        return (
          <Card variant="hacker" className="p-6">
            <p
              className="font-mono text-center py-8"
              style={{ color: theme.colors.foreground, opacity: 0.7 }}
            >
              PDF viewer coming soon
            </p>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <File className="w-12 h-12" style={{ color: theme.colors.primary }} />
          <h1
            className="text-4xl font-bold smooch-sans font-effect-anaglyph tracking-wider"
            style={{ color: theme.colors.primary }}
          >
            File Viewer
          </h1>
        </div>
        <p className="text-lg font-mono" style={{ color: theme.colors.foreground, opacity: 0.7 }}>
          {">"} Upload and view various file types with auto-detection
        </p>
      </div>

      <Card variant="hacker" className="p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.json,.txt,.pdf"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button
                variant="primary"
                className="w-full md:w-auto cursor-pointer flex items-center gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4" />
                Upload File
              </Button>
            </label>
          </div>

          {selectedFile && (
            <Button variant="outline" onClick={handleClear} className="flex items-center gap-2">
              <X className="w-4 h-4" />
              Clear
            </Button>
          )}
        </div>

        {selectedFile && (
          <div
            className="mt-4 p-3 border rounded"
            style={{
              backgroundColor: `${theme.colors.primary}1a`,
              borderColor: `${theme.colors.primary}4d`,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-mono" style={{ color: theme.colors.primary }}>
                  <span className="font-semibold">File:</span> {selectedFile.name}
                </p>
                <p
                  className="text-xs font-mono mt-1"
                  style={{ color: theme.colors.foreground, opacity: 0.7 }}
                >
                  <span className="font-semibold">Type:</span>{" "}
                  {detectFileType(selectedFile).description} (Auto-detected)
                </p>
              </div>
              <FileQuestion
                className="w-5 h-5"
                style={{ color: theme.colors.primary, opacity: 0.5 }}
              />
            </div>
          </div>
        )}

        {error && (
          <div
            className="mt-4 p-3 border rounded"
            style={{
              backgroundColor: hexToRgba(theme.colors.accent, 0.1),
              borderColor: hexToRgba(theme.colors.accent, 0.3),
            }}
          >
            <p className="text-sm font-mono" style={{ color: theme.colors.accent }}>
              {error}
            </p>
          </div>
        )}

        <div
          className="mt-4 p-3 border rounded"
          style={{
            backgroundColor: `${theme.colors.primary}0a`,
            borderColor: `${theme.colors.border}`,
          }}
        >
          <p className="text-xs font-mono" style={{ color: theme.colors.foreground, opacity: 0.8 }}>
            <span className="font-semibold" style={{ color: theme.colors.primary }}>
              NOTE:
            </span>{" "}
            Currently supporting: <strong>XLSX, XLS, TXT</strong>. CSV, JSON, and PDF viewers coming
            soon.
          </p>
        </div>
      </Card>

      {selectedFile && (
        <div ref={containerRef} className="w-full">
          {renderViewer()}
        </div>
      )}

      {!selectedFile && (
        <Card variant="hacker" className="p-12 text-center">
          <File
            className="w-16 h-16 mx-auto mb-4"
            style={{ color: theme.colors.primary, opacity: 0.3 }}
          />
          <p className="font-mono mb-2" style={{ color: theme.colors.foreground, opacity: 0.7 }}>
            Upload a file to get started
          </p>
          <p
            className="text-sm font-mono mb-2"
            style={{ color: theme.colors.foreground, opacity: 0.8 }}
          >
            <span className="font-semibold" style={{ color: theme.colors.primary }}>
              Currently supported:
            </span>{" "}
            XLSX, XLS, TXT
          </p>
          <p className="text-xs font-mono" style={{ color: theme.colors.foreground, opacity: 0.6 }}>
            CSV, JSON, and PDF viewers coming soon
          </p>
        </Card>
      )}
    </div>
  );
}
