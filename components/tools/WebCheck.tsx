"use client";

import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import Lottie from "lottie-react";
import {
  Globe,
  CheckCircle,
  XCircle,
  RotateCcw,
  Info,
  AlertCircle,
  MapPin,
  Activity,
  Shield,
  Server,
  Lock,
  Eye,
  Cookie,
  Tag,
  FileText,
  Network,
  Key,
  Link2,
  Search,
  Archive,
  List,
  Code2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Award,
  Route,
  Mail,
  TrendingUp,
  Camera,
  Settings,
  Zap,
  Star,
  Leaf,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Map } from "@/components/ui/Map";
import { useTheme } from "@/components/ui/ThemeProvider";
import { hexToRgba } from "@/lib/color-utils";
import { apiClient } from "@/lib/api-client";
import heartbeatAnimation from "@/animations/heartbeat ECG.json";
import {
  SectionHeader,
  StatusIndicator,
  KeyValue,
  InfoCard,
  DNSRecordList,
  BooleanStatusCard,
  SimpleList,
} from "./webcheck/WebCheckComponents";

interface JobResult {
  name: string;
  status: "success" | "error" | "skipped";
  duration: number;
  data?: any;
  error?: string;
}

interface WebCheckData {
  jobs: JobResult[];
  results: {
    ip?: string;
    location?: any;
    ssl?: any;
    domain?: any;
    serverInfo?: any;
    cookies?: any;
    headers?: Record<string, string>;
    dns?: any;
    hosts?: string[];
    httpSecurity?: any;
    socialTags?: any;
    securityTxt?: any;
    dnsServer?: any;
    firewall?: any;
    dnssec?: any;
    hsts?: any;
    threats?: any;
    redirects?: any;
    linkedPages?: string[];
    robotsTxt?: any;
    status?: any;
    ports?: any;
    txtRecords?: any;
    blockLists?: any;
    sitemap?: any;
    archives?: any;
    quality?: any;
    traceRoute?: any;
    mailConfig?: any;
    rank?: any;
    screenshot?: any;
    tlsCipherSuites?: any;
    tlsSecurityConfig?: any;
    tlsClientSupport?: any;
    features?: any;
    carbon?: any;
  };
  summary?: {
    successful: number;
    failed: number;
    skipped: number;
    totalTime: number;
  };
}

