"use client";

import { Globe, GitCompare, FileCode, Cookie, Key, Clock, File, QrCode } from "lucide-react";
import type { Tool } from "@/components/tools/ToolLibrary";

export const allTools: Tool[] = [
  {
    id: "web-check",
    title: "Web Check",
    description: "Analyze websites for security, performance, and technology stack",
    icon: <Globe className="w-10 h-10" />,
    status: "available",
    route: "/tools/web-check",
  },
  {
    id: "text-compare",
    title: "Text Compare",
    description: "Compare two texts and highlight differences with multiple options",
    icon: <GitCompare className="w-10 h-10" />,
    status: "available",
    route: "/tools/text-compare",
  },
  {
    id: "json-linter",
    title: "JSON Linter",
    description: "Validate, format, and lint JSON with syntax error detection",
    icon: <FileCode className="w-10 h-10" />,
    status: "available",
    route: "/tools/json-linter",
  },
  {
    id: "cookie-inspector",
    title: "Cookie Inspector",
    description: "Parse, inspect, and analyze browser cookies with detailed attributes",
    icon: <Cookie className="w-10 h-10" />,
    status: "available",
    route: "/tools/cookie-inspector",
  },
  {
    id: "jwt-viewer",
    title: "JWT Viewer",
    description: "Decode and view JWT tokens with header, payload, and signature details",
    icon: <Key className="w-10 h-10" />,
    status: "available",
    route: "/tools/jwt-viewer",
  },
  {
    id: "time-date-converter",
    title: "Time & Date Converter",
    description:
      "Convert between Unix timestamp, ISO 8601, and local formats with timezone support",
    icon: <Clock className="w-10 h-10" />,
    status: "available",
    route: "/tools/time-date-converter",
  },
  {
    id: "file-viewer",
    title: "File Viewer",
    description:
      "View and analyze various file types (XLSX, CSV, JSON, TXT, PDF) with auto-detection",
    icon: <File className="w-10 h-10" />,
    status: "available",
    route: "/tools/file-viewer",
  },
  {
    id: "qr-code-generator",
    title: "QR Code Generator",
    description:
      "Create QR codes from text or URLs with customizable size, colors, and error correction",
    icon: <QrCode className="w-10 h-10" />,
    status: "available",
    route: "/tools/qr-code-generator",
  },
];
