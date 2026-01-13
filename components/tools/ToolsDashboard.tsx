"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import {
  Globe,
  FileText,
  Image,
  FileEdit,
  BarChart,
  Code,
  GitCompare,
  FileCode,
  Cookie,
  Key,
  Clock,
  File,
} from "lucide-react";
import ToolCard from "./ToolCard";

const tools = [
  {
    id: "web-check",
    title: "Web Check",
    description: "Analyze websites for security, performance, and technology stack",
    icon: <Globe className="w-10 h-10" />,
    status: "available" as const,
    route: "/tools/web-check",
  },
  {
    id: "text-compare",
    title: "Text Compare",
    description: "Compare two texts and highlight differences with multiple options",
    icon: <GitCompare className="w-10 h-10" />,
    status: "available" as const,
    route: "/tools/text-compare",
  },
  {
    id: "json-linter",
    title: "JSON Linter",
    description: "Validate, format, and lint JSON with syntax error detection",
    icon: <FileCode className="w-10 h-10" />,
    status: "available" as const,
    route: "/tools/json-linter",
  },
  {
    id: "cookie-inspector",
    title: "Cookie Inspector",
    description: "Parse, inspect, and analyze browser cookies with detailed attributes",
    icon: <Cookie className="w-10 h-10" />,
    status: "available" as const,
    route: "/tools/cookie-inspector",
  },
  {
    id: "jwt-viewer",
    title: "JWT Viewer",
    description: "Decode and view JWT tokens with header, payload, and signature details",
    icon: <Key className="w-10 h-10" />,
    status: "available" as const,
    route: "/tools/jwt-viewer",
  },
  {
    id: "time-date-converter",
    title: "Time & Date Converter",
    description:
      "Convert between Unix timestamp, ISO 8601, and local formats with timezone support",
    icon: <Clock className="w-10 h-10" />,
    status: "available" as const,
    route: "/tools/time-date-converter",
  },
  {
    id: "file-viewer",
    title: "File Viewer",
    description: "View and analyze various file types (XLSX, CSV, JSON, TXT, PDF) with auto-detection",
    icon: <File className="w-10 h-10" />,
    status: "available" as const,
    route: "/tools/file-viewer",
  },
  {
    id: "image-editor",
    title: "Image Editor",
    description: "Edit and enhance images with professional tools",
    icon: <Image className="w-10 h-10" />,
    status: "coming-soon" as const,
    route: null,
  },
  {
    id: "text-formatter",
    title: "Text Formatter",
    description: "Format and clean text documents",
    icon: <FileEdit className="w-10 h-10" />,
    status: "coming-soon" as const,
    route: null,
  },
  {
    id: "data-analyzer",
    title: "Data Analyzer",
    description: "Analyze and visualize data from various sources",
    icon: <BarChart className="w-10 h-10" />,
    status: "coming-soon" as const,
    route: null,
  },
  {
    id: "code-formatter",
    title: "Code Formatter",
    description: "Format and beautify code in multiple languages",
    icon: <Code className="w-10 h-10" />,
    status: "coming-soon" as const,
    route: null,
  },
];

export default function ToolsDashboard() {
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardsRef.current) {
      const cards = cardsRef.current.children;
      gsap.fromTo(
        Array.from(cards),
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power3.out" }
      );
    }
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-green-500 smooch-sans font-effect-anaglyph tracking-wider mb-4">
          OXsuite Tools
        </h1>
        <p className="text-lg text-green-500/70 font-mono max-w-2xl mx-auto">
          {">"} Professional tools for daily use. Choose a tool to get started or explore what's
          coming soon.
        </p>
      </div>

      <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <ToolCard
            key={tool.id}
            title={tool.title}
            description={tool.description}
            icon={tool.icon}
            status={tool.status}
            route={tool.route}
          />
        ))}
      </div>
    </div>
  );
}
