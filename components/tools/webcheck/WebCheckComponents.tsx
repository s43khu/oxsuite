"use client";

import { ReactNode } from "react";
import { CheckCircle, XCircle, LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useTheme } from "@/components/ui/ThemeProvider";

interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  className?: string;
}

export function SectionHeader({ icon: Icon, title, className = "" }: SectionHeaderProps) {
  const { theme } = useTheme();
  return (
    <h3
      className={`text-lg font-bold smooch-sans flex items-center gap-2 mb-4 ${className}`}
      style={{ color: theme.colors.primary }}
    >
      <Icon className="w-5 h-5" />
      {title}
    </h3>
  );
}

interface StatusIndicatorProps {
  enabled: boolean;
  label: string;
  description?: string;
  warning?: boolean;
}

export function StatusIndicator({
  enabled,
  label,
  description,
  warning = false,
}: StatusIndicatorProps) {
  const { theme } = useTheme();
  const Icon = enabled ? CheckCircle : XCircle;
  const iconColor = enabled ? theme.colors.primary : warning ? "#fbbf24" : "#ef4444";

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4" style={{ color: iconColor }} />
        <span className="font-semibold" style={{ color: theme.colors.accent }}>
          {label}
        </span>
      </div>
      {description && (
        <p className="text-xs ml-6" style={{ color: theme.colors.foreground, opacity: 0.6 }}>
          {description}
        </p>
      )}
    </div>
  );
}

interface KeyValueProps {
  label: string;
  value: ReactNode;
  className?: string;
}

export function KeyValue({ label, value, className = "" }: KeyValueProps) {
  const { theme } = useTheme();
  return (
    <div className={className}>
      <span style={{ color: theme.colors.foreground, opacity: 0.7 }}>{label}:</span>
      <span className="ml-2" style={{ color: theme.colors.accent }}>
        {value}
      </span>
    </div>
  );
}

interface InfoCardProps {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  className?: string;
}

export function InfoCard({ icon: Icon, title, children, className = "" }: InfoCardProps) {
  return (
    <Card className={`p-6 ${className}`} variant="hacker">
      <SectionHeader icon={Icon} title={title} />
      {children}
    </Card>
  );
}

interface DNSRecordListProps {
  label: string;
  records: any[];
  formatRecord?: (record: any, idx: number) => ReactNode;
}

export function DNSRecordList({ label, records, formatRecord }: DNSRecordListProps) {
  const { theme } = useTheme();

  if (!records || records.length === 0) return null;

  const defaultFormat = (record: any, idx: number) => (
    <div key={idx} className="text-xs break-all" style={{ color: theme.colors.accent }}>
      • {Array.isArray(record) ? record.join(" ") : String(record)}
    </div>
  );

  return (
    <div>
      <div className="mb-2 font-semibold" style={{ color: theme.colors.foreground, opacity: 0.7 }}>
        {label} ({records.length}):
      </div>
      <div className="space-y-1 ml-4">
        {records.map((record, idx) =>
          formatRecord ? formatRecord(record, idx) : defaultFormat(record, idx)
        )}
      </div>
    </div>
  );
}

interface BooleanStatusCardProps {
  icon: LucideIcon;
  title: string;
  enabled: boolean;
  enabledLabel?: string;
  disabledLabel?: string;
  enabledDescription?: string;
  disabledDescription?: string;
  additionalInfo?: ReactNode;
}

export function BooleanStatusCard({
  icon: Icon,
  title,
  enabled,
  enabledLabel = "Enabled",
  disabledLabel = "Not Enabled",
  enabledDescription,
  disabledDescription,
  additionalInfo,
}: BooleanStatusCardProps) {
  return (
    <InfoCard icon={Icon} title={title}>
      <div className="space-y-3 text-sm font-mono">
        <StatusIndicator
          enabled={enabled}
          label={enabled ? enabledLabel : disabledLabel}
          description={enabled ? enabledDescription : disabledDescription}
        />
        {additionalInfo}
      </div>
    </InfoCard>
  );
}

interface SimpleListProps {
  items: string[];
  className?: string;
}

export function SimpleList({ items, className = "" }: SimpleListProps) {
  const { theme } = useTheme();
  if (!items || items.length === 0) return null;

  return (
    <div className={`space-y-1 ${className}`}>
      {items.map((item, idx) => (
        <div key={idx} className="text-xs" style={{ color: theme.colors.accent }}>
          • {item}
        </div>
      ))}
    </div>
  );
}
