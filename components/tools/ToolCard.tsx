'use client';

import { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ToolCardProps {
  title: string;
  description: string;
  icon?: ReactNode;
  status: 'available' | 'coming-soon';
  onClick?: () => void;
}

export default function ToolCard({ title, description, icon, status, onClick }: ToolCardProps) {
  return (
    <Card
      variant="hacker"
      className={`p-6 cursor-pointer transition-all duration-300 hover:scale-105 ${
        status === 'coming-soon' ? 'opacity-60' : ''
      }`}
      onClick={status === 'available' ? onClick : undefined}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-start gap-4 mb-4">
          {icon && (
            <div className="text-green-500 flex-shrink-0">
              {icon}
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-green-500 smooch-sans font-effect-anaglyph mb-2">
              {title}
            </h3>
            <p className="text-sm text-green-500/70 font-mono">
              {description}
            </p>
          </div>
        </div>
        
        <div className="mt-auto">
          {status === 'coming-soon' ? (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-yellow-500/10 border border-yellow-500 text-yellow-500 rounded-full text-xs font-mono font-medium">
                COMING SOON
              </span>
            </div>
          ) : (
            <Button variant="primary" size="sm" className="w-full">
              USE TOOL
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

