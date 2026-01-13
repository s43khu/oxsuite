"use client";

import { useState, useRef, useEffect } from "react";
import { gsap } from "gsap";
import {
  Cookie,
  RotateCcw,
  Copy,
  Download,
  AlertCircle,
  Upload,
  File,
  CheckCircle,
  Trash2,
  Globe,
  Lock,
  RefreshCw,
  BarChart3,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useTheme } from "@/components/ui/ThemeProvider";
import { analyzeCookie, generateCookieSummary } from "@/lib/cookie-analyzer";
import { hexToRgba } from "@/lib/color-utils";

interface ParsedCookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: string;
  maxAge?: number;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
  size: number;
  rawValue?: string;
}

interface CookieStats {
  total: number;
  secure: number;
  httpOnly: number;
  thirdParty: number;
  totalSize: number;
}

export default function CookieInspector() {
  const { theme } = useTheme();
  const [cookieInput, setCookieInput] = useState("");
  const [parsedCookies, setParsedCookies] = useState<ParsedCookie[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractUrl, setExtractUrl] = useState("");
  const [stats, setStats] = useState<CookieStats | null>(null);
  const [cookieAnalyses, setCookieAnalyses] = useState<any[]>([]);
  const [cookieSummary, setCookieSummary] = useState<any>(null);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [invalidCookies, setInvalidCookies] = useState<
    Array<{ line: number; content: string; reason: string }>
  >([]);

  const resultRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (parsedCookies.length > 0 && resultRef.current) {
      gsap.fromTo(
        resultRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 }
      );
      calculateStats();
    }
  }, [parsedCookies]);

  const calculateStats = () => {
    if (parsedCookies.length === 0) {
      setStats(null);
      return;
    }

    const stats: CookieStats = {
      total: parsedCookies.length,
      secure: parsedCookies.filter((c) => c.secure).length,
      httpOnly: parsedCookies.filter((c) => c.httpOnly).length,
      thirdParty: parsedCookies.filter((c) => c.domain && c.domain.startsWith(".")).length,
      totalSize: parsedCookies.reduce((acc, c) => acc + c.size, 0),
    };

    setStats(stats);
  };

  const parseCookieString = (cookieString: string): ParsedCookie | null => {
    if (!cookieString.trim()) return null;

    if (cookieString.trim().startsWith("{")) {
      try {
        const jsonCookie = JSON.parse(cookieString);
        return {
          name: jsonCookie.name || jsonCookie.key || "",
          value: jsonCookie.value || "",
          domain: jsonCookie.domain,
          path: jsonCookie.path,
          expires: jsonCookie.expires || jsonCookie.expirationDate,
          secure: jsonCookie.secure || false,
          httpOnly: jsonCookie.httpOnly || false,
          sameSite: jsonCookie.sameSite,
          size: cookieString.length,
          rawValue: cookieString,
        };
      } catch {
        // Fall through to standard parsing
      }
    }

    const netscapeParts = cookieString.split("\t");
    if (netscapeParts.length >= 7) {
      return {
        name: netscapeParts[5],
        value: netscapeParts[6],
        domain: netscapeParts[0],
        path: netscapeParts[2],
        secure: netscapeParts[3] === "TRUE",
        expires: new Date(parseInt(netscapeParts[4]) * 1000).toISOString(),
        size: cookieString.length,
        rawValue: cookieString,
      };
    }

    const parts = cookieString.split(";").map((p) => p.trim());
    const [nameValue, ...attributes] = parts;

    if (!nameValue || !nameValue.includes("=")) {
      return null;
    }

    const [name, ...valueParts] = nameValue.split("=");
    const value = valueParts.join("=");

    const cookie: ParsedCookie = {
      name: name.trim(),
      value: value.trim(),
      size: cookieString.length,
      rawValue: cookieString,
    };

    attributes.forEach((attr) => {
      const [key, val] = attr.split("=").map((s) => s?.trim() || "");
      const lowerKey = key.toLowerCase();

      switch (lowerKey) {
        case "domain":
          cookie.domain = val;
          break;
        case "path":
          cookie.path = val;
          break;
        case "expires":
          cookie.expires = val;
          break;
        case "max-age":
          cookie.maxAge = parseInt(val, 10);
          break;
        case "secure":
          cookie.secure = true;
          break;
        case "httponly":
          cookie.httpOnly = true;
          break;
        case "samesite":
          cookie.sameSite = val as "Strict" | "Lax" | "None";
          break;
      }
    });

    return cookie;
  };

  const parseCookies = () => {
    if (!cookieInput.trim()) {
      setParsedCookies([]);
      setError(null);
      setInvalidCookies([]);
      return;
    }

    try {
      const lines = cookieInput.split("\n");
      const cookies: ParsedCookie[] = [];
      const invalid: Array<{ line: number; content: string; reason: string }> = [];

      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        if (trimmedLine.startsWith("#")) {
          return;
        }

        if (trimmedLine.startsWith("{")) {
          try {
            const jsonCookie = JSON.parse(trimmedLine);
            if (!jsonCookie.name && !jsonCookie.key) {
              invalid.push({
                line: index + 1,
                content: trimmedLine.substring(0, 50) + (trimmedLine.length > 50 ? "..." : ""),
                reason: "JSON cookie missing name or key field",
              });
              return;
            }
            const cookie = parseCookieString(trimmedLine);
            if (cookie) {
              cookies.push(cookie);
            } else {
              invalid.push({
                line: index + 1,
                content: trimmedLine.substring(0, 50) + (trimmedLine.length > 50 ? "..." : ""),
                reason: "Invalid JSON cookie format",
              });
            }
          } catch (jsonErr) {
            invalid.push({
              line: index + 1,
              content: trimmedLine.substring(0, 50) + (trimmedLine.length > 50 ? "..." : ""),
              reason:
                "Invalid JSON format: " +
                (jsonErr instanceof Error ? jsonErr.message : "Parse error"),
            });
          }
          return;
        }

        const cookie = parseCookieString(trimmedLine);
        if (cookie) {
          if (!cookie.name || cookie.name.trim() === "") {
            invalid.push({
              line: index + 1,
              content: trimmedLine.substring(0, 50) + (trimmedLine.length > 50 ? "..." : ""),
              reason: "Cookie name is missing or empty",
            });
            return;
          }
          if (cookie.name.includes(" ") || cookie.name.includes("\t")) {
            invalid.push({
              line: index + 1,
              content: trimmedLine.substring(0, 50) + (trimmedLine.length > 50 ? "..." : ""),
              reason: "Cookie name contains invalid characters (spaces or tabs)",
            });
            return;
          }
          cookies.push(cookie);
        } else {
          if (!trimmedLine.includes("=")) {
            invalid.push({
              line: index + 1,
              content: trimmedLine.substring(0, 50) + (trimmedLine.length > 50 ? "..." : ""),
              reason: "Missing equals sign (=) between name and value",
            });
          } else {
            invalid.push({
              line: index + 1,
              content: trimmedLine.substring(0, 50) + (trimmedLine.length > 50 ? "..." : ""),
              reason: "Invalid cookie format",
            });
          }
        }
      });

      setInvalidCookies(invalid);

      if (cookies.length === 0 && cookieInput.trim()) {
        setError("No valid cookies found. Please check the format.");
        setCookieAnalyses([]);
        setCookieSummary(null);
      } else {
        setParsedCookies(cookies);
        if (invalid.length > 0) {
          setError(`${invalid.length} invalid cookie(s) found. See details below.`);
        } else {
          setError(null);
        }

        const analyses = cookies
          .map((cookie) => {
            let parsedValue;
            try {
              parsedValue = JSON.parse(decodeURIComponent(cookie.value));
            } catch {
              parsedValue = cookie.value;
            }
            return analyzeCookie(cookie.name, cookie.value, parsedValue);
          })
          .filter((analysis) => analysis.type !== "Unknown" && analysis.category !== "unknown");

        setCookieAnalyses(analyses);

        const domain = cookies.find((c) => c.domain)?.domain || "Unknown";
        const summary = generateCookieSummary(analyses, domain);
        setCookieSummary(summary);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse cookies");
      setParsedCookies([]);
      setCookieAnalyses([]);
      setCookieSummary(null);
      setInvalidCookies([]);
    }
  };

  useEffect(() => {
    if (cookieInput.trim()) {
      parseCookies();
    } else {
      setParsedCookies([]);
      setError(null);
      setStats(null);
      setCookieAnalyses([]);
      setCookieSummary(null);
      setInvalidCookies([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cookieInput]);

  const handleClear = () => {
    setCookieInput("");
    setParsedCookies([]);
    setError(null);
    setFileError(null);
    setFileName(null);
    setStats(null);
    setExtractUrl("");
    setCookieAnalyses([]);
    setCookieSummary(null);
    setInvalidCookies([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileError(null);
    setFileName(null);

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setFileError(
        `File size exceeds 5MB limit. File size: ${(file.size / 1024 / 1024).toFixed(2)}MB`
      );
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        setCookieInput(content);
        setFileError(null);
      } catch (error) {
        setFileError("Failed to read file");
      }
    };

    reader.onerror = () => {
      setFileError("Error reading file");
    };

    reader.readAsText(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleExtractFromUrl = async () => {
    if (!extractUrl.trim()) {
      setError("Please enter a URL");
      return;
    }

    setIsExtracting(true);

    setCookieInput("");
    setParsedCookies([]);
    setCookieAnalyses([]);
    setCookieSummary(null);
    setStats(null);
    setInvalidCookies([]);
    setError(null);

    try {
      const response = await fetch("/api/extract-cookies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: extractUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to extract cookies");
      }

      if (data.cookies && data.cookies.length > 0) {
        const cookieStrings = data.cookies.map((cookie: any) => {
          let str = `${cookie.name}=${cookie.value}`;
          if (cookie.domain) str += `; Domain=${cookie.domain}`;
          if (cookie.path) str += `; Path=${cookie.path}`;
          if (cookie.expires) str += `; Expires=${cookie.expires}`;
          if (cookie.secure) str += "; Secure";
          if (cookie.httpOnly) str += "; HttpOnly";
          if (cookie.sameSite) str += `; SameSite=${cookie.sameSite}`;
          return str;
        });
        setCookieInput(cookieStrings.join("\n"));
      } else {
        setError("No cookies found for this URL");
        setCookieInput("");
        setParsedCookies([]);
        setCookieAnalyses([]);
        setCookieSummary(null);
        setStats(null);
        setInvalidCookies([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract cookies");
      setCookieInput("");
      setParsedCookies([]);
      setCookieAnalyses([]);
      setCookieSummary(null);
      setStats(null);
      setInvalidCookies([]);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleCopy = (cookie?: ParsedCookie) => {
    if (cookie) {
      const cookieString = `${cookie.name}=${cookie.value}`;
      navigator.clipboard.writeText(cookieString);
    } else {
      navigator.clipboard.writeText(cookieInput);
    }
  };

  const exportCookies = (format: "netscape" | "json" | "header") => {
    let content = "";

    switch (format) {
      case "netscape":
        content = "# Netscape HTTP Cookie File\n";
        content += parsedCookies
          .map((c) => {
            const domain = c.domain || "example.com";
            const flag = "TRUE";
            const path = c.path || "/";
            const secure = c.secure ? "TRUE" : "FALSE";
            const expiration = c.expires ? Math.floor(new Date(c.expires).getTime() / 1000) : "0";
            return `${domain}\t${flag}\t${path}\t${secure}\t${expiration}\t${c.name}\t${c.value}`;
          })
          .join("\n");
        break;

      case "json":
        content = JSON.stringify(
          parsedCookies.map((c) => ({
            name: c.name,
            value: c.value,
            domain: c.domain,
            path: c.path,
            expires: c.expires,
            secure: c.secure,
            httpOnly: c.httpOnly,
            sameSite: c.sameSite,
          })),
          null,
          2
        );
        break;

      case "header":
      default:
        content = parsedCookies
          .map((c) => {
            let str = `${c.name}=${c.value}`;
            if (c.domain) str += `; Domain=${c.domain}`;
            if (c.path) str += `; Path=${c.path}`;
            if (c.expires) str += `; Expires=${c.expires}`;
            if (c.secure) str += "; Secure";
            if (c.httpOnly) str += "; HttpOnly";
            if (c.sameSite) str += `; SameSite=${c.sameSite}`;
            return str;
          })
          .join("\n");
    }

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cookies.${format === "json" ? "json" : "txt"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const removeCookie = (index: number) => {
    setParsedCookies((prev) => prev.filter((_, i) => i !== index));
    const lines = cookieInput.split("\n");
    const newLines = lines.filter((_, i) => {
      const cookie = parseCookieString(lines[i]);
      return cookie?.name !== parsedCookies[index]?.name;
    });
    setCookieInput(newLines.join("\n"));
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "Session";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 p-4">
      <Card variant="hacker" className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Cookie className="w-8 h-8" style={{ color: theme.colors.primary }} />
          <h2 className="text-3xl font-bold font-mono" style={{ color: theme.colors.primary }}>
            Cookie Inspector Pro
          </h2>
        </div>

        <div
          className="mb-6 p-4 border rounded-lg"
          style={{
            backgroundColor: hexToRgba(theme.colors.primary, 0.05),
            borderColor: hexToRgba(theme.colors.primary, 0.3),
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-5 h-5" style={{ color: theme.colors.primary }} />
            <h3 className="text-lg font-semibold font-mono" style={{ color: theme.colors.primary }}>
              Extract from URL
            </h3>
          </div>
          <div className="flex gap-3">
            <input
              type="url"
              value={extractUrl}
              onChange={(e) => setExtractUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 px-4 py-2 rounded-lg border-2 font-mono focus:outline-none focus:ring-2"
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
            <Button
              onClick={handleExtractFromUrl}
              disabled={isExtracting}
              variant="primary"
              size="md"
              className="flex items-center gap-2"
            >
              {isExtracting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Extract Cookies
                </>
              )}
            </Button>
          </div>
          <p
            className="text-xs font-mono mt-2"
            style={{ color: theme.colors.foreground, opacity: 0.5 }}
          >
            Enter a URL to extract cookies using the backend API
          </p>
        </div>

        <div className="mb-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.cookie,.json"
            onChange={handleFileUpload}
            className="hidden"
          />
          <div className="flex items-center gap-3 mb-2">
            <Button
              onClick={handleUploadClick}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload Cookie File
            </Button>
            {fileName && (
              <div
                className="flex items-center gap-2 text-sm font-mono"
                style={{ color: theme.colors.foreground, opacity: 0.7 }}
              >
                <File className="w-4 h-4" />
                <span>{fileName}</span>
              </div>
            )}
            <span
              className="text-xs font-mono"
              style={{ color: theme.colors.foreground, opacity: 0.5 }}
            >
              (Max 5MB • Supports .txt, .json, .cookie)
            </span>
          </div>
          {fileError && (
            <div className="p-2 bg-red-500/10 border border-red-500 rounded text-red-400 text-sm font-mono">
              {fileError}
            </div>
          )}
        </div>

        <div>
          <label
            className="block text-sm font-medium font-mono mb-2"
            style={{ color: theme.colors.foreground, opacity: 0.7 }}
          >
            Cookie String(s) - One per line (Supports Header, JSON, Netscape formats)
          </label>
          <textarea
            ref={textareaRef}
            value={cookieInput}
            onChange={(e) => setCookieInput(e.target.value)}
            className="w-full h-48 px-4 py-3 rounded-lg border-2 font-mono text-sm resize-none focus:outline-none focus:ring-2"
            style={{
              lineHeight: "1.25rem",
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
            placeholder="Paste cookie strings here, one per line...&#10;&#10;Supported formats:&#10;• Header: name=value; Domain=.example.com; Path=/; Secure&#10;• JSON: {&quot;name&quot;:&quot;session&quot;,&quot;value&quot;:&quot;abc123&quot;}&#10;• Netscape: .example.com	TRUE	/	FALSE	0	name	value"
          />
        </div>

        <div className="flex flex-wrap gap-3 mt-4">
          <Button
            onClick={parseCookies}
            variant="primary"
            size="md"
            className="flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Parse Cookies
          </Button>
          <Button
            onClick={() => handleCopy()}
            variant="outline"
            size="md"
            className="flex items-center gap-2"
          >
            <Copy className="w-5 h-5" />
            Copy All
          </Button>

          <div className="relative group">
            <Button variant="outline" size="md" className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export As
            </Button>
            <div
              className="absolute left-0 mt-2 w-48 border-2 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10"
              style={{
                backgroundColor: theme.colors.background,
                borderColor: hexToRgba(theme.colors.primary, 0.5),
              }}
            >
              <button
                onClick={() => exportCookies("header")}
                className="w-full px-4 py-2 text-left font-mono text-sm transition-colors"
                style={{ color: theme.colors.primary }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = hexToRgba(theme.colors.primary, 0.1);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                Cookie Header (.txt)
              </button>
              <button
                onClick={() => exportCookies("json")}
                className="w-full px-4 py-2 text-left font-mono text-sm transition-colors"
                style={{ color: theme.colors.primary }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = hexToRgba(theme.colors.primary, 0.1);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                JSON (.json)
              </button>
              <button
                onClick={() => exportCookies("netscape")}
                className="w-full px-4 py-2 text-left font-mono text-sm transition-colors"
                style={{ color: theme.colors.primary }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = hexToRgba(theme.colors.primary, 0.1);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                Netscape (.txt)
              </button>
            </div>
          </div>

          <Button
            onClick={handleClear}
            variant="outline"
            size="md"
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Clear All
          </Button>
        </div>
      </Card>

      {error && (
        <Card variant="outlined" className="p-6">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-500 font-mono text-sm font-semibold mb-1">Error:</p>
              <p className="text-red-400 font-mono text-sm">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {invalidCookies.length > 0 && (
        <Card variant="outlined" className="p-6 border-red-500/50">
          <div className="flex items-start gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-red-500 font-mono text-lg font-semibold mb-1">
                Invalid Cookies ({invalidCookies.length})
              </h3>
              <p className="text-red-400/70 font-mono text-sm">
                The following cookies could not be parsed. Please check the format and try again.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {invalidCookies.map((invalid, index) => (
              <div key={index} className="p-4 bg-red-500/5 border border-red-500/30 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-red-500 font-mono text-sm font-semibold">
                      Line {invalid.line}:
                    </span>
                    <span className="text-red-400 font-mono text-xs">{invalid.reason}</span>
                  </div>
                </div>
                <div className="mt-2 p-2 bg-black/50 rounded border border-red-500/20">
                  <code className="text-red-300 font-mono text-xs break-all">
                    {invalid.content}
                  </code>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-500 font-mono text-xs font-semibold mb-1">
              Expected Formats:
            </p>
            <ul className="text-yellow-400/70 font-mono text-xs space-y-1 ml-4 list-disc">
              <li>
                Header:{" "}
                <code className="text-yellow-300">
                  name=value; Domain=.example.com; Path=/; Secure
                </code>
              </li>
              <li>
                JSON:{" "}
                <code className="text-yellow-300">
                  {"{"}"name":"session","value":"abc123"{"}"}
                </code>
              </li>
              <li>
                Netscape:{" "}
                <code className="text-yellow-300">.example.com TRUE / FALSE 0 name value</code>
              </li>
            </ul>
          </div>
        </Card>
      )}

      {cookieSummary && cookieAnalyses.length > 0 && (
        <Card variant="hacker" className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6" style={{ color: theme.colors.primary }} />
              <h3
                className="text-xl font-semibold font-mono"
                style={{ color: theme.colors.primary }}
              >
                Cookie Data Analysis
              </h3>
            </div>
            <Button
              onClick={() => setShowAnalysis(!showAnalysis)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {showAnalysis ? "Hide" : "Show"} Analysis
            </Button>
          </div>

          {showAnalysis && (
            <>
              <div
                className="mb-6 p-4 border rounded-lg"
                style={{
                  backgroundColor: hexToRgba(theme.colors.primary, 0.05),
                  borderColor: hexToRgba(theme.colors.primary, 0.3),
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-5 h-5" style={{ color: theme.colors.primary }} />
                  <h4
                    className="text-lg font-semibold font-mono"
                    style={{ color: theme.colors.primary }}
                  >
                    Summary
                  </h4>
                </div>
                <div className="space-y-2 text-sm font-mono">
                  <div className="flex items-center gap-2">
                    <span style={{ color: theme.colors.foreground, opacity: 0.7 }}>Domain:</span>
                    <span style={{ color: theme.colors.accent }}>{cookieSummary.domain}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ color: theme.colors.foreground, opacity: 0.7 }}>
                      Total Cookies:
                    </span>
                    <span style={{ color: theme.colors.accent }}>{cookieSummary.totalCookies}</span>
                  </div>
                  {cookieSummary.sessionInfo.firstSeen && (
                    <div className="flex items-center gap-2">
                      <span style={{ color: theme.colors.foreground, opacity: 0.7 }}>
                        First Seen:
                      </span>
                      <span style={{ color: theme.colors.accent }}>
                        {cookieSummary.sessionInfo.firstSeen}
                      </span>
                    </div>
                  )}
                  {cookieSummary.sessionInfo.lastAccess && (
                    <div className="flex items-center gap-2">
                      <span style={{ color: theme.colors.foreground, opacity: 0.7 }}>
                        Last Access:
                      </span>
                      <span style={{ color: theme.colors.accent }}>
                        {cookieSummary.sessionInfo.lastAccess}
                      </span>
                    </div>
                  )}
                </div>

                <div
                  className="mt-4 pt-4 border-t"
                  style={{ borderColor: hexToRgba(theme.colors.primary, 0.3) }}
                >
                  <div
                    className="text-sm font-semibold font-mono mb-2"
                    style={{ color: theme.colors.foreground, opacity: 0.7 }}
                  >
                    Categories:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(cookieSummary.categories).map(([category, count]) => (
                      <span
                        key={category}
                        className="px-3 py-1 border rounded text-xs font-mono"
                        style={{
                          backgroundColor: hexToRgba(theme.colors.primary, 0.1),
                          borderColor: theme.colors.primary,
                          color: theme.colors.primary,
                        }}
                      >
                        {category}: {count as number}
                      </span>
                    ))}
                  </div>
                </div>

                {cookieSummary.trackingServices.length > 0 && (
                  <div
                    className="mt-4 pt-4 border-t"
                    style={{ borderColor: hexToRgba(theme.colors.primary, 0.3) }}
                  >
                    <div
                      className="text-sm font-semibold font-mono mb-2"
                      style={{ color: theme.colors.foreground, opacity: 0.7 }}
                    >
                      Tracking Services:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {cookieSummary.trackingServices.map((service: string) => (
                        <span
                          key={service}
                          className="px-3 py-1 bg-yellow-500/10 border border-yellow-500 text-yellow-500 rounded text-xs font-mono"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {cookieSummary.consentStatus.hasConsent && (
                  <div
                    className="mt-4 pt-4 border-t"
                    style={{ borderColor: hexToRgba(theme.colors.primary, 0.3) }}
                  >
                    <div
                      className="text-sm font-semibold font-mono mb-2"
                      style={{ color: theme.colors.foreground, opacity: 0.7 }}
                    >
                      Consent Status:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(cookieSummary.consentStatus.purposes || {}).map((purpose) => (
                        <span
                          key={purpose}
                          className="px-3 py-1 bg-blue-500/10 border border-blue-500 text-blue-500 rounded text-xs font-mono"
                        >
                          {purpose}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {cookieSummary.insights.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-green-500/30">
                    <div className="text-sm font-semibold text-green-500/70 font-mono mb-2">
                      Insights:
                    </div>
                    <ul className="space-y-1">
                      {cookieSummary.insights.map((insight: string, index: number) => (
                        <li key={index} className="text-sm text-green-400 font-mono">
                          • {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h4
                  className="text-lg font-semibold font-mono mb-3"
                  style={{ color: theme.colors.primary }}
                >
                  Detailed Cookie Analysis
                </h4>
                {cookieAnalyses.map((analysis, index) => (
                  <Card
                    key={index}
                    variant="default"
                    className="p-4 transition-colors"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = hexToRgba(theme.colors.primary, 0.7);
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = hexToRgba(theme.colors.primary, 0.3);
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-lg font-bold text-red-400 font-mono">
                            {index + 1}. {analysis.name}
                          </span>
                          <span
                            className="px-2 py-1 border rounded text-xs font-mono"
                            style={{
                              backgroundColor: hexToRgba(theme.colors.primary, 0.1),
                              borderColor: theme.colors.primary,
                              color: theme.colors.primary,
                            }}
                          >
                            {analysis.type}
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-mono ${
                              analysis.category === "tracking"
                                ? "bg-red-500/10 border border-red-500 text-red-500"
                                : analysis.category === "advertising"
                                  ? "bg-orange-500/10 border border-orange-500 text-orange-500"
                                  : analysis.category === "analytics"
                                    ? "bg-yellow-500/10 border border-yellow-500 text-yellow-500"
                                    : analysis.category === "security"
                                      ? "bg-blue-500/10 border border-blue-500 text-blue-500"
                                      : "bg-green-500/10 border border-green-500 text-green-500"
                            }`}
                          >
                            {analysis.category}
                          </span>
                        </div>
                        <p className="text-sm text-green-500/70 font-mono">
                          {analysis.description}
                        </p>
                      </div>
                    </div>

                    <div className="mb-3 p-3 bg-black/50 rounded border border-green-500/30">
                      <div className="text-xs text-green-500/50 font-mono mb-1">Value:</div>
                      <div className="text-sm text-green-300 font-mono break-all">
                        {typeof analysis.parsedValue === "object" && analysis.parsedValue !== null
                          ? JSON.stringify(analysis.parsedValue, null, 2)
                          : analysis.value}
                      </div>
                    </div>

                    {(analysis.metadata.firstSeen ||
                      analysis.metadata.lastAccess ||
                      analysis.metadata.timestamp ||
                      analysis.metadata.userId ||
                      analysis.metadata.sessionId ||
                      analysis.metadata.version ||
                      analysis.metadata.duration ||
                      analysis.metadata.purposes ||
                      analysis.metadata.vendor ||
                      analysis.metadata.expiration ||
                      analysis.metadata.privacy ||
                      analysis.metadata.purpose) && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3 pt-3 border-t border-green-500/30">
                        {analysis.metadata.vendor && (
                          <div>
                            <div className="text-xs text-green-500/50 font-mono mb-1">Vendor</div>
                            <div className="text-sm text-green-400 font-mono">
                              {analysis.metadata.vendor}
                            </div>
                          </div>
                        )}
                        {analysis.metadata.expiration && (
                          <div>
                            <div className="text-xs text-green-500/50 font-mono mb-1">
                              Expiration
                            </div>
                            <div className="text-sm text-green-400 font-mono">
                              {analysis.metadata.expiration}
                            </div>
                          </div>
                        )}
                        {analysis.metadata.privacy && (
                          <div>
                            <div className="text-xs text-green-500/50 font-mono mb-1">
                              Privacy Level
                            </div>
                            <div
                              className={`text-sm font-mono ${
                                analysis.metadata.privacy === "high"
                                  ? "text-red-400"
                                  : analysis.metadata.privacy === "medium"
                                    ? "text-yellow-400"
                                    : "text-green-400"
                              }`}
                            >
                              {analysis.metadata.privacy.toUpperCase()}
                            </div>
                          </div>
                        )}
                        {analysis.metadata.purpose && (
                          <div>
                            <div className="text-xs text-green-500/50 font-mono mb-1">Purpose</div>
                            <div className="text-sm text-green-400 font-mono">
                              {analysis.metadata.purpose}
                            </div>
                          </div>
                        )}
                        {analysis.metadata.firstSeen && (
                          <div>
                            <div className="text-xs text-green-500/50 font-mono mb-1">
                              First Seen
                            </div>
                            <div className="text-sm text-green-400 font-mono">
                              {analysis.metadata.firstSeen}
                            </div>
                          </div>
                        )}
                        {analysis.metadata.lastAccess && (
                          <div>
                            <div className="text-xs text-green-500/50 font-mono mb-1">
                              Last Access
                            </div>
                            <div className="text-sm text-green-400 font-mono">
                              {analysis.metadata.lastAccess}
                            </div>
                          </div>
                        )}
                        {analysis.metadata.version && (
                          <div>
                            <div className="text-xs text-green-500/50 font-mono mb-1">Version</div>
                            <div className="text-sm text-green-400 font-mono">
                              {analysis.metadata.version}
                            </div>
                          </div>
                        )}
                        {analysis.metadata.userId && (
                          <div>
                            <div className="text-xs text-green-500/50 font-mono mb-1">User ID</div>
                            <div className="text-sm text-green-400 font-mono break-all">
                              {analysis.metadata.userId}
                            </div>
                          </div>
                        )}
                        {analysis.metadata.sessionId && (
                          <div>
                            <div className="text-xs text-green-500/50 font-mono mb-1">
                              Session ID
                            </div>
                            <div className="text-sm text-green-400 font-mono break-all">
                              {analysis.metadata.sessionId}
                            </div>
                          </div>
                        )}
                        {analysis.metadata.duration && (
                          <div>
                            <div className="text-xs text-green-500/50 font-mono mb-1">Duration</div>
                            <div className="text-sm text-green-400 font-mono">
                              {Math.floor(analysis.metadata.duration / (1000 * 60 * 60 * 24))} days
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {analysis.metadata.purposes && (
                      <div className="mt-3 pt-3 border-t border-green-500/30">
                        <div className="text-xs text-green-500/50 font-mono mb-2">
                          Consent Purposes:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(analysis.metadata.purposes).map(([purpose, enabled]) => (
                            <span
                              key={purpose}
                              className={`px-2 py-1 rounded text-xs font-mono ${
                                enabled
                                  ? "bg-green-500/10 border border-green-500 text-green-500"
                                  : "bg-gray-500/10 border border-gray-500 text-gray-500"
                              }`}
                            >
                              {purpose}: {enabled ? "Yes" : "No"}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.insights.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-green-500/30">
                        <div className="text-xs text-green-500/50 font-mono mb-2">Insights:</div>
                        <ul className="space-y-1">
                          {analysis.insights.map((insight: string, i: number) => (
                            <li key={i} className="text-sm text-green-400 font-mono">
                              • {insight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </>
          )}
        </Card>
      )}

      {stats && (
        <Card variant="hacker" className="p-6">
          <h3 className="text-xl font-semibold text-green-500 font-mono mb-4">Cookie Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-green-500/5 border border-green-500/30 rounded-lg">
              <div className="text-2xl font-bold text-green-500 font-mono">{stats.total}</div>
              <div className="text-xs text-green-500/70 font-mono mt-1">Total Cookies</div>
            </div>
            <div className="p-4 bg-green-500/5 border border-green-500/30 rounded-lg">
              <div className="text-2xl font-bold text-green-500 font-mono">{stats.secure}</div>
              <div className="text-xs text-green-500/70 font-mono mt-1">Secure</div>
            </div>
            <div className="p-4 bg-green-500/5 border border-green-500/30 rounded-lg">
              <div className="text-2xl font-bold text-green-500 font-mono">{stats.httpOnly}</div>
              <div className="text-xs text-green-500/70 font-mono mt-1">HttpOnly</div>
            </div>
            <div className="p-4 bg-green-500/5 border border-green-500/30 rounded-lg">
              <div className="text-2xl font-bold text-green-500 font-mono">{stats.thirdParty}</div>
              <div className="text-xs text-green-500/70 font-mono mt-1">3rd Party</div>
            </div>
            <div className="p-4 bg-green-500/5 border border-green-500/30 rounded-lg">
              <div className="text-2xl font-bold text-green-500 font-mono">
                {(stats.totalSize / 1024).toFixed(2)} KB
              </div>
              <div className="text-xs text-green-500/70 font-mono mt-1">Total Size</div>
            </div>
          </div>
        </Card>
      )}

      {parsedCookies.length > 0 && (
        <div ref={resultRef}>
          <Card variant="hacker" className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <h3 className="text-xl font-semibold text-green-500 font-mono">
                  Parsed Cookies ({parsedCookies.length})
                </h3>
              </div>
            </div>

            <div className="space-y-4">
              {parsedCookies.map((cookie, index) => (
                <Card
                  key={index}
                  variant="default"
                  className="p-4 hover:border-green-500/70 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-red-400 font-semibold font-mono text-lg">
                          {cookie.name}
                        </span>
                        <span className="text-green-500/70">=</span>
                        <span className="text-green-300 font-mono break-all text-sm">
                          {cookie.value}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        onClick={() => handleCopy(cookie)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                        title="Copy cookie"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        onClick={() => removeCookie(index)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 text-red-500 border-red-500/50 hover:bg-red-500/10"
                        title="Remove cookie"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-green-500/30">
                    <div>
                      <div className="text-xs text-green-500/50 font-mono mb-1">Domain</div>
                      <div className="text-sm text-green-400 font-mono break-all">
                        {cookie.domain || "N/A"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-green-500/50 font-mono mb-1">Path</div>
                      <div className="text-sm text-green-400 font-mono">{cookie.path || "/"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-green-500/50 font-mono mb-1">Expires</div>
                      <div className="text-sm text-green-400 font-mono">
                        {formatDate(cookie.expires)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-green-500/50 font-mono mb-1">Size</div>
                      <div className="text-sm text-green-400 font-mono">{cookie.size} bytes</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-green-500/30">
                    {cookie.secure && (
                      <span className="px-2 py-1 bg-green-500/10 border border-green-500 text-green-500 rounded text-xs font-mono flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Secure
                      </span>
                    )}
                    {cookie.httpOnly && (
                      <span className="px-2 py-1 bg-green-500/10 border border-green-500 text-green-500 rounded text-xs font-mono">
                        HttpOnly
                      </span>
                    )}
                    {cookie.sameSite && (
                      <span className="px-2 py-1 bg-green-500/10 border border-green-500 text-green-500 rounded text-xs font-mono">
                        SameSite: {cookie.sameSite}
                      </span>
                    )}
                    {cookie.maxAge && (
                      <span className="px-2 py-1 bg-green-500/10 border border-green-500 text-green-500 rounded text-xs font-mono">
                        Max-Age: {cookie.maxAge}s
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
