'use client';

import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Globe, FileText, Image, FileEdit, BarChart, Code, ArrowLeft, GitCompare, FileCode, Cookie, Key } from 'lucide-react';
import ToolCard from './ToolCard';
import WebCheck from './WebCheck';
import TextCompare from './TextCompare';
import JSONLinter from './JSONLinter';
import CookieInspector from './CookieInspector';
import JWTViewer from './JWTViewer';
import { Button } from '@/components/ui/Button';

const tools = [
  {
    id: 'web-check',
    title: 'Web Check',
    description: 'Analyze websites for security, performance, and technology stack',
    icon: <Globe className="w-10 h-10" />,
    status: 'available' as const
  },
  {
    id: 'text-compare',
    title: 'Text Compare',
    description: 'Compare two texts and highlight differences with multiple options',
    icon: <GitCompare className="w-10 h-10" />,
    status: 'available' as const
  },
  {
    id: 'json-linter',
    title: 'JSON Linter',
    description: 'Validate, format, and lint JSON with syntax error detection',
    icon: <FileCode className="w-10 h-10" />,
    status: 'available' as const
  },
  {
    id: 'cookie-inspector',
    title: 'Cookie Inspector',
    description: 'Parse, inspect, and analyze browser cookies with detailed attributes',
    icon: <Cookie className="w-10 h-10" />,
    status: 'available' as const
  },
  {
    id: 'jwt-viewer',
    title: 'JWT Viewer',
    description: 'Decode and view JWT tokens with header, payload, and signature details',
    icon: <Key className="w-10 h-10" />,
    status: 'available' as const
  },
  {
    id: 'image-editor',
    title: 'Image Editor',
    description: 'Edit and enhance images with professional tools',
    icon: <Image className="w-10 h-10" />,
    status: 'coming-soon' as const
  },
  {
    id: 'text-formatter',
    title: 'Text Formatter',
    description: 'Format and clean text documents',
    icon: <FileEdit className="w-10 h-10" />,
    status: 'coming-soon' as const
  },
  {
    id: 'data-analyzer',
    title: 'Data Analyzer',
    description: 'Analyze and visualize data from various sources',
    icon: <BarChart className="w-10 h-10" />,
    status: 'coming-soon' as const
  },
  {
    id: 'code-formatter',
    title: 'Code Formatter',
    description: 'Format and beautify code in multiple languages',
    icon: <Code className="w-10 h-10" />,
    status: 'coming-soon' as const
  }
];

export default function ToolsDashboard() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardsRef.current && !selectedTool) {
      const cards = cardsRef.current.children;
      gsap.fromTo(
        Array.from(cards),
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
      );
    }
  }, [selectedTool]);

  const handleToolClick = (toolId: string) => {
    if (toolId === 'web-check' || toolId === 'text-compare' || toolId === 'json-linter' || toolId === 'cookie-inspector' || toolId === 'jwt-viewer') {
      setSelectedTool(toolId);
    }
  };

  const handleBack = () => {
    setSelectedTool(null);
  };

  if (selectedTool === 'web-check') {
    return (
      <div className="w-full">
        <Button
          onClick={handleBack}
          variant="outline"
          size="sm"
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tools
        </Button>
        <WebCheck />
      </div>
    );
  }

  if (selectedTool === 'text-compare') {
    return (
      <div className="w-full">
        <Button
          onClick={handleBack}
          variant="outline"
          size="sm"
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tools
        </Button>
        <TextCompare />
      </div>
    );
  }

  if (selectedTool === 'json-linter') {
    return (
      <div className="w-full">
        <Button
          onClick={handleBack}
          variant="outline"
          size="sm"
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tools
        </Button>
        <JSONLinter />
      </div>
    );
  }

  if (selectedTool === 'cookie-inspector') {
    return (
      <div className="w-full">
        <Button
          onClick={handleBack}
          variant="outline"
          size="sm"
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tools
        </Button>
        <CookieInspector />
      </div>
    );
  }

  if (selectedTool === 'jwt-viewer') {
    return (
      <div className="w-full">
        <Button
          onClick={handleBack}
          variant="outline"
          size="sm"
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tools
        </Button>
        <JWTViewer />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-green-500 smooch-sans font-effect-anaglyph tracking-wider mb-4">
          OXsuite Tools
        </h1>
        <p className="text-lg text-green-500/70 font-mono max-w-2xl mx-auto">
          {'>'} Professional tools for daily use. Choose a tool to get started or explore what's coming soon.
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
            onClick={() => handleToolClick(tool.id)}
          />
        ))}
      </div>
    </div>
  );
}

