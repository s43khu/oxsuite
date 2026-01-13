"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { gsap } from "gsap";
import {
  Clock,
  RotateCcw,
  Copy,
  CheckCircle,
  XCircle,
  ArrowRightLeft,
  Globe,
  ChevronDown,
  Search,
  Plus,
  X,
  GitCompare,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useTheme } from "@/components/ui/ThemeProvider";
import timezonesData from "@/lib/timezones.json";
import { hexToRgba } from "@/lib/color-utils";

interface ConvertedDate {
  unix: number;
  unixMs: number;
  iso: string;
  local: string;
  utc: string;
  timezone: string;
  formatted: {
    date: string;
    time: string;
    dayOfWeek: string;
  };
}

interface TimezoneEntry {
  value: string;
  abbr: string;
  offset: number;
  isdst: boolean;
  text: string;
  utc: string[];
}

const getAllTimezones = (): string[] => {
  const timezones = timezonesData as TimezoneEntry[];
  const allUtcTimezones = new Set<string>();

  allUtcTimezones.add("UTC");

  timezones.forEach((entry) => {
    if (entry.utc && Array.isArray(entry.utc)) {
      entry.utc.forEach((tz) => {
        if (tz && tz.trim()) {
          allUtcTimezones.add(tz.trim());
        }
      });
    }
  });

  return Array.from(allUtcTimezones).sort();
};

const getTimezoneDisplayName = (timezone: string): string => {
  const timezones = timezonesData as TimezoneEntry[];
  const entry = timezones.find((e) => e.utc && e.utc.includes(timezone));
  if (entry) {
    return `${entry.text} (${timezone})`;
  }
  return timezone;
};

const getTimezoneEntry = (timezone: string): TimezoneEntry | undefined => {
  const timezones = timezonesData as TimezoneEntry[];
  return timezones.find((e) => e.utc && e.utc.includes(timezone));
};

const searchTimezones = (searchTerm: string, allTimezones: string[]): string[] => {
  if (!searchTerm.trim()) {
    return allTimezones;
  }

  const searchLower = searchTerm.toLowerCase().trim();
  const timezones = timezonesData as TimezoneEntry[];

  return allTimezones.filter((tz) => {
    const tzLower = tz.toLowerCase();
    if (tzLower.includes(searchLower)) {
      return true;
    }

    const entry = getTimezoneEntry(tz);
    if (entry) {
      const textLower = entry.text.toLowerCase();
      const valueLower = entry.value.toLowerCase();
      const abbrLower = entry.abbr.toLowerCase();

      if (
        textLower.includes(searchLower) ||
        valueLower.includes(searchLower) ||
        abbrLower.includes(searchLower)
      ) {
        return true;
      }

      const cities = textLower.match(/\([^)]+\)\s*(.+)/);
      if (cities && cities[1]) {
        const cityNames = cities[1].split(/[,\s]+/).filter((c) => c.length > 0);
        return cityNames.some((city) => city.includes(searchLower));
      }
    }

    return false;
  });
};

