"use client";

import { useState, useRef } from "react";
import { gsap } from "gsap";
import { File, Upload, X, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { detectFileType, type FileType, isSupportedFileType } from "@/lib/file-type-detector";
import XLSXViewer from "./viewers/XLSXViewer";
import TextViewer from "./viewers/TextViewer";

export default function FileViewer() {
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
            <p className="text-green-500/70 font-mono text-center py-8">
              CSV viewer coming soon
            </p>
          </Card>
        );
      case "json":
        return (
          <Card variant="hacker" className="p-6">
            <p className="text-green-500/70 font-mono text-center py-8">
              JSON viewer coming soon
            </p>
          </Card>
        );
      case "txt":
        return <TextViewer file={selectedFile} onClear={handleClear} />;
      case "pdf":
        return (
          <Card variant="hacker" className="p-6">
            <p className="text-green-500/70 font-mono text-center py-8">
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
          <File className="w-12 h-12 text-green-500" />
          <h1 className="text-4xl font-bold text-green-500 smooch-sans font-effect-anaglyph tracking-wider">
            File Viewer
          </h1>
        </div>
        <p className="text-lg text-green-500/70 font-mono">
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
            <Button
              variant="outline"
              onClick={handleClear}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear
            </Button>
          )}
        </div>

        {selectedFile && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-500 font-mono">
                  <span className="font-semibold">File:</span> {selectedFile.name}
                </p>
                <p className="text-xs text-green-500/70 font-mono mt-1">
                  <span className="font-semibold">Type:</span>{" "}
                  {detectFileType(selectedFile).description} (Auto-detected)
                </p>
              </div>
              <FileQuestion className="w-5 h-5 text-green-500/50" />
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded">
            <p className="text-sm text-red-500 font-mono">{error}</p>
          </div>
        )}
      </Card>

      {selectedFile && (
        <div ref={containerRef} className="w-full">
          {renderViewer()}
        </div>
      )}

      {!selectedFile && (
        <Card variant="hacker" className="p-12 text-center">
          <File className="w-16 h-16 text-green-500/30 mx-auto mb-4" />
          <p className="text-green-500/70 font-mono mb-2">
            Upload a file to get started
          </p>
          <p className="text-sm text-green-500/50 font-mono">
            Supported: XLSX, XLS, CSV, JSON, TXT, PDF (Auto-detected)
          </p>
        </Card>
      )}
    </div>
  );
}