export default function WebCheck() {
  const { theme } = useTheme();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WebCheckData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [expandedFailedJobs, setExpandedFailedJobs] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result && resultRef.current) {
      gsap.fromTo(
        resultRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 }
      );
    }
  }, [result]);

  useEffect(() => {
    if (url) {
      try {
        const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
        const favicon = `${urlObj.origin}/favicon.ico`;
        setFaviconUrl(favicon);
      } catch {
        setFaviconUrl(null);
      }
    } else {
      setFaviconUrl(null);
    }
  }, [url]);

  const handleCheck = async () => {
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    if (cardRef.current) {
      gsap.to(cardRef.current, {
        scale: 0.98,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
      });
    }

    const response = await apiClient.webCheck<WebCheckData>(url, false);

    if (response.success && response.data) {
      setResult(response.data);
    } else {
      setError(response.error || "Failed to analyze website");
    }

    setLoading(false);
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms} ms`;
    return `${(ms / 1000).toFixed(2)} s`;
  };

  const hasMeaningfulData = (job: JobResult): boolean => {
    if (!job.data || job.data === null || job.data === undefined) {
      return false;
    }

    if (Array.isArray(job.data)) {
      return job.data.length > 0;
    }

    if (typeof job.data === "object") {
      const keys = Object.keys(job.data);
      if (keys.length === 0) {
        return false;
      }

      if (job.name === "tech-stack") {
        const technologies = (job.data as any).technologies;
        if (!technologies || !Array.isArray(technologies) || technologies.length === 0) {
          return false;
        }
        const infrastructureServices = [
          "cloudflare",
          "aws cloudfront",
          "fastly",
          "cloudfront",
          "google analytics",
          "google tag manager",
        ];
        const hasNonInfrastructure = technologies.some((tech: any) => {
          const normalizedName = tech.name?.toLowerCase().trim();
          return normalizedName && !infrastructureServices.includes(normalizedName);
        });
        return hasNonInfrastructure;
      }

      if (job.name === "social-tags") {
        const socialTags = job.data as any;
        return !!(
          socialTags.description ||
          socialTags.keywords ||
          socialTags.canonicalUrl ||
          socialTags.author ||
          socialTags.banner
        );
      }

      for (const key of keys) {
        const value = (job.data as any)[key];
        if (value !== null && value !== undefined) {
          if (Array.isArray(value) && value.length > 0) {
            return true;
          }
          if (!Array.isArray(value) && typeof value !== "object") {
            return true;
          }
          if (typeof value === "object" && Object.keys(value).length > 0) {
            return true;
          }
        }
      }
      return false;
    }

    return true;
  };

  const getJobProgress = () => {
    if (!result) return { successful: 0, failed: 0, noData: 0, total: 0 };

    const successful = result.jobs.filter(
      (j) => j.status === "success" && hasMeaningfulData(j)
    ).length;
    const failed = result.jobs.filter((j) => j.status === "error").length;
    const noData = result.jobs.filter(
      (j) => j.status === "success" && !hasMeaningfulData(j)
    ).length;
    const total = result.jobs.length;

    return { successful, failed, noData, total };
  };

  const getFailedJobs = () => {
    if (!result) return [];
    return result.jobs.filter((j) => j.status === "error");
  };

  const getTechStack = () => {
    if (!result) return [];
    const techStackJob = result.jobs.find((j) => j.name === "tech-stack");
    if (techStackJob?.data?.technologies) {
      const technologies = techStackJob.data.technologies;
      const seen = new Set<string>();
      const unique: any[] = [];

      const infrastructureServices = [
        "cloudflare",
        "aws cloudfront",
        "fastly",
        "cloudfront",
        "google analytics",
        "google tag manager",
      ];

      for (const tech of technologies) {
        const normalizedName = tech.name?.toLowerCase().trim();
        if (normalizedName && !seen.has(normalizedName)) {
          if (infrastructureServices.includes(normalizedName)) {
            continue;
          }

          seen.add(normalizedName);
          unique.push({
            ...tech,
            name:
              tech.name?.charAt(0).toUpperCase() + tech.name?.slice(1).toLowerCase() || tech.name,
          });
        }
      }

      return unique;
    }
    return [];
  };

  const hasData = (key: string) => {
    if (!result) return false;
    const value = (result.results as any)[key];
    if (value === null || value === undefined) return false;
    if (Array.isArray(value) && value.length === 0) return false;
    if (typeof value === "object" && Object.keys(value).length === 0) return false;
    return true;
  };

  const getDomainName = () => {
    if (!result) return "Unknown";
    return (
      result.results.domain?.registered?.toLowerCase() ||
      result.results.ssl?.subject ||
      (() => {
        try {
          return new URL(url).hostname;
        } catch {
          try {
            return new URL(`https://${url}`).hostname;
          } catch {
            return url || "Unknown";
          }
        }
      })()
    );
  };

  const progress = getJobProgress();
  const failedJobs = getFailedJobs();
  const techStack = getTechStack();

  return (
    <div
      className="w-full max-w-7xl mx-auto p-6 space-y-6 min-h-screen"
      style={{ backgroundColor: theme.colors.background }}
    >
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Globe className="w-12 h-12 animate-pulse" style={{ color: theme.colors.primary }} />
          <h1
            className="text-5xl font-bold smooch-sans font-effect-anaglyph tracking-wider"
            style={{ color: theme.colors.primary }}
          >
            WEB CHECK
          </h1>
        </div>
        <p className="font-mono text-sm" style={{ color: theme.colors.foreground, opacity: 0.7 }}>
          {">"} Comprehensive website analysis and security check
        </p>
      </div>

      <Card ref={cardRef} className="p-6" variant="hacker">
        <div className="space-y-4">
          <div className="flex gap-3">
            <Input
              type="text"
              placeholder="Enter website URL (e.g., https://example.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !loading && handleCheck()}
              className="flex-1 font-mono"
              style={{
                backgroundColor: theme.colors.background,
                borderColor: hexToRgba(theme.colors.primary, 0.5),
                color: theme.colors.primary,
              }}
            />
            <Button
              onClick={handleCheck}
              disabled={loading}
              size="md"
              variant="primary"
              className="font-mono relative overflow-hidden min-w-[120px]"
            >
              {loading ? (
                <>
                  <span className="invisible">SCAN</span>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Lottie
                      animationData={heartbeatAnimation}
                      loop={true}
                      style={{ width: "100%", height: "100%" }}
                    />
                  </div>
                </>
              ) : (
                <span className="relative z-10">SCAN</span>
              )}
            </Button>
          </div>

          {error && (
            <div
              className="p-4 border-2 rounded-lg"
              style={{
                backgroundColor: hexToRgba(theme.colors.accent, 0.1),
                borderColor: theme.colors.accent,
              }}
            >
              <p className="font-mono" style={{ color: theme.colors.accent }}>
                {error}
              </p>
            </div>
          )}
        </div>
      </Card>

      {result && (
        <div ref={resultRef} className="space-y-6">
          <Card className="p-6" variant="hacker">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {faviconUrl && (
                    <img
                      src={faviconUrl}
                      alt="Favicon"
                      className="w-8 h-8 rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                  <h2
                    className="text-2xl font-bold smooch-sans font-effect-anaglyph"
                    style={{ color: theme.colors.primary }}
                  >
                    {getDomainName()}
                  </h2>
                </div>
                <div
                  className="font-mono text-sm"
                  style={{ color: theme.colors.foreground, opacity: 0.7 }}
                >
                  {">"} Completed in {formatDuration(result.summary?.totalTime || 0)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div
                  className="border-2 p-4 rounded-lg"
                  style={{
                    backgroundColor: hexToRgba(theme.colors.primary, 0.1),
                    borderColor: theme.colors.primary,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5" style={{ color: theme.colors.primary }} />
                    <span
                      className="text-sm font-medium font-mono"
                      style={{ color: theme.colors.primary }}
                    >
                      SUCCESS
                    </span>
                  </div>
                  <p
                    className="text-3xl font-bold font-mono"
                    style={{ color: theme.colors.accent }}
                  >
                    {progress.successful}
                  </p>
                  <p
                    className="text-xs font-mono mt-1"
                    style={{ color: theme.colors.foreground, opacity: 0.7 }}
                  >
                    Jobs with data
                  </p>
                </div>

                <div
                  className="border-2 p-4 rounded-lg"
                  style={{
                    backgroundColor: hexToRgba(theme.colors.accent, 0.1),
                    borderColor: theme.colors.accent,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-5 h-5" style={{ color: theme.colors.accent }} />
                    <span
                      className="text-sm font-medium font-mono"
                      style={{ color: theme.colors.accent }}
                    >
                      FAILED
                    </span>
                  </div>
                  <p
                    className="text-3xl font-bold font-mono"
                    style={{ color: theme.colors.accent, opacity: 0.8 }}
                  >
                    {progress.failed}
                  </p>
                  <p
                    className="text-xs font-mono mt-1"
                    style={{ color: theme.colors.accent, opacity: 0.7 }}
                  >
                    Jobs with errors
                  </p>
                </div>

                <div
                  className="border-2 p-4 rounded-lg"
                  style={{
                    backgroundColor: hexToRgba(theme.colors.secondary, 0.1),
                    borderColor: theme.colors.secondary,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5" style={{ color: theme.colors.secondary }} />
                    <span
                      className="text-sm font-medium font-mono"
                      style={{ color: theme.colors.secondary }}
                    >
                      NO DATA
                    </span>
                  </div>
                  <p
                    className="text-3xl font-bold font-mono"
                    style={{ color: theme.colors.secondary, opacity: 0.8 }}
                  >
                    {progress.noData}
                  </p>
                  <p
                    className="text-xs font-mono mt-1"
                    style={{ color: theme.colors.secondary, opacity: 0.7 }}
                  >
                    Jobs without data
                  </p>
                </div>

                <div
                  className="border-2 p-4 rounded-lg"
                  style={{
                    backgroundColor: hexToRgba(theme.colors.primary, 0.1),
                    borderColor: theme.colors.primary,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-5 h-5" style={{ color: theme.colors.primary }} />
                    <span
                      className="text-sm font-medium font-mono"
                      style={{ color: theme.colors.primary }}
                    >
                      TOTAL
                    </span>
                  </div>
                  <p
                    className="text-3xl font-bold font-mono"
                    style={{ color: theme.colors.accent }}
                  >
                    {progress.total}
                  </p>
                  <p
                    className="text-xs font-mono mt-1"
                    style={{ color: theme.colors.foreground, opacity: 0.7 }}
                  >
                    Total jobs
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {failedJobs.length > 0 && (
            <Card className="p-6" variant="hacker">
              <div
                className="flex items-center justify-between cursor-pointer mb-4"
                onClick={() => setExpandedFailedJobs(!expandedFailedJobs)}
              >
                <h3
                  className="text-xl font-bold smooch-sans flex items-center gap-2"
                  style={{ color: theme.colors.accent }}
                >
                  <XCircle className="w-6 h-6" />
                  FAILED JOBS ({failedJobs.length})
                </h3>
                {expandedFailedJobs ? (
                  <ChevronUp className="w-5 h-5" style={{ color: theme.colors.primary }} />
                ) : (
                  <ChevronDown className="w-5 h-5" style={{ color: theme.colors.primary }} />
                )}
              </div>
              {expandedFailedJobs && (
                <div className="space-y-3">
                  {failedJobs.map((job, idx) => (
                    <div
                      key={idx}
                      className="border-2 rounded-lg p-4"
                      style={{
                        borderColor: hexToRgba(theme.colors.accent, 0.5),
                        backgroundColor: hexToRgba(theme.colors.accent, 0.05),
                      }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <XCircle className="w-5 h-5" style={{ color: theme.colors.accent }} />
                        <span
                          className="font-mono font-semibold"
                          style={{ color: theme.colors.accent }}
                        >
                          {job.name.toUpperCase()}
                        </span>
                        <span
                          className="font-mono text-xs"
                          style={{ color: theme.colors.foreground, opacity: 0.5 }}
                        >
                          ({formatDuration(job.duration)})
                        </span>
                      </div>
                      <p
                        className="font-mono text-sm"
                        style={{ color: theme.colors.accent, opacity: 0.8 }}
                      >
                        <span style={{ color: theme.colors.foreground, opacity: 0.7 }}>ERROR:</span>{" "}
                        {job.error || "Unknown error occurred"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {hasData("ip") && result.results.ip && (
              <InfoCard icon={Network} title="IP ADDRESS">
                <p className="font-mono text-sm" style={{ color: theme.colors.accent }}>
                  {result.results.ip}
                </p>
              </InfoCard>
            )}

            {hasData("status") && (
              <InfoCard icon={Activity} title="SERVER STATUS">
                <div className="space-y-2 text-sm font-mono">
                  <div className="flex items-center gap-2">
                    {result.results.status?.isUp ? (
                      <CheckCircle className="w-4 h-4" style={{ color: theme.colors.primary }} />
                    ) : (
                      <XCircle className="w-4 h-4" style={{ color: theme.colors.accent }} />
                    )}
                    <span style={{ color: theme.colors.accent }}>IS UP?</span>
                  </div>
                  {result.results.status?.statusCode && (
                    <KeyValue label="STATUS CODE" value={result.results.status.statusCode} />
                  )}
                  {result.results.status?.responseTime && (
                    <KeyValue
                      label="RESPONSE TIME"
                      value={`${result.results.status.responseTime}ms`}
                    />
                  )}
                </div>
              </InfoCard>
            )}

            {hasData("serverInfo") && (
              <InfoCard icon={Server} title="SERVER INFO">
                <div className="space-y-2 text-sm font-mono">
                  {result.results.serverInfo?.server && (
                    <KeyValue label="SERVER" value={result.results.serverInfo.server} />
                  )}
                  {result.results.serverInfo?.poweredBy && (
                    <KeyValue label="POWERED BY" value={result.results.serverInfo.poweredBy} />
                  )}
                </div>
              </InfoCard>
            )}

            {techStack.length > 0 && (
              <Card className="p-6" variant="hacker">
                <h3
                  className="text-lg font-bold smooch-sans flex items-center gap-2 mb-4"
                  style={{ color: theme.colors.primary }}
                >
                  <Code2 className="w-5 h-5" />
                  TECH STACK
                </h3>
                <div className="space-y-2 text-sm font-mono">
                  {techStack.map((tech: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span style={{ color: theme.colors.accent }}>{tech.name}</span>
                      <span
                        className="text-xs px-2 py-1 rounded"
                        style={{
                          backgroundColor:
                            tech.confidence === "high"
                              ? hexToRgba(theme.colors.primary, 0.2)
                              : tech.confidence === "medium"
                                ? hexToRgba(theme.colors.secondary, 0.2)
                                : hexToRgba(theme.colors.foreground, 0.2),
                          color:
                            tech.confidence === "high"
                              ? theme.colors.accent
                              : tech.confidence === "medium"
                                ? theme.colors.secondary
                                : theme.colors.foreground,
                          opacity: tech.confidence === "low" ? 0.6 : 1,
                        }}
                      >
                        {tech.confidence?.toUpperCase() || "LOW"}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {hasData("ssl") && (
              <InfoCard icon={Lock} title="SSL CERTIFICATE">
                <div className="space-y-2 text-sm font-mono">
                  {result.results.ssl?.subject && (
                    <KeyValue
                      label="SUBJECT"
                      value={
                        <span className="text-xs break-all">{result.results.ssl.subject}</span>
                      }
                    />
                  )}
                  {result.results.ssl?.issuer && (
                    <KeyValue
                      label="ISSUER"
                      value={<span className="text-xs break-all">{result.results.ssl.issuer}</span>}
                    />
                  )}
                  {result.results.ssl?.daysRemaining !== undefined && (
                    <KeyValue
                      label="DAYS REMAINING"
                      value={
                        <span
                          className="font-mono"
                          style={{
                            color:
                              result.results.ssl.daysRemaining < 30
                                ? theme.colors.accent
                                : theme.colors.accent,
                          }}
                        >
                          {result.results.ssl.daysRemaining}
                        </span>
                      }
                    />
                  )}
                </div>
              </InfoCard>
            )}

            {hasData("domain") && (
              <InfoCard icon={Globe} title="DOMAIN INFO">
                <div className="space-y-2 text-sm font-mono">
                  {result.results.domain?.creationDate && (
                    <KeyValue label="CREATED" value={result.results.domain.creationDate} />
                  )}
                  {result.results.domain?.expiryDate && (
                    <KeyValue label="EXPIRES" value={result.results.domain.expiryDate} />
                  )}
                  {result.results.domain?.registrar && (
                    <KeyValue
                      label="REGISTRAR"
                      value={
                        <span className="text-xs break-all">{result.results.domain.registrar}</span>
                      }
                    />
                  )}
                </div>
              </InfoCard>
            )}

            {hasData("httpSecurity") && (
              <InfoCard icon={Shield} title="HTTP SECURITY HEADERS">
                <div className="space-y-3 text-sm font-mono">
                  <StatusIndicator
                    enabled={!!result.results.httpSecurity?.contentSecurityPolicy}
                    label="CSP (Content Security Policy)"
                    description={
                      result.results.httpSecurity?.contentSecurityPolicy
                        ? "Active - Prevents XSS attacks by controlling which resources can be loaded"
                        : "Missing - Site vulnerable to cross-site scripting (XSS) attacks"
                    }
                  />
                  <StatusIndicator
                    enabled={!!result.results.httpSecurity?.strictTransportSecurity}
                    label="HSTS (HTTP Strict Transport Security)"
                    description={
                      result.results.httpSecurity?.strictTransportSecurity
                        ? "Active - Forces browsers to use HTTPS connection only"
                        : "Missing - Site may be accessed over insecure HTTP connection"
                    }
                  />
                  <StatusIndicator
                    enabled={!!result.results.httpSecurity?.xContentTypeOptions}
                    label="X-Content-Type-Options"
                    description={
                      result.results.httpSecurity?.xContentTypeOptions
                        ? "Active - Prevents browsers from MIME-sniffing content types"
                        : "Missing - Browsers may misinterpret file types, leading to security risks"
                    }
                  />
                  <StatusIndicator
                    enabled={!!result.results.httpSecurity?.xFrameOptions}
                    label="X-Frame-Options"
                    description={
                      result.results.httpSecurity?.xFrameOptions
                        ? "Active - Prevents site from being embedded in iframes (clickjacking protection)"
                        : "Missing - Site vulnerable to clickjacking attacks"
                    }
                  />
                </div>
              </InfoCard>
            )}

            {hasData("cookies") &&
              result.results.cookies?.cookies &&
              result.results.cookies.cookies.length > 0 && (
                <Card className="p-6" variant="hacker">
                  <h3
                    className="text-lg font-bold smooch-sans flex items-center gap-2 mb-4"
                    style={{ color: theme.colors.primary }}
                  >
                    <Cookie className="w-5 h-5" />
                    COOKIES ({result.results.cookies.cookies.length})
                  </h3>
                  <div className="space-y-3 text-sm font-mono max-h-96 overflow-y-auto">
                    {result.results.cookies.cookies.map((cookie: any, idx: number) => (
                      <div
                        key={idx}
                        className="border rounded p-3"
                        style={{
                          borderColor: hexToRgba(theme.colors.primary, 0.3),
                          backgroundColor: hexToRgba(theme.colors.background, 0.5),
                        }}
                      >
                        <div
                          className="font-semibold mb-2 break-all"
                          style={{ color: theme.colors.accent }}
                        >
                          {cookie.name}
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span style={{ color: theme.colors.foreground, opacity: 0.7 }}>
                              Secure:
                            </span>
                            {cookie.hasSecure ? (
                              <CheckCircle
                                className="w-3 h-3"
                                style={{ color: theme.colors.primary }}
                              />
                            ) : (
                              <XCircle className="w-3 h-3" style={{ color: theme.colors.accent }} />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span style={{ color: theme.colors.foreground, opacity: 0.7 }}>
                              HttpOnly:
                            </span>
                            {cookie.hasHttpOnly ? (
                              <CheckCircle
                                className="w-3 h-3"
                                style={{ color: theme.colors.primary }}
                              />
                            ) : (
                              <XCircle className="w-3 h-3" style={{ color: theme.colors.accent }} />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span style={{ color: theme.colors.foreground, opacity: 0.7 }}>
                              SameSite:
                            </span>
                            {cookie.hasSameSite ? (
                              <CheckCircle
                                className="w-3 h-3"
                                style={{ color: theme.colors.primary }}
                              />
                            ) : (
                              <XCircle className="w-3 h-3" style={{ color: theme.colors.accent }} />
                            )}
                          </div>
                          {cookie.issues && cookie.issues.length > 0 && (
                            <div
                              className="mt-2 pt-2 border-t"
                              style={{ borderColor: hexToRgba(theme.colors.primary, 0.2) }}
                            >
                              <div
                                className="text-xs"
                                style={{ color: theme.colors.accent, opacity: 0.8 }}
                              >
                                {cookie.issues.map((issue: string, i: number) => (
                                  <div key={i}>• {issue}</div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {result.results.cookies.overallIssues &&
                      result.results.cookies.overallIssues.length > 0 && (
                        <div
                          className="mt-3 pt-3 border-t"
                          style={{ borderColor: hexToRgba(theme.colors.primary, 0.3) }}
                        >
                          <div className="text-xs" style={{ color: theme.colors.secondary }}>
                            <div className="font-semibold mb-1">Overall Issues:</div>
                            {result.results.cookies.overallIssues.map(
                              (issue: string, i: number) => (
                                <div key={i}>• {issue}</div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                </Card>
              )}

            {hasData("dns") && (
              <InfoCard icon={Eye} title="DNS RECORDS">
                <div className="space-y-4 text-sm font-mono max-h-96 overflow-y-auto">
                  <DNSRecordList label="A Records" records={result.results.dns?.a || []} />
                  <DNSRecordList label="AAAA Records" records={result.results.dns?.aaaa || []} />
                  <DNSRecordList
                    label="MX Records"
                    records={result.results.dns?.mx || []}
                    formatRecord={(record: any, idx: number) => (
                      <div
                        key={idx}
                        className="text-xs break-all"
                        style={{ color: theme.colors.accent }}
                      >
                        • {record.exchange} (Priority: {record.priority})
                      </div>
                    )}
                  />
                  <DNSRecordList label="NS Records" records={result.results.dns?.ns || []} />
                  <DNSRecordList label="CNAME Records" records={result.results.dns?.cname || []} />
                  <DNSRecordList
                    label="TXT Records"
                    records={result.results.dns?.txt || []}
                    formatRecord={(record: any, idx: number) => (
                      <div
                        key={idx}
                        className="text-xs break-all"
                        style={{ color: theme.colors.accent }}
                      >
                        • {Array.isArray(record) ? record.join(" ") : record}
                      </div>
                    )}
                  />
                </div>
              </InfoCard>
            )}

            {hasData("redirects") && (
              <InfoCard icon={Link2} title="HTTP REDIRECTS">
                <div className="space-y-2 text-sm font-mono">
                  <p className="font-semibold" style={{ color: theme.colors.accent }}>
                    {result.results.redirects?.count || 0} redirect
                    {(result.results.redirects?.count || 0) !== 1 ? "s" : ""} detected
                  </p>
                  <p className="text-xs" style={{ color: theme.colors.foreground, opacity: 0.6 }}>
                    {result.results.redirects?.count === 0
                      ? "No redirects found - URL resolves directly to the final destination"
                      : `Site redirects ${result.results.redirects?.count} time${(result.results.redirects?.count || 0) !== 1 ? "s" : ""} before reaching the final page. Multiple redirects can slow down page loading.`}
                  </p>
                </div>
              </InfoCard>
            )}

            {hasData("hsts") && (
              <BooleanStatusCard
                icon={Shield}
                title="HSTS (HTTP STRICT TRANSPORT SECURITY)"
                enabled={result.results.hsts?.enabled || false}
                enabledDescription="Active - Browsers will only connect via HTTPS, preventing man-in-the-middle attacks"
                disabledDescription="Disabled - Site can be accessed over insecure HTTP, making it vulnerable to attacks"
                additionalInfo={
                  result.results.hsts?.preload ? (
                    <StatusIndicator
                      enabled={true}
                      label="Preload Enabled"
                      description="Site is in browser preload lists - maximum security protection enabled"
                    />
                  ) : null
                }
              />
            )}

            {hasData("threats") && (
              <InfoCard icon={AlertCircle} title="THREAT ANALYSIS">
                <div className="space-y-3 text-sm font-mono">
                  <StatusIndicator
                    enabled={!result.results.threats?.phishing}
                    label="Phishing"
                    description={
                      result.results.threats?.phishing
                        ? "Detected - Site flagged for phishing attempts"
                        : "Not detected - Site appears safe"
                    }
                  />
                  <StatusIndicator
                    enabled={!result.results.threats?.malware}
                    label="Malware"
                    description={
                      result.results.threats?.malware
                        ? "Detected - Site contains malicious software"
                        : "Not detected - No malware found"
                    }
                  />
                  <StatusIndicator
                    enabled={!result.results.threats?.suspicious}
                    label="Suspicious Activity"
                    description={
                      result.results.threats?.suspicious
                        ? "Detected - Site shows suspicious behavior patterns"
                        : "Not detected - No suspicious activity"
                    }
                    warning={!!result.results.threats?.suspicious}
                  />
                </div>
              </InfoCard>
            )}

            {hasData("ports") && (
              <InfoCard icon={Network} title="PORTS">
                <div className="space-y-2 text-sm font-mono">
                  {result.results.ports?.open && result.results.ports.open.length > 0 && (
                    <KeyValue
                      label="OPEN"
                      value={
                        <span className="text-xs">{result.results.ports.open.join(", ")}</span>
                      }
                    />
                  )}
                </div>
              </InfoCard>
            )}

            {hasData("robotsTxt") && (
              <BooleanStatusCard
                icon={FileText}
                title="ROBOTS.TXT FILE"
                enabled={result.results.robotsTxt?.exists || false}
                enabledLabel="File Found"
                disabledLabel="File Not Found"
                enabledDescription="File tells search engines which pages to crawl or ignore"
                disabledDescription="No robots.txt file - search engines can crawl all pages"
                additionalInfo={
                  result.results.robotsTxt?.disallowedPaths &&
                  result.results.robotsTxt.disallowedPaths.length > 0 ? (
                    <KeyValue
                      label="Blocked Paths"
                      value={
                        <span className="text-xs">
                          {result.results.robotsTxt.disallowedPaths.length} paths
                        </span>
                      }
                    />
                  ) : null
                }
              />
            )}

            {hasData("sitemap") && (
              <BooleanStatusCard
                icon={List}
                title="SITEMAP FILE"
                enabled={result.results.sitemap?.exists || false}
                enabledLabel="File Found"
                disabledLabel="File Not Found"
                enabledDescription="File helps search engines discover and index all pages on the site"
                disabledDescription="No sitemap.xml file - search engines may miss some pages"
                additionalInfo={
                  result.results.sitemap?.urls && result.results.sitemap.urls.length > 0 ? (
                    <KeyValue
                      label="Pages Listed"
                      value={
                        <span className="text-xs">{result.results.sitemap.urls.length} URLs</span>
                      }
                    />
                  ) : null
                }
              />
            )}

            {hasData("securityTxt") && (
              <BooleanStatusCard
                icon={Shield}
                title="SECURITY.TXT FILE"
                enabled={result.results.securityTxt?.exists || false}
                enabledLabel="File Found"
                disabledLabel="File Not Found"
                enabledDescription="Security contact information is publicly available for responsible disclosure"
                disabledDescription="No security.txt file found - security researchers cannot easily contact the site"
              />
            )}

            {hasData("dnsServer") && (
              <InfoCard icon={Server} title="DNS SERVER">
                <div className="space-y-2 text-sm font-mono">
                  {result.results.dnsServer?.hostname && (
                    <KeyValue
                      label="HOSTNAME"
                      value={
                        <span className="text-xs break-all">
                          {result.results.dnsServer.hostname}
                        </span>
                      }
                    />
                  )}
                  {result.results.dnsServer?.ip && (
                    <KeyValue
                      label="IP"
                      value={<span className="text-xs">{result.results.dnsServer.ip}</span>}
                    />
                  )}
                </div>
              </InfoCard>
            )}

            {hasData("firewall") && (
              <BooleanStatusCard
                icon={Shield}
                title="FIREWALL / CDN PROTECTION"
                enabled={result.results.firewall?.detected || false}
                enabledLabel="Protection Active"
                disabledLabel="No Protection Detected"
                enabledDescription="Site is protected by a firewall or CDN service"
                disabledDescription="No firewall or CDN protection detected"
                additionalInfo={
                  result.results.firewall?.provider ? (
                    <KeyValue
                      label="Service Provider"
                      value={<span className="text-xs">{result.results.firewall.provider}</span>}
                    />
                  ) : null
                }
              />
            )}

            {hasData("archives") && (
              <InfoCard icon={Archive} title="ARCHIVES">
                <div className="space-y-2 text-sm font-mono">
                  {result.results.archives?.totalScans !== undefined && (
                    <KeyValue label="SCANS" value={result.results.archives.totalScans} />
                  )}
                  {result.results.archives?.firstScan && (
                    <KeyValue
                      label="FIRST"
                      value={
                        <span className="text-xs">
                          {new Date(result.results.archives.firstScan).toLocaleDateString()}
                        </span>
                      }
                    />
                  )}
                  {result.results.archives?.lastScan && (
                    <KeyValue
                      label="LAST SCANNED"
                      value={
                        <span className="text-xs">
                          {new Date(result.results.archives.lastScan).toLocaleDateString()}
                        </span>
                      }
                    />
                  )}
                </div>
              </InfoCard>
            )}

            {hasData("socialTags") && (
              <InfoCard icon={Tag} title="SOCIAL TAGS">
                <div className="space-y-2 text-sm font-mono">
                  {result.results.socialTags?.description && (
                    <div className="text-xs line-clamp-2" style={{ color: theme.colors.accent }}>
                      {result.results.socialTags.description}
                    </div>
                  )}
                  {result.results.socialTags?.keywords && (
                    <KeyValue
                      label="KEYWORDS"
                      value={
                        <span className="text-xs">
                          {result.results.socialTags.keywords.split(",").length} tags
                        </span>
                      }
                    />
                  )}
                </div>
              </InfoCard>
            )}

            {hasData("quality") && (
              <Card className="p-6" variant="hacker">
                <h3
                  className="text-lg font-bold smooch-sans flex items-center gap-2 mb-4"
                  style={{ color: theme.colors.primary }}
                >
                  <Award className="w-5 h-5" />
                  QUALITY SCORE
                </h3>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2" style={{ color: theme.colors.accent }}>
                      {result.results.quality?.overall || 0}
                    </div>
                    <div
                      className="text-xs font-mono"
                      style={{ color: theme.colors.foreground, opacity: 0.7 }}
                    >
                      OVERALL SCORE
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm font-mono">
                    <div className="text-center">
                      <div className="text-xl font-bold" style={{ color: theme.colors.accent }}>
                        {result.results.quality?.performance?.score || 0}
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: theme.colors.foreground, opacity: 0.7 }}
                      >
                        PERFORMANCE
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold" style={{ color: theme.colors.accent }}>
                        {result.results.quality?.seo?.score || 0}
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: theme.colors.foreground, opacity: 0.7 }}
                      >
                        SEO
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold" style={{ color: theme.colors.accent }}>
                        {result.results.quality?.accessibility?.score || 0}
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: theme.colors.foreground, opacity: 0.7 }}
                      >
                        ACCESSIBILITY
                      </div>
                    </div>
                  </div>
                  {(result.results.quality?.performance?.issues?.length > 0 ||
                    result.results.quality?.seo?.issues?.length > 0 ||
                    result.results.quality?.accessibility?.issues?.length > 0) && (
                    <div
                      className="mt-4 pt-4 border-t space-y-2 text-xs"
                      style={{ borderColor: hexToRgba(theme.colors.primary, 0.3) }}
                    >
                      {result.results.quality?.performance?.issues?.map(
                        (issue: string, i: number) => (
                          <div key={i} style={{ color: theme.colors.secondary }}>
                            • {issue}
                          </div>
                        )
                      )}
                      {result.results.quality?.seo?.issues?.map((issue: string, i: number) => (
                        <div key={i} style={{ color: theme.colors.secondary }}>
                          • {issue}
                        </div>
                      ))}
                      {result.results.quality?.accessibility?.issues?.map(
                        (issue: string, i: number) => (
                          <div key={i} style={{ color: theme.colors.secondary }}>
                            • {issue}
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {hasData("traceRoute") && (
              <InfoCard icon={Route} title="TRACEROUTE">
                <div className="space-y-2 text-sm font-mono">
                  {result.results.traceRoute?.hops && result.results.traceRoute.hops.length > 0 ? (
                    result.results.traceRoute.hops.map((hop: any, idx: number) => (
                      <KeyValue
                        key={idx}
                        label={`HOP ${hop.hop}`}
                        value={hop.ip || hop.hostname || "Unknown"}
                      />
                    ))
                  ) : (
                    <div style={{ color: theme.colors.foreground, opacity: 0.7 }}>
                      No route information available
                    </div>
                  )}
                </div>
              </InfoCard>
            )}

            {hasData("mailConfig") && (
              <Card className="p-6" variant="hacker">
                <h3
                  className="text-lg font-bold smooch-sans flex items-center gap-2 mb-4"
                  style={{ color: theme.colors.primary }}
                >
                  <Mail className="w-5 h-5" />
                  MAIL CONFIG
                </h3>
                <div className="space-y-3 text-sm font-mono">
                  {result.results.mailConfig?.mx && result.results.mailConfig.mx.length > 0 && (
                    <div>
                      <span style={{ color: theme.colors.foreground, opacity: 0.7 }}>
                        MX RECORDS:
                      </span>
                      <div className="mt-1 space-y-1">
                        {result.results.mailConfig.mx.map((mx: any, idx: number) => (
                          <div key={idx} className="text-xs" style={{ color: theme.colors.accent }}>
                            {mx.priority} - {mx.exchange}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    {result.results.mailConfig?.spf?.exists ? (
                      <CheckCircle className="w-4 h-4" style={{ color: theme.colors.primary }} />
                    ) : (
                      <XCircle className="w-4 h-4" style={{ color: theme.colors.accent }} />
                    )}
                    <span style={{ color: theme.colors.accent }}>SPF Record</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.results.mailConfig?.dkim?.exists ? (
                      <CheckCircle className="w-4 h-4" style={{ color: theme.colors.primary }} />
                    ) : (
                      <XCircle className="w-4 h-4" style={{ color: theme.colors.accent }} />
                    )}
                    <span style={{ color: theme.colors.accent }}>DKIM Record</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.results.mailConfig?.dmarc?.exists ? (
                      <CheckCircle className="w-4 h-4" style={{ color: theme.colors.primary }} />
                    ) : (
                      <XCircle className="w-4 h-4" style={{ color: theme.colors.accent }} />
                    )}
                    <span style={{ color: theme.colors.accent }}>DMARC Record</span>
                    {result.results.mailConfig?.dmarc?.policy && (
                      <span
                        className="text-xs ml-2"
                        style={{ color: theme.colors.foreground, opacity: 0.7 }}
                      >
                        ({result.results.mailConfig.dmarc.policy})
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {hasData("rank") && (
              <InfoCard icon={TrendingUp} title="RANKING">
                <div className="space-y-2 text-sm font-mono">
                  {result.results.rank?.alexa ? (
                    <KeyValue
                      label="ALEXA RANK"
                      value={`#${result.results.rank.alexa.toLocaleString()}`}
                    />
                  ) : (
                    <div style={{ color: theme.colors.foreground, opacity: 0.7 }}>
                      Ranking data not available
                    </div>
                  )}
                </div>
              </InfoCard>
            )}

            {hasData("screenshot") && result.results.screenshot?.url && (
              <Card className="p-6 md:col-span-2" variant="hacker">
                <h3
                  className="text-lg font-bold smooch-sans flex items-center gap-2 mb-4"
                  style={{ color: theme.colors.primary }}
                >
                  <Camera className="w-5 h-5" />
                  SCREENSHOT
                </h3>
                {result.results.screenshot.url && (
                  <div className="space-y-2">
                    <img
                      src={result.results.screenshot.url}
                      alt="Website screenshot"
                      className="w-full border-2 rounded"
                      style={{ borderColor: hexToRgba(theme.colors.primary, 0.3) }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <div
                      className="text-xs font-mono"
                      style={{ color: theme.colors.foreground, opacity: 0.7 }}
                    >
                      {result.results.screenshot.width}x{result.results.screenshot.height}px
                      {result.results.screenshot.service &&
                        ` • ${result.results.screenshot.service}`}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {hasData("tlsCipherSuites") && (
              <InfoCard icon={Settings} title="TLS CIPHER SUITES">
                <div className="space-y-3 text-sm font-mono">
                  {result.results.tlsCipherSuites?.grade && (
                    <KeyValue
                      label="SSL LABS GRADE"
                      value={
                        <span className="font-bold">{result.results.tlsCipherSuites.grade}</span>
                      }
                    />
                  )}
                  {result.results.tlsCipherSuites?.supported &&
                    result.results.tlsCipherSuites.supported.length > 0 && (
                      <KeyValue
                        label="SUPPORTED"
                        value={result.results.tlsCipherSuites.supported.length}
                      />
                    )}
                  {result.results.tlsCipherSuites?.recommended &&
                    result.results.tlsCipherSuites.recommended.length > 0 && (
                      <KeyValue
                        label="RECOMMENDED"
                        value={result.results.tlsCipherSuites.recommended.length}
                      />
                    )}
                  {result.results.tlsCipherSuites?.weak &&
                    result.results.tlsCipherSuites.weak.length > 0 && (
                      <div>
                        <span style={{ color: theme.colors.accent, opacity: 0.7 }}>WEAK:</span>
                        <span className="ml-2" style={{ color: theme.colors.accent, opacity: 0.8 }}>
                          {result.results.tlsCipherSuites.weak.length}
                        </span>
                      </div>
                    )}
                </div>
              </InfoCard>
            )}

            {hasData("tlsSecurityConfig") && (
              <Card className="p-6" variant="hacker">
                <h3
                  className="text-lg font-bold smooch-sans flex items-center gap-2 mb-4"
                  style={{ color: theme.colors.primary }}
                >
                  <Shield className="w-5 h-5" />
                  TLS SECURITY
                </h3>
                <div className="space-y-3 text-sm font-mono">
                  {result.results.tlsSecurityConfig?.protocol && (
                    <div>
                      <span style={{ color: theme.colors.foreground, opacity: 0.7 }}>
                        PROTOCOL:
                      </span>
                      <span className="ml-2" style={{ color: theme.colors.accent }}>
                        {result.results.tlsSecurityConfig.protocol}
                      </span>
                    </div>
                  )}
                  {result.results.tlsSecurityConfig?.grade && (
                    <div>
                      <span style={{ color: theme.colors.foreground, opacity: 0.7 }}>GRADE:</span>
                      <span className="ml-2 font-bold" style={{ color: theme.colors.accent }}>
                        {result.results.tlsSecurityConfig.grade}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    {result.results.tlsSecurityConfig?.certificate?.valid ? (
                      <CheckCircle className="w-4 h-4" style={{ color: theme.colors.primary }} />
                    ) : (
                      <XCircle className="w-4 h-4" style={{ color: theme.colors.accent }} />
                    )}
                    <span style={{ color: theme.colors.accent }}>Certificate Valid</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.results.tlsSecurityConfig?.hsts ? (
                      <CheckCircle className="w-4 h-4" style={{ color: theme.colors.primary }} />
                    ) : (
                      <XCircle className="w-4 h-4" style={{ color: theme.colors.accent }} />
                    )}
                    <span style={{ color: theme.colors.accent }}>HSTS Enabled</span>
                  </div>
                  {result.results.tlsSecurityConfig?.issues &&
                    result.results.tlsSecurityConfig.issues.length > 0 && (
                      <div
                        className="mt-2 pt-2 border-t"
                        style={{ borderColor: hexToRgba(theme.colors.primary, 0.3) }}
                      >
                        {result.results.tlsSecurityConfig.issues.map((issue: string, i: number) => (
                          <div
                            key={i}
                            className="text-xs"
                            style={{ color: theme.colors.secondary }}
                          >
                            • {issue}
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              </Card>
            )}

            {hasData("tlsClientSupport") && (
              <Card className="p-6" variant="hacker">
                <h3
                  className="text-lg font-bold smooch-sans flex items-center gap-2 mb-4"
                  style={{ color: theme.colors.primary }}
                >
                  <Zap className="w-5 h-5" />
                  TLS CLIENT SUPPORT
                </h3>
                <div className="space-y-2 text-sm font-mono">
                  <div className="flex items-center gap-2">
                    {result.results.tlsClientSupport?.tls13 ? (
                      <CheckCircle className="w-4 h-4" style={{ color: theme.colors.primary }} />
                    ) : (
                      <XCircle className="w-4 h-4" style={{ color: theme.colors.accent }} />
                    )}
                    <span style={{ color: theme.colors.accent }}>TLS 1.3</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.results.tlsClientSupport?.tls12 ? (
                      <CheckCircle className="w-4 h-4" style={{ color: theme.colors.primary }} />
                    ) : (
                      <XCircle className="w-4 h-4" style={{ color: theme.colors.accent }} />
                    )}
                    <span style={{ color: theme.colors.accent }}>TLS 1.2</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.results.tlsClientSupport?.tls11 ? (
                      <CheckCircle className="w-4 h-4" style={{ color: theme.colors.secondary }} />
                    ) : (
                      <XCircle
                        className="w-4 h-4"
                        style={{ color: theme.colors.foreground, opacity: 0.5 }}
                      />
                    )}
                    <span style={{ color: theme.colors.accent }}>TLS 1.1 (Deprecated)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.results.tlsClientSupport?.tls10 ? (
                      <CheckCircle className="w-4 h-4" style={{ color: theme.colors.secondary }} />
                    ) : (
                      <XCircle
                        className="w-4 h-4"
                        style={{ color: theme.colors.foreground, opacity: 0.5 }}
                      />
                    )}
                    <span style={{ color: theme.colors.accent }}>TLS 1.0 (Deprecated)</span>
                  </div>
                  {result.results.tlsClientSupport?.recommended &&
                    result.results.tlsClientSupport.recommended.length > 0 && (
                      <div
                        className="mt-3 pt-3 border-t"
                        style={{ borderColor: hexToRgba(theme.colors.primary, 0.3) }}
                      >
                        <div
                          className="text-xs mb-1"
                          style={{ color: theme.colors.foreground, opacity: 0.7 }}
                        >
                          RECOMMENDATIONS:
                        </div>
                        {result.results.tlsClientSupport.recommended.map(
                          (rec: string, i: number) => (
                            <div
                              key={i}
                              className="text-xs"
                              style={{ color: theme.colors.secondary }}
                            >
                              • {rec}
                            </div>
                          )
                        )}
                      </div>
                    )}
                </div>
              </Card>
            )}

            {hasData("features") && (
              <InfoCard icon={Star} title="WEBSITE FEATURES">
                <div className="space-y-2 text-sm font-mono">
                  {[
                    { key: "pwa", label: "Progressive Web App" },
                    { key: "serviceWorker", label: "Service Worker" },
                    { key: "webPush", label: "Web Push Notifications" },
                    { key: "offline", label: "Offline Support" },
                    { key: "responsive", label: "Responsive Design" },
                    { key: "darkMode", label: "Dark Mode" },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2">
                      {result.results.features?.[key as keyof typeof result.results.features] ? (
                        <CheckCircle className="w-4 h-4" style={{ color: theme.colors.primary }} />
                      ) : (
                        <XCircle
                          className="w-4 h-4"
                          style={{ color: theme.colors.foreground, opacity: 0.5 }}
                        />
                      )}
                      <span style={{ color: theme.colors.accent }}>{label}</span>
                    </div>
                  ))}
                </div>
              </InfoCard>
            )}

            {hasData("carbon") && (
              <Card className="p-6" variant="hacker">
                <h3
                  className="text-lg font-bold smooch-sans flex items-center gap-2 mb-4"
                  style={{ color: theme.colors.primary }}
                >
                  <Leaf className="w-5 h-5" />
                  CARBON FOOTPRINT
                </h3>
                <div className="space-y-3 text-sm font-mono">
                  <div>
                    <span style={{ color: theme.colors.foreground, opacity: 0.7 }}>EMISSIONS:</span>
                    <span className="ml-2" style={{ color: theme.colors.accent }}>
                      {result.results.carbon?.emissions?.toFixed(4) || 0} g CO₂
                    </span>
                  </div>
                  <div>
                    <span style={{ color: theme.colors.foreground, opacity: 0.7 }}>
                      CLEANER THAN:
                    </span>
                    <span className="ml-2" style={{ color: theme.colors.accent }}>
                      {result.results.carbon?.cleanerThan || 0}% of websites
                    </span>
                  </div>
                  <div>
                    <span style={{ color: theme.colors.foreground, opacity: 0.7 }}>PAGE SIZE:</span>
                    <span className="ml-2" style={{ color: theme.colors.accent }}>
                      {(result.results.carbon?.size || 0) / 1024} KB
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.results.carbon?.greenHosting ? (
                      <CheckCircle className="w-4 h-4" style={{ color: theme.colors.primary }} />
                    ) : (
                      <XCircle
                        className="w-4 h-4"
                        style={{ color: theme.colors.foreground, opacity: 0.5 }}
                      />
                    )}
                    <span style={{ color: theme.colors.accent }}>Green Hosting</span>
                  </div>
                  {result.results.carbon?.recommendations &&
                    result.results.carbon.recommendations.length > 0 && (
                      <div
                        className="mt-3 pt-3 border-t"
                        style={{ borderColor: hexToRgba(theme.colors.primary, 0.3) }}
                      >
                        <div
                          className="text-xs mb-1"
                          style={{ color: theme.colors.foreground, opacity: 0.7 }}
                        >
                          RECOMMENDATIONS:
                        </div>
                        {result.results.carbon.recommendations.map((rec: string, i: number) => (
                          <div key={i} className="text-yellow-400 text-xs">
                            • {rec}
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              </Card>
            )}

            {hasData("location") &&
              result.results.location?.latitude &&
              result.results.location?.longitude && (
                <Card className="p-6 md:col-span-3" variant="hacker">
                  <h3
                    className="text-lg font-bold smooch-sans flex items-center gap-2 mb-4"
                    style={{ color: theme.colors.primary }}
                  >
                    <MapPin className="w-5 h-5" />
                    SERVER LOCATION
                  </h3>
                  <div className="space-y-4">
                    <Map
                      latitude={result.results.location.latitude}
                      longitude={result.results.location.longitude}
                      city={result.results.location.city}
                      country={result.results.location.country}
                      className="mb-4"
                    />
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm font-mono">
                      {result.results.location?.city && (
                        <div>
                          <span style={{ color: theme.colors.foreground, opacity: 0.7 }}>
                            CITY:
                          </span>
                          <span className="ml-2" style={{ color: theme.colors.accent }}>
                            {result.results.location.city}
                          </span>
                        </div>
                      )}
                      {result.results.location?.country && (
                        <div>
                          <span style={{ color: theme.colors.foreground, opacity: 0.7 }}>
                            COUNTRY:
                          </span>
                          <span className="ml-2" style={{ color: theme.colors.accent }}>
                            {result.results.location.country}
                          </span>
                        </div>
                      )}
                      {result.results.location?.region && (
                        <div>
                          <span style={{ color: theme.colors.foreground, opacity: 0.7 }}>
                            REGION:
                          </span>
                          <span className="ml-2" style={{ color: theme.colors.accent }}>
                            {result.results.location.region}
                          </span>
                        </div>
                      )}
                      {result.results.location?.timezone && (
                        <div>
                          <span style={{ color: theme.colors.foreground, opacity: 0.7 }}>
                            TIMEZONE:
                          </span>
                          <span className="ml-2" style={{ color: theme.colors.accent }}>
                            {result.results.location.timezone}
                          </span>
                        </div>
                      )}
                      {result.results.location?.currency && (
                        <div>
                          <span style={{ color: theme.colors.foreground, opacity: 0.7 }}>
                            CURRENCY:
                          </span>
                          <span className="ml-2" style={{ color: theme.colors.accent }}>
                            {result.results.location.currency}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