export default function TimeDateConverter() {
  const { theme } = useTheme();
  const [inputValue, setInputValue] = useState("");
  const [inputType, setInputType] = useState<"unix" | "iso" | "local">("unix");
  const [targetTimezone, setTargetTimezone] = useState("UTC");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isTimezoneOpen, setIsTimezoneOpen] = useState(false);
  const [timezoneSearch, setTimezoneSearch] = useState("");
  const [allTimezones] = useState<string[]>(() => getAllTimezones());
  const [comparisonTimezones, setComparisonTimezones] = useState<string[]>([]);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [comparisonSearch, setComparisonSearch] = useState("");
  const [liveUpdate, setLiveUpdate] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const resultRef = useRef<HTMLDivElement>(null);
  const timezoneDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const comparisonDropdownRef = useRef<HTMLDivElement>(null);
  const comparisonSearchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        timezoneDropdownRef.current &&
        !timezoneDropdownRef.current.contains(event.target as Node)
      ) {
        setIsTimezoneOpen(false);
        setTimezoneSearch("");
      }
      if (
        comparisonDropdownRef.current &&
        !comparisonDropdownRef.current.contains(event.target as Node)
      ) {
        setIsComparisonOpen(false);
        setComparisonSearch("");
      }
    };

    if (isTimezoneOpen || isComparisonOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      if (isTimezoneOpen && searchInputRef.current) {
        searchInputRef.current.focus();
      }
      if (isComparisonOpen && comparisonSearchRef.current) {
        comparisonSearchRef.current.focus();
      }
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isTimezoneOpen, isComparisonOpen]);

  const filteredTimezones = useMemo(
    () => searchTimezones(timezoneSearch, allTimezones),
    [allTimezones, timezoneSearch]
  );

  const filteredComparisonTimezones = useMemo(
    () =>
      searchTimezones(comparisonSearch, allTimezones).filter(
        (tz) => tz !== targetTimezone && !comparisonTimezones.includes(tz)
      ),
    [allTimezones, comparisonSearch, targetTimezone, comparisonTimezones]
  );

  const addComparisonTimezone = useCallback(
    (tz: string) => {
      if (!comparisonTimezones.includes(tz) && tz !== targetTimezone) {
        setComparisonTimezones((prev) => [...prev, tz]);
        setIsComparisonOpen(false);
        setComparisonSearch("");
      }
    },
    [comparisonTimezones, targetTimezone]
  );

  const removeComparisonTimezone = useCallback((tz: string) => {
    setComparisonTimezones((prev) => prev.filter((t) => t !== tz));
  }, []);

  const parseInput = (value: string, type: "unix" | "iso" | "local"): Date | null => {
    if (!value.trim()) return null;

    try {
      if (type === "unix") {
        const timestamp = value.includes(".") ? parseFloat(value) : parseInt(value, 10);
        if (isNaN(timestamp)) return null;
        return timestamp > 1e12 ? new Date(timestamp) : new Date(timestamp * 1000);
      }

      if (type === "iso") {
        return new Date(value);
      }

      if (type === "local") {
        return new Date(value);
      }

      return null;
    } catch {
      return null;
    }
  };

  const formatDateInTimezone = (date: Date, timezone: string): { date: string; time: string } => {
    try {
      const dateFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const timeFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      return {
        date: dateFormatter.format(date),
        time: timeFormatter.format(date),
      };
    } catch {
      return {
        date: date.toLocaleDateString("en-US"),
        time: date.toLocaleTimeString("en-US", { hour12: false }),
      };
    }
  };

  const getDayOfWeek = (date: Date, timezone: string): string => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        weekday: "long",
      }).format(date);
    } catch {
      return date.toLocaleDateString("en-US", { weekday: "long" });
    }
  };

  const parsedDate = useMemo(() => {
    if (!inputValue.trim()) return null;
    return parseInput(inputValue, inputType);
  }, [inputValue, inputType]);

  const error = useMemo(() => {
    if (!inputValue.trim()) {
      return null;
    }
    if (!parsedDate || isNaN(parsedDate.getTime())) {
      return `Invalid ${inputType.toUpperCase()} format`;
    }
    return null;
  }, [inputValue, inputType, parsedDate]);

  const convertedDate = useMemo(() => {
    if (!parsedDate || isNaN(parsedDate.getTime())) {
      return null;
    }

    try {
      const unixSeconds = Math.floor(parsedDate.getTime() / 1000);
      const unixMs = parsedDate.getTime();
      const iso = parsedDate.toISOString();
      const local = parsedDate.toLocaleString();
      const utc = parsedDate.toUTCString();

      const targetFormatted = formatDateInTimezone(parsedDate, targetTimezone);

      return {
        unix: unixSeconds,
        unixMs,
        iso,
        local,
        utc,
        timezone: targetTimezone,
        formatted: {
          date: targetFormatted.date,
          time: targetFormatted.time,
          dayOfWeek: getDayOfWeek(parsedDate, targetTimezone),
        },
      };
    } catch {
      return null;
    }
  }, [parsedDate, targetTimezone]);

  const comparisonTimes = useMemo(() => {
    if (!parsedDate || isNaN(parsedDate.getTime()) || comparisonTimezones.length === 0) {
      return [];
    }

    return comparisonTimezones.map((tz) => {
      const formatted = formatDateInTimezone(parsedDate, tz);
      return {
        timezone: tz,
        date: formatted.date,
        time: formatted.time,
        dayOfWeek: getDayOfWeek(parsedDate, tz),
      };
    });
  }, [parsedDate, comparisonTimezones]);

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // NOTE: Copy failed silently
    }
  };

  const handleReset = () => {
    setInputValue("");
    setInputType("unix");
    setTargetTimezone("UTC");
    setCopiedField(null);
    setComparisonTimezones([]);
  };

  useEffect(() => {
    if (liveUpdate) {
      const interval = setInterval(() => {
        const now = new Date();
        setCurrentTime(now);
        setInputValue(Math.floor(now.getTime() / 1000).toString());
        setInputType("unix");
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [liveUpdate]);

  return (
    <div
      className="w-full max-w-7xl mx-auto p-6 space-y-6 min-h-screen"
      style={{ backgroundColor: theme.colors.background }}
    >
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Clock className="w-12 h-12 animate-pulse" style={{ color: theme.colors.primary }} />
          <h1
            className="text-5xl font-bold smooch-sans font-effect-anaglyph tracking-wider"
            style={{ color: theme.colors.primary }}
          >
            TIME & DATE CONVERTER
          </h1>
        </div>
        <p className="font-mono text-sm" style={{ color: theme.colors.foreground, opacity: 0.7 }}>
          {">"} Convert between Unix timestamp, ISO 8601, and local formats with timezone support
        </p>
      </div>

      <Card className="p-6" variant="hacker">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="font-mono text-sm" style={{ color: theme.colors.primary }}>
                INPUT TYPE
              </label>
              <div className="flex gap-2">
                <Button
                  onClick={() => setInputType("unix")}
                  variant={inputType === "unix" ? "primary" : "outline"}
                  size="sm"
                  className="flex-1 font-mono"
                >
                  UNIX
                </Button>
                <Button
                  onClick={() => setInputType("iso")}
                  variant={inputType === "iso" ? "primary" : "outline"}
                  size="sm"
                  className="flex-1 font-mono"
                >
                  ISO
                </Button>
                <Button
                  onClick={() => setInputType("local")}
                  variant={inputType === "local" ? "primary" : "outline"}
                  size="sm"
                  className="flex-1 font-mono"
                >
                  LOCAL
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-mono text-sm" style={{ color: theme.colors.primary }}>
                TARGET TIMEZONE
              </label>
              <div ref={timezoneDropdownRef} className="relative w-full">
                <button
                  type="button"
                  onClick={() => {
                    setIsTimezoneOpen(!isTimezoneOpen);
                    if (!isTimezoneOpen) {
                      setTimezoneSearch("");
                    }
                  }}
                  className="w-full border-2 px-3 py-1.5 rounded font-mono text-sm focus:outline-none flex items-center justify-between transition-colors"
                  style={{
                    backgroundColor: theme.colors.background,
                    borderColor: hexToRgba(theme.colors.primary, 0.5),
                    color: theme.colors.primary,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = hexToRgba(theme.colors.primary, 0.5);
                  }}
                >
                  <span className="truncate">{getTimezoneDisplayName(targetTimezone)}</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform flex-shrink-0 ml-2 ${
                      isTimezoneOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isTimezoneOpen && (
                  <div
                    className="absolute z-50 w-full mt-1 border-2 rounded font-mono text-sm"
                    style={{
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.primary,
                    }}
                  >
                    <div
                      className="p-2 border-b"
                      style={{ borderColor: hexToRgba(theme.colors.primary, 0.3) }}
                    >
                      <div className="relative">
                        <Search
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                          style={{ color: theme.colors.primary, opacity: 0.7 }}
                        />
                        <Input
                          ref={searchInputRef}
                          type="text"
                          placeholder="Search timezone..."
                          value={timezoneSearch}
                          onChange={(e) => setTimezoneSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-1.5 text-sm"
                        />
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {filteredTimezones.length > 0 ? (
                        filteredTimezones.map((tz) => (
                          <button
                            key={tz}
                            type="button"
                            onClick={() => {
                              setTargetTimezone(tz);
                              setIsTimezoneOpen(false);
                              setTimezoneSearch("");
                            }}
                            className="w-full text-left px-3 py-2 transition-colors"
                            style={{
                              backgroundColor:
                                targetTimezone === tz
                                  ? hexToRgba(theme.colors.primary, 0.3)
                                  : "transparent",
                              color:
                                targetTimezone === tz ? theme.colors.accent : theme.colors.primary,
                            }}
                            onMouseEnter={(e) => {
                              if (targetTimezone !== tz) {
                                e.currentTarget.style.backgroundColor = hexToRgba(
                                  theme.colors.primary,
                                  0.2
                                );
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (targetTimezone !== tz) {
                                e.currentTarget.style.backgroundColor = "transparent";
                              }
                            }}
                          >
                            <div className="flex flex-col">
                              <span className="text-sm">{getTimezoneDisplayName(tz)}</span>
                              <span className="text-xs" style={{ color: theme.colors.foreground, opacity: 0.5 }}>
                                {tz}
                              </span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-4 text-center text-sm" style={{ color: theme.colors.foreground, opacity: 0.5 }}>
                          No timezones found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-mono text-sm" style={{ color: theme.colors.primary }}>
                ACTIONS
              </label>
              <div className="flex gap-2">
                <Button
                  onClick={() => setLiveUpdate(!liveUpdate)}
                  variant={liveUpdate ? "primary" : "outline"}
                  size="sm"
                  className="flex-1 font-mono"
                >
                  {liveUpdate ? "LIVE ON" : "LIVE OFF"}
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  size="sm"
                  className="flex-1 font-mono"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-mono text-sm" style={{ color: theme.colors.primary }}>
              {inputType.toUpperCase()} INPUT
            </label>
            <Input
              type="text"
              placeholder={
                inputType === "unix"
                  ? "Enter Unix timestamp (seconds or milliseconds)"
                  : inputType === "iso"
                    ? "Enter ISO 8601 date (e.g., 2024-01-15T10:30:00Z)"
                    : "Enter local date (e.g., 01/15/2024 10:30:00)"
              }
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="font-mono"
            />
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border-2 border-red-500 rounded-lg">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <p className="text-red-500 font-mono">{error}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6" variant="hacker">
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-xl font-bold smooch-sans font-effect-anaglyph flex items-center gap-2"
            style={{ color: theme.colors.primary }}
          >
            <GitCompare className="w-5 h-5" />
            TIME COMPARISON
          </h2>
          <div ref={comparisonDropdownRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setIsComparisonOpen(!isComparisonOpen);
                if (!isComparisonOpen) {
                  setComparisonSearch("");
                }
              }}
              className="border-2 px-3 py-1.5 rounded font-mono text-sm transition-colors flex items-center gap-2"
              style={{
                backgroundColor: hexToRgba(theme.colors.primary, 0.2),
                borderColor: hexToRgba(theme.colors.primary, 0.5),
                color: theme.colors.primary,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = theme.colors.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = hexToRgba(theme.colors.primary, 0.5);
              }}
            >
              <Plus className="w-4 h-4" />
              ADD TIMEZONE
            </button>
            {isComparisonOpen && (
              <div
                className="absolute z-50 right-0 mt-1 w-80 border-2 rounded font-mono text-sm"
                style={{
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.primary,
                }}
              >
                <div
                  className="p-2 border-b"
                  style={{ borderColor: hexToRgba(theme.colors.primary, 0.3) }}
                >
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                      style={{ color: theme.colors.primary, opacity: 0.7 }}
                    />
                    <Input
                      ref={comparisonSearchRef}
                      type="text"
                      placeholder="Search timezone..."
                      value={comparisonSearch}
                      onChange={(e) => setComparisonSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-sm"
                    />
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {filteredComparisonTimezones.length > 0 ? (
                    filteredComparisonTimezones.map((tz) => (
                      <button
                        key={tz}
                        type="button"
                        onClick={() => addComparisonTimezone(tz)}
                        className="w-full text-left px-3 py-2 transition-colors"
                        style={{ color: theme.colors.primary }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = hexToRgba(theme.colors.primary, 0.2);
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm">{getTimezoneDisplayName(tz)}</span>
                          <span className="text-xs" style={{ color: theme.colors.foreground, opacity: 0.5 }}>
                            {tz}
                          </span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-center text-sm" style={{ color: theme.colors.foreground, opacity: 0.5 }}>
                      No timezones found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {comparisonTimezones.length > 0 && comparisonTimes.length > 0 && convertedDate ? (
          <div className="space-y-3">
            {comparisonTimes.map((comp) => (
              <div
                key={comp.timezone}
                className="border-2 rounded-lg p-4"
                style={{
                  backgroundColor: hexToRgba(theme.colors.primary, 0.1),
                  borderColor: hexToRgba(theme.colors.primary, 0.5),
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-mono font-semibold text-sm mb-1" style={{ color: theme.colors.accent }}>
                      {getTimezoneDisplayName(comp.timezone)}
                    </div>
                    <div className="font-mono text-xs" style={{ color: theme.colors.foreground, opacity: 0.5 }}>
                      {comp.timezone}
                    </div>
                  </div>
                  <button
                    onClick={() => removeComparisonTimezone(comp.timezone)}
                    className="text-red-500 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div>
                    <div className="font-mono text-xs mb-1" style={{ color: theme.colors.foreground, opacity: 0.7 }}>
                      DATE
                    </div>
                    <div className="font-mono text-sm" style={{ color: theme.colors.accent }}>
                      {comp.date}
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-xs mb-1" style={{ color: theme.colors.foreground, opacity: 0.7 }}>
                      TIME
                    </div>
                    <div className="font-mono text-sm" style={{ color: theme.colors.accent }}>
                      {comp.time}
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-xs mb-1" style={{ color: theme.colors.foreground, opacity: 0.7 }}>
                      DAY
                    </div>
                    <div className="font-mono text-sm" style={{ color: theme.colors.accent }}>
                      {comp.dayOfWeek}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 font-mono text-sm" style={{ color: theme.colors.foreground, opacity: 0.5 }}>
            Click "ADD TIMEZONE" to compare this time across multiple timezones
          </div>
        )}
      </Card>

      <div ref={resultRef} className="space-y-6">
        <Card className="p-6" variant="hacker">
          <h2
            className="text-2xl font-bold smooch-sans font-effect-anaglyph mb-6 flex items-center gap-2"
            style={{ color: theme.colors.primary }}
          >
            <Globe className="w-6 h-6" />
            CONVERTED TO {targetTimezone}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div
              className="border-2 p-4 rounded-lg"
              style={{
                backgroundColor: hexToRgba(theme.colors.primary, 0.1),
                borderColor: theme.colors.primary,
              }}
            >
              <div className="font-mono text-xs mb-2" style={{ color: theme.colors.foreground, opacity: 0.7 }}>
                DATE
              </div>
              <div className="font-mono text-lg" style={{ color: theme.colors.accent }}>
                {convertedDate?.formatted.date || "—"}
              </div>
            </div>
            <div
              className="border-2 p-4 rounded-lg"
              style={{
                backgroundColor: hexToRgba(theme.colors.primary, 0.1),
                borderColor: theme.colors.primary,
              }}
            >
              <div className="font-mono text-xs mb-2" style={{ color: theme.colors.foreground, opacity: 0.7 }}>
                TIME
              </div>
              <div className="font-mono text-lg" style={{ color: theme.colors.accent }}>
                {convertedDate?.formatted.time || "—"}
              </div>
            </div>
            <div
              className="border-2 p-4 rounded-lg md:col-span-2"
              style={{
                backgroundColor: hexToRgba(theme.colors.primary, 0.1),
                borderColor: theme.colors.primary,
              }}
            >
              <div className="font-mono text-xs mb-2" style={{ color: theme.colors.foreground, opacity: 0.7 }}>
                DAY OF WEEK
              </div>
              <div className="font-mono text-lg" style={{ color: theme.colors.accent }}>
                {convertedDate?.formatted.dayOfWeek || "—"}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6" variant="hacker">
            <h3
              className="text-lg font-bold smooch-sans flex items-center gap-2 mb-4"
              style={{ color: theme.colors.primary }}
            >
              <Clock className="w-5 h-5" />
              UNIX TIMESTAMP
            </h3>
            <div className="space-y-3">
              <div>
                <div className="font-mono text-xs mb-1" style={{ color: theme.colors.foreground, opacity: 0.7 }}>
                  SECONDS
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="flex-1 border rounded p-3 font-mono break-all"
                    style={{
                      backgroundColor: hexToRgba(theme.colors.background, 0.5),
                      borderColor: hexToRgba(theme.colors.primary, 0.3),
                      color: theme.colors.accent,
                    }}
                  >
                    {convertedDate?.unix ?? "—"}
                  </div>
                  <Button
                    onClick={() =>
                      convertedDate && handleCopy(convertedDate.unix.toString(), "unix-seconds")
                    }
                    variant="outline"
                    size="sm"
                    className="font-mono"
                    disabled={!convertedDate}
                  >
                    {copiedField === "unix-seconds" ? (
                      <CheckCircle className="w-4 h-4" style={{ color: theme.colors.primary }} />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div>
                <div className="font-mono text-xs mb-1" style={{ color: theme.colors.foreground, opacity: 0.7 }}>
                  MILLISECONDS
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="flex-1 border rounded p-3 font-mono break-all"
                    style={{
                      backgroundColor: hexToRgba(theme.colors.background, 0.5),
                      borderColor: hexToRgba(theme.colors.primary, 0.3),
                      color: theme.colors.accent,
                    }}
                  >
                    {convertedDate?.unixMs ?? "—"}
                  </div>
                  <Button
                    onClick={() =>
                      convertedDate && handleCopy(convertedDate.unixMs.toString(), "unix-ms")
                    }
                    variant="outline"
                    size="sm"
                    className="font-mono"
                    disabled={!convertedDate}
                  >
                    {copiedField === "unix-ms" ? (
                      <CheckCircle className="w-4 h-4" style={{ color: theme.colors.primary }} />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6" variant="hacker">
            <h3
              className="text-lg font-bold smooch-sans flex items-center gap-2 mb-4"
              style={{ color: theme.colors.primary }}
            >
              <ArrowRightLeft className="w-5 h-5" />
              ISO 8601
            </h3>
            <div className="space-y-3">
              <div>
                <div className="font-mono text-xs mb-1" style={{ color: theme.colors.foreground, opacity: 0.7 }}>
                  ISO FORMAT
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="flex-1 border rounded p-3 font-mono break-all text-sm"
                    style={{
                      backgroundColor: hexToRgba(theme.colors.background, 0.5),
                      borderColor: hexToRgba(theme.colors.primary, 0.3),
                      color: theme.colors.accent,
                    }}
                  >
                    {convertedDate?.iso ?? "—"}
                  </div>
                  <Button
                    onClick={() => convertedDate && handleCopy(convertedDate.iso, "iso")}
                    variant="outline"
                    size="sm"
                    className="font-mono"
                    disabled={!convertedDate}
                  >
                    {copiedField === "iso" ? (
                      <CheckCircle className="w-4 h-4" style={{ color: theme.colors.primary }} />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6" variant="hacker">
            <h3
              className="text-lg font-bold smooch-sans flex items-center gap-2 mb-4"
              style={{ color: theme.colors.primary }}
            >
              <Globe className="w-5 h-5" />
              UTC
            </h3>
            <div className="space-y-3">
              <div>
                <div className="font-mono text-xs mb-1" style={{ color: theme.colors.foreground, opacity: 0.7 }}>
                  UTC FORMAT
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="flex-1 border rounded p-3 font-mono break-all text-sm"
                    style={{
                      backgroundColor: hexToRgba(theme.colors.background, 0.5),
                      borderColor: hexToRgba(theme.colors.primary, 0.3),
                      color: theme.colors.accent,
                    }}
                  >
                    {convertedDate?.utc ?? "—"}
                  </div>
                  <Button
                    onClick={() => convertedDate && handleCopy(convertedDate.utc, "utc")}
                    variant="outline"
                    size="sm"
                    className="font-mono"
                    disabled={!convertedDate}
                  >
                    {copiedField === "utc" ? (
                      <CheckCircle className="w-4 h-4" style={{ color: theme.colors.primary }} />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6" variant="hacker">
            <h3
              className="text-lg font-bold smooch-sans flex items-center gap-2 mb-4"
              style={{ color: theme.colors.primary }}
            >
              <Clock className="w-5 h-5" />
              LOCAL TIME
            </h3>
            <div className="space-y-3">
              <div>
                <div className="font-mono text-xs mb-1" style={{ color: theme.colors.foreground, opacity: 0.7 }}>
                  LOCAL FORMAT
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="flex-1 border rounded p-3 font-mono break-all text-sm"
                    style={{
                      backgroundColor: hexToRgba(theme.colors.background, 0.5),
                      borderColor: hexToRgba(theme.colors.primary, 0.3),
                      color: theme.colors.accent,
                    }}
                  >
                    {convertedDate?.local ?? "—"}
                  </div>
                  <Button
                    onClick={() => convertedDate && handleCopy(convertedDate.local, "local")}
                    variant="outline"
                    size="sm"
                    className="font-mono"
                    disabled={!convertedDate}
                  >
                    {copiedField === "local" ? (
                      <CheckCircle className="w-4 h-4" style={{ color: theme.colors.primary }} />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
