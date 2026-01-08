'use client';

import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import Lottie from 'lottie-react';
import { Globe, CheckCircle, XCircle, RotateCcw, Info, AlertCircle, MapPin, Activity, Shield, Server, Lock, Eye, Cookie, Tag, FileText, Network, Key, Link2, Search, Archive, List, Code2, ExternalLink, ChevronDown, ChevronUp, Award, Route, Mail, TrendingUp, Camera, Settings, Zap, Star, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Map } from '@/components/ui/Map';
import { apiClient } from '@/lib/api-client';
import heartbeatAnimation from '@/animations/heartbeat ECG.json';

interface JobResult {
  name: string;
  status: 'success' | 'error' | 'skipped';
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
  const [url, setUrl] = useState('');
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
        const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
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
      setError('Please enter a URL');
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
        repeat: 1
      });
    }

    const response = await apiClient.webCheck<WebCheckData>(url, false);

    if (response.success && response.data) {
      setResult(response.data);
    } else {
      setError(response.error || 'Failed to analyze website');
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
    
    if (typeof job.data === 'object') {
      const keys = Object.keys(job.data);
      if (keys.length === 0) {
        return false;
      }
      
      if (job.name === 'tech-stack') {
        const technologies = (job.data as any).technologies;
        if (!technologies || !Array.isArray(technologies) || technologies.length === 0) {
          return false;
        }
        const infrastructureServices = [
          'cloudflare', 'aws cloudfront', 'fastly', 'cloudfront',
          'google analytics', 'google tag manager'
        ];
        const hasNonInfrastructure = technologies.some((tech: any) => {
          const normalizedName = tech.name?.toLowerCase().trim();
          return normalizedName && !infrastructureServices.includes(normalizedName);
        });
        return hasNonInfrastructure;
      }
      
      if (job.name === 'social-tags') {
        const socialTags = job.data as any;
        return !!(socialTags.description || socialTags.keywords || socialTags.canonicalUrl || socialTags.author || socialTags.banner);
      }
      
      for (const key of keys) {
        const value = (job.data as any)[key];
        if (value !== null && value !== undefined) {
          if (Array.isArray(value) && value.length > 0) {
            return true;
          }
          if (!Array.isArray(value) && typeof value !== 'object') {
            return true;
          }
          if (typeof value === 'object' && Object.keys(value).length > 0) {
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
    
    const successful = result.jobs.filter(j => j.status === 'success' && hasMeaningfulData(j)).length;
    const failed = result.jobs.filter(j => j.status === 'error').length;
    const noData = result.jobs.filter(j => j.status === 'success' && !hasMeaningfulData(j)).length;
    const total = result.jobs.length;
    
    return { successful, failed, noData, total };
  };

  const getFailedJobs = () => {
    if (!result) return [];
    return result.jobs.filter(j => j.status === 'error');
  };

  const getTechStack = () => {
    if (!result) return [];
    const techStackJob = result.jobs.find(j => j.name === 'tech-stack');
    if (techStackJob?.data?.technologies) {
      const technologies = techStackJob.data.technologies;
      const seen = new Set<string>();
      const unique: any[] = [];
      
      const infrastructureServices = [
        'cloudflare', 'aws cloudfront', 'fastly', 'cloudfront',
        'google analytics', 'google tag manager'
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
            name: tech.name?.charAt(0).toUpperCase() + tech.name?.slice(1).toLowerCase() || tech.name
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
    if (typeof value === 'object' && Object.keys(value).length === 0) return false;
    return true;
  };

  const getDomainName = () => {
    if (!result) return 'Unknown';
    return result.results.domain?.registered?.toLowerCase() || 
           result.results.ssl?.subject || 
           (() => {
             try {
               return new URL(url).hostname;
             } catch {
               try {
                 return new URL(`https://${url}`).hostname;
               } catch {
                 return url || 'Unknown';
               }
             }
           })();
  };

  const progress = getJobProgress();
  const failedJobs = getFailedJobs();
  const techStack = getTechStack();

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6 min-h-screen bg-black">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Globe className="w-12 h-12 text-green-500 animate-pulse" />
          <h1 className="text-5xl font-bold text-green-500 smooch-sans font-effect-anaglyph tracking-wider">
            WEB CHECK
          </h1>
        </div>
        <p className="text-green-400/70 font-mono text-sm">
          {'>'} Comprehensive website analysis and security check
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
              onKeyPress={(e) => e.key === 'Enter' && !loading && handleCheck()}
              className="flex-1 bg-black border-green-500/50 text-green-500 placeholder:text-green-500/30 font-mono focus:border-green-500 focus:ring-green-500"
            />
            <Button
              onClick={handleCheck}
              disabled={loading}
              size="md"
              className="bg-green-500/20 border-green-500 text-green-500 hover:bg-green-500/30 font-mono relative overflow-hidden min-w-[120px]"
            >
              {loading ? (
                <>
                  <span className="invisible">SCAN</span>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Lottie 
                      animationData={heartbeatAnimation} 
                      loop={true}
                      style={{ width: '100%', height: '100%' }}
                    />
                  </div>
                </>
              ) : (
                <span className="relative z-10">SCAN</span>
              )}
            </Button>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border-2 border-red-500 rounded-lg">
              <p className="text-red-500 font-mono">{error}</p>
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
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <h2 className="text-2xl font-bold text-green-500 smooch-sans font-effect-anaglyph">
                    {getDomainName()}
                  </h2>
                </div>
                <div className="text-green-400/70 font-mono text-sm">
                  {'>'} Completed in {formatDuration(result.summary?.totalTime || 0)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-500/10 border-2 border-green-500 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-green-500 font-mono">SUCCESS</span>
                  </div>
                  <p className="text-3xl font-bold text-green-400 font-mono">{progress.successful}</p>
                  <p className="text-xs text-green-500/70 font-mono mt-1">Jobs with data</p>
                </div>
                
                <div className="bg-red-500/10 border-2 border-red-500 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-medium text-red-500 font-mono">FAILED</span>
                  </div>
                  <p className="text-3xl font-bold text-red-400 font-mono">{progress.failed}</p>
                  <p className="text-xs text-red-500/70 font-mono mt-1">Jobs with errors</p>
                </div>
                
                <div className="bg-yellow-500/10 border-2 border-yellow-500 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm font-medium text-yellow-500 font-mono">NO DATA</span>
                  </div>
                  <p className="text-3xl font-bold text-yellow-400 font-mono">{progress.noData}</p>
                  <p className="text-xs text-yellow-500/70 font-mono mt-1">Jobs without data</p>
                </div>
                
                <div className="bg-blue-500/10 border-2 border-blue-500 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium text-blue-500 font-mono">TOTAL</span>
                  </div>
                  <p className="text-3xl font-bold text-blue-400 font-mono">{progress.total}</p>
                  <p className="text-xs text-blue-500/70 font-mono mt-1">Total jobs</p>
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
                <h3 className="text-xl font-bold text-red-500 smooch-sans flex items-center gap-2">
                  <XCircle className="w-6 h-6" />
                  FAILED JOBS ({failedJobs.length})
                </h3>
                {expandedFailedJobs ? (
                  <ChevronUp className="w-5 h-5 text-green-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-green-500" />
                )}
              </div>
              {expandedFailedJobs && (
                <div className="space-y-3">
                  {failedJobs.map((job, idx) => (
                    <div key={idx} className="border-2 border-red-500/50 rounded-lg p-4 bg-red-500/5">
                      <div className="flex items-center gap-3 mb-2">
                        <XCircle className="w-5 h-5 text-red-500" />
                        <span className="text-green-400 font-mono font-semibold">{job.name.toUpperCase()}</span>
                        <span className="text-green-500/50 font-mono text-xs">({formatDuration(job.duration)})</span>
                      </div>
                      <p className="text-red-400 font-mono text-sm">
                        <span className="text-green-500/70">ERROR:</span> {job.error || 'Unknown error occurred'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {hasData('ip') && result.results.ip && (
              <Card className="p-6" variant="hacker">
                <h3 className="text-lg font-bold text-green-500 smooch-sans flex items-center gap-2 mb-4">
                  <Network className="w-5 h-5" />
                  IP ADDRESS
                </h3>
                <p className="text-green-400 font-mono text-sm">{result.results.ip}</p>
              </Card>
            )}

            {hasData('status') && (
              <Card className="p-6" variant="hacker">
                <h3 className="text-lg font-bold text-green-500 smooch-sans flex items-center gap-2 mb-4">
                  <Activity className="w-5 h-5" />
                  SERVER STATUS
                </h3>
                <div className="space-y-2 text-sm font-mono">
                  <div className="flex items-center gap-2">
                    {result.results.status?.isUp ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-green-400">IS UP?</span>
                  </div>
                  <div>
                    <span className="text-green-500/70">STATUS CODE:</span>
                    <span className="text-green-400 ml-2">{result.results.status?.statusCode}</span>
                  </div>
                  <div>
                    <span className="text-green-500/70">RESPONSE TIME:</span>
                    <span className="text-green-400 ml-2">{result.results.status?.responseTime}ms</span>
                  </div>
                </div>
              </Card>
            )}

            {hasData('serverInfo') && (
              <Card className="p-6" variant="hacker">
                <h3 className="text-lg font-bold text-green-500 smooch-sans flex items-center gap-2 mb-4">
                  <Server className="w-5 h-5" />
                  SERVER INFO
                </h3>
                <div className="space-y-2 text-sm font-mono">
                  {result.results.serverInfo?.server && (
                    <div>
                      <span className="text-green-500/70">SERVER:</span>
                      <span className="text-green-400 ml-2">{result.results.serverInfo.server}</span>
                    </div>
                  )}
                  {result.results.serverInfo?.poweredBy && (
                    <div>
                      <span className="text-green-500/70">POWERED BY:</span>
                      <span className="text-green-400 ml-2">{result.results.serverInfo.poweredBy}</span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {techStack.length > 0 && (
              <Card className="p-6" variant="hacker">
                <h3 className="text-lg font-bold text-green-500 smooch-sans flex items-center gap-2 mb-4">
                  <Code2 className="w-5 h-5" />
                  TECH STACK
                </h3>
                <div className="space-y-2 text-sm font-mono">
                  {techStack.map((tech: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-green-400">{tech.name}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        tech.confidence === 'high' ? 'bg-green-500/20 text-green-400' :
                        tech.confidence === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {tech.confidence?.toUpperCase() || 'LOW'}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {hasData('ssl') && (
              <Card className="p-6" variant="hacker">
                <h3 className="text-lg font-bold text-green-500 smooch-sans flex items-center gap-2 mb-4">
                  <Lock className="w-5 h-5" />
                  SSL CERTIFICATE
                </h3>
                <div className="space-y-2 text-sm font-mono">
                  {result.results.ssl?.subject && (
                    <div>
                      <span className="text-green-500/70">SUBJECT:</span>
                      <span className="text-green-400 ml-2 text-xs break-all">{result.results.ssl.subject}</span>
                    </div>
                  )}
                  {result.results.ssl?.issuer && (
                    <div>
                      <span className="text-green-500/70">ISSUER:</span>
                      <span className="text-green-400 ml-2 text-xs break-all">{result.results.ssl.issuer}</span>
                    </div>
                  )}
                  {result.results.ssl?.daysRemaining !== undefined && (
                    <div>
                      <span className="text-green-500/70">DAYS REMAINING:</span>
                      <span className={`ml-2 font-mono ${result.results.ssl.daysRemaining < 30 ? 'text-red-500' : 'text-green-400'}`}>
                        {result.results.ssl.daysRemaining}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {hasData('domain') && (
              <Card className="p-6" variant="hacker">
                <h3 className="text-lg font-bold text-green-500 smooch-sans flex items-center gap-2 mb-4">
                  <Globe className="w-5 h-5" />
                  DOMAIN INFO
                </h3>
                <div className="space-y-2 text-sm font-mono">
                  {result.results.domain?.creationDate && (
                    <div>
                      <span className="text-green-500/70">CREATED:</span>
                      <span className="text-green-400 ml-2">{result.results.domain.creationDate}</span>
                    </div>
                  )}
                  {result.results.domain?.expiryDate && (
                    <div>
                      <span className="text-green-500/70">EXPIRES:</span>
                      <span className="text-green-400 ml-2">{result.results.domain.expiryDate}</span>
                    </div>
                  )}
                  {result.results.domain?.registrar && (
                    <div>
                      <span className="text-green-500/70">REGISTRAR:</span>
                      <span className="text-green-400 ml-2 text-xs break-all">{result.results.domain.registrar}</span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {hasData('httpSecurity') && (
              <Card className="p-6" variant="hacker">
                <h3 className="text-lg font-bold text-green-500 smooch-sans flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5" />
                  HTTP SECURITY HEADERS
                </h3>
                <div className="space-y-3 text-sm font-mono">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {result.results.httpSecurity?.contentSecurityPolicy ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-green-400 font-semibold">CSP (Content Security Policy)</span>
                    </div>
                    <p className="text-green-500/60 text-xs ml-6">
                      {result.results.httpSecurity?.contentSecurityPolicy 
                        ? 'Active - Prevents XSS attacks by controlling which resources can be loaded'
                        : 'Missing - Site vulnerable to cross-site scripting (XSS) attacks'}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {result.results.httpSecurity?.strictTransportSecurity ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-green-400 font-semibold">HSTS (HTTP Strict Transport Security)</span>
                    </div>
                    <p className="text-green-500/60 text-xs ml-6">
                      {result.results.httpSecurity?.strictTransportSecurity 
                        ? 'Active - Forces browsers to use HTTPS connection only'
                        : 'Missing - Site may be accessed over insecure HTTP connection'}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {result.results.httpSecurity?.xContentTypeOptions ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-green-400 font-semibold">X-Content-Type-Options</span>
                    </div>
                    <p className="text-green-500/60 text-xs ml-6">
                      {result.results.httpSecurity?.xContentTypeOptions 
                        ? 'Active - Prevents browsers from MIME-sniffing content types'
                        : 'Missing - Browsers may misinterpret file types, leading to security risks'}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {result.results.httpSecurity?.xFrameOptions ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-green-400 font-semibold">X-Frame-Options</span>
                    </div>
                    <p className="text-green-500/60 text-xs ml-6">
                      {result.results.httpSecurity?.xFrameOptions 
                        ? 'Active - Prevents site from being embedded in iframes (clickjacking protection)'
                        : 'Missing - Site vulnerable to clickjacking attacks'}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {hasData('cookies') && result.results.cookies?.cookies && result.results.cookies.cookies.length > 0 && (
              <Card className="p-6" variant="hacker">
                <h3 className="text-lg font-bold text-green-500 smooch-sans flex items-center gap-2 mb-4">
                  <Cookie className="w-5 h-5" />
                  COOKIES ({result.results.cookies.cookies.length})
                </h3>
                <div className="space-y-3 text-sm font-mono max-h-96 overflow-y-auto">
                  {result.results.cookies.cookies.map((cookie: any, idx: number) => (
                    <div key={idx} className="border border-green-500/30 rounded p-3 bg-black/50">
                      <div className="text-green-400 font-semibold mb-2 break-all">{cookie.name}</div>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-green-500/70">Secure:</span>
                          {cookie.hasSecure ? (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-green-500/70">HttpOnly:</span>
                          {cookie.hasHttpOnly ? (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-green-500/70">SameSite:</span>
                          {cookie.hasSameSite ? (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-500" />
                          )}
                        </div>
                        {cookie.issues && cookie.issues.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-green-500/20">
                            <div className="text-red-400 text-xs">
                              {cookie.issues.map((issue: string, i: number) => (
                                <div key={i}>• {issue}</div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {result.results.cookies.overallIssues && result.results.cookies.overallIssues.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-green-500/30">
                      <div className="text-yellow-400 text-xs">
                        <div className="font-semibold mb-1">Overall Issues:</div>
                        {result.results.cookies.overallIssues.map((issue: string, i: number) => (
                          <div key={i}>• {issue}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {hasData('dns') && (
              <Card className="p-6" variant="hacker">
                <h3 className="text-lg font-bold text-green-500 smooch-sans flex items-center gap-2 mb-4">
                  <Eye className="w-5 h-5" />
                  DNS RECORDS
                </h3>
                <div className="space-y-4 text-sm font-mono max-h-96 overflow-y-auto">
                  {result.results.dns?.a && result.results.dns.a.length > 0 && (
                    <div>
                      <div className="text-green-500/70 mb-2 font-semibold">
                        A Records ({result.results.dns.a.length}):
                      </div>
                      <div className="space-y-1 ml-4">
                        {result.results.dns.a.map((record: string, idx: number) => (
                          <div key={idx} className="text-green-400 text-xs break-all">
                            • {record}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.results.dns?.aaaa && result.results.dns.aaaa.length > 0 && (
                    <div>
                      <div className="text-green-500/70 mb-2 font-semibold">
                        AAAA Records ({result.results.dns.aaaa.length}):
                      </div>
                      <div className="space-y-1 ml-4">
                        {result.results.dns.aaaa.map((record: string, idx: number) => (
                          <div key={idx} className="text-green-400 text-xs break-all">
                            • {record}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.results.dns?.mx && result.results.dns.mx.length > 0 && (
                    <div>
                      <div className="text-green-500/70 mb-2 font-semibold">
                        MX Records ({result.results.dns.mx.length}):
                      </div>
                      <div className="space-y-1 ml-4">
                        {result.results.dns.mx.map((record: any, idx: number) => (
                          <div key={idx} className="text-green-400 text-xs break-all">
                            • {record.exchange} (Priority: {record.priority})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.results.dns?.ns && result.results.dns.ns.length > 0 && (
                    <div>
                      <div className="text-green-500/70 mb-2 font-semibold">
                        NS Records ({result.results.dns.ns.length}):
                      </div>
                      <div className="space-y-1 ml-4">
                        {result.results.dns.ns.map((record: string, idx: number) => (
                          <div key={idx} className="text-green-400 text-xs break-all">
                            • {record}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.results.dns?.cname && result.results.dns.cname.length > 0 && (
                    <div>
                      <div className="text-green-500/70 mb-2 font-semibold">
                        CNAME Records ({result.results.dns.cname.length}):
                      </div>
                      <div className="space-y-1 ml-4">
                        {result.results.dns.cname.map((record: string, idx: number) => (
                          <div key={idx} className="text-green-400 text-xs break-all">
                            • {record}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.results.dns?.txt && result.results.dns.txt.length > 0 && (
                    <div>
                      <div className="text-green-500/70 mb-2 font-semibold">
                        TXT Records ({result.results.dns.txt.length}):
                      </div>
                      <div className="space-y-1 ml-4">
                        {result.results.dns.txt.map((record: any, idx: number) => (
                          <div key={idx} className="text-green-400 text-xs break-all">
                            • {Array.isArray(record) ? record.join(' ') : record}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {hasData('redirects') && (
              <Card className="p-6" variant="hacker">
                <h3 className="text-lg font-bold text-green-500 smooch-sans flex items-center gap-2 mb-4">
                  <Link2 className="w-5 h-5" />
                  HTTP REDIRECTS
                </h3>
                <div className="space-y-2 text-sm font-mono">
                  <div>
                    <p className="text-green-400 font-semibold">
                      {result.results.redirects?.count || 0} redirect{(result.results.redirects?.count || 0) !== 1 ? 's' : ''} detected
                    </p>
                  </div>
                  <p className="text-green-500/60 text-xs">
                    {result.results.redirects?.count === 0 
                      ? 'No redirects found - URL resolves directly to the final destination'
                      : `Site redirects ${result.results.redirects?.count} time${(result.results.redirects?.count || 0) !== 1 ? 's' : ''} before reaching the final page. Multiple redirects can slow down page loading.`}
                  </p>
                </div>
              </Card>
            )}

            {hasData('hsts') && (
              <Card className="p-6" variant="hacker">
                <h3 className="text-lg font-bold text-green-500 smooch-sans flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5" />
                  HSTS (HTTP STRICT TRANSPORT SECURITY)
                </h3>
                <div className="space-y-3 text-sm font-mono">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {result.results.hsts?.enabled ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-green-400 font-semibold">
                        {result.results.hsts?.enabled ? 'Enabled' : 'Not Enabled'}
                      </span>
                    </div>
                    <p className="text-green-500/60 text-xs ml-6">
                      {result.results.hsts?.enabled 
                        ? 'Active - Browsers will only connect via HTTPS, preventing man-in-the-middle attacks'
                        : 'Disabled - Site can be accessed over insecure HTTP, making it vulnerable to attacks'}
                    </p>
                  </div>
                  {result.results.hsts?.preload && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-green-400 font-semibold">Preload Enabled</span>
                      </div>
                      <p className="text-green-500/60 text-xs ml-6">
                        Site is in browser preload lists - maximum security protection enabled
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {hasData('threats') && (
              <Card className="p-6" variant="hacker">
                <h3 className="text-lg font-bold text-green-500 smooch-sans flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5" />
                  THREAT ANALYSIS
                </h3>
                <div className="space-y-3 text-sm font-mono">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {result.results.threats?.phishing ? (
                        <XCircle className="w-4 h-4 text-red-500" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      <span className="text-green-400 font-semibold">Phishing</span>
                    </div>
                    <p className="text-green-500/60 text-xs ml-6">
                      {result.results.threats?.phishing ? 'Detected - Site flagged for phishing attempts' : 'Not detected - Site appears safe'}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {result.results.threats?.malware ? (
                        <XCircle className="w-4 h-4 text-red-500" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      <span className="text-green-400 font-semibold">Malware</span>
                    </div>
                    <p className="text-green-500/60 text-xs ml-6">
                      {result.results.threats?.malware ? 'Detected - Site contains malicious software' : 'Not detected - No malware found'}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {result.results.threats?.suspicious ? (
                        <XCircle className="w-4 h-4 text-yellow-500" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      <span className="text-green-400 font-semibold">Suspicious Activity</span>
                    </div>
                    <p className="text-green-500/60 text-xs ml-6">
                      {result.results.threats?.suspicious ? 'Detected - Site shows suspicious behavior patterns' : 'Not detected - No suspicious activity'}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {hasData('ports') && (
              <Card className="p-6" variant="hacker">
                <h3 className="text-lg font-bold text-green-500 smooch-sans flex items-center gap-2 mb-4">
                  <Network className="w-5 h-5" />
                  PORTS
                </h3>
                <div className="space-y-2 text-sm font-mono">
                  {result.results.ports?.open && result.results.ports.open.length > 0 && (
                    <div>
                      <span className="text-green-500/70">OPEN:</span>
                      <span className="text-green-400 ml-2 text-xs">{result.results.ports.open.join(', ')}</span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {hasData('robotsTxt') && (
              <Card className="p-6" variant="hacker">
                <h3 className="text-lg font-bold text-green-500 smooch-sans flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5" />
                  ROBOTS.TXT FILE
                </h3>
                <div className="space-y-2 text-sm font-mono">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {result.results.robotsTxt?.exists ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-green-400 font-semibold">
                        {result.results.robotsTxt?.exists ? 'File Found' : 'File Not Found'}
                      </span>
                    </div>
                    <p className="text-green-500/60 text-xs ml-6">
                      {result.results.robotsTxt?.exists 
                        ? 'File tells search engines which pages to crawl or ignore'
                        : 'No robots.txt file - search engines can crawl all pages'}
                    </p>
                  </div>
                  {result.results.robotsTxt?.disallowedPaths && result.results.robotsTxt.disallowedPaths.length > 0 && (
                    <div>
                      <span className="text-green-500/70">Blocked Paths:</span>
                      <span className="text-green-400 ml-2 text-xs">{result.results.robotsTxt.disallowedPaths.length} paths</span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {hasData('sitemap') && (
              <Card className="p-6" variant="hacker">
                <h3 className="text-lg font-bold text-green-500 smooch-sans flex items-center gap-2 mb-4">
                  <List className="w-5 h-5" />
                  SITEMAP FILE
                </h3>
                <div className="space-y-2 text-sm font-mono">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {result.results.sitemap?.exists ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-green-400 font-semibold">
                        {result.results.sitemap?.exists ? 'File Found' : 'File Not Found'}
                      </span>
                    </div>
                    <p className="text-green-500/60 text-xs ml-6">
                      {result.results.sitemap?.exists 
                        ? 'File helps search engines discover and index all pages on the site'
                        : 'No sitemap.xml file - search engines may miss some pages'}
                    </p>
                  </div>
                  {result.results.sitemap?.urls && result.results.sitemap.urls.length > 0 && (
                    <div>
                      <span className="text-green-500/70">Pages Listed:</span>
                      <span className="text-green-400 ml-2 text-xs">{result.results.sitemap.urls.length} URLs</span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {hasData('securityTxt') && (
              <Card className="p-6" variant="hacker">
                <h3 className="text-lg font-bold text-green-500 smooch-sans flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5" />
                  SECURITY.TXT FILE
                </h3>
                <div className="space-y-2 text-sm font-mono">
                  <div className="flex items-center gap-2">
                    {result.results.securityTxt?.exists ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-green-400 font-semibold">
                      {result.results.securityTxt?.exists ? 'File Found' : 'File Not Found'}
                    </span>
                  </div>
                  <p className="text-green-500/60 text-xs">
                    {result.results.securityTxt?.exists 
                      ? 'Security contact information is publicly available for responsible disclosure'
                      : 'No security.txt file found - security researchers cannot easily contact the site'}
                  </p>
                </div>
              </Card>
            )}

            {hasData('dnsServer') && (
              <Card className="p-6" variant="hacker">
                <h3 className="text-lg font-bold text-green-500 smooch-sans flex items-center gap-2 mb-4">
                  <Server className="w-5 h-5" />
                  DNS SERVER
                </h3>
                <div className="space-y-2 text-sm font-mono">
                  {result.results.dnsServer?.hostname && (
                    <div>
                      <span className="text-green-500/70">HOSTNAME:</span>
                      <span className="text-green-400 ml-2 text-xs break-all">{result.results.dnsServer.hostname}</span>
                    </div>
                  )}
                  {result.results.dnsServer?.ip && (
                    <div>
                      <span className="text-green-500/70">IP:</span>
                      <span className="text-green-400 ml-2 text-xs">{result.results.dnsServer.ip}</span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {hasData('firewall') && (
              <Card className="p-6" variant="hacker">
                <h3 className="text-lg font-bold text-green-500 smooch-sans flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5" />
                  FIREWALL / CDN PROTECTION
                </h3>
                <div className="space-y-2 text-sm font-mono">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {result.results.firewall?.detected ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-green-400 font-semibold">
                        {result.results.firewall?.detected ? 'Protection Active' : 'No Protection Detected'}
                      </span>
                    </div>
                    <p className="text-green-500/60 text-xs ml-6">
                      {result.results.firewall?.detected 
                        ? 'Site is protected by a firewall or CDN service'
                        : 'No firewall or CDN protection detected'}
                    </p>
                  </div>
                  {result.results.firewall?.provider && (
                    <div>
                      <span className="text-green-500/70">Service Provider:</span>
                      <span className="text-green-400 ml-2 text-xs">{result.results.firewall.provider}</span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {hasData('archives') && (
              <Card className="p-6" variant="hacker">
                <h3 className="text-lg font-bold text-green-500 smooch-sans flex items-center gap-2 mb-4">
                  <Archive className="w-5 h-5" />
                  ARCHIVES
                </h3>
                <div className="space-y-2 text-sm font-mono">
                  {result.results.archives?.totalScans !== undefined && (
                    <div>
                      <span className="text-green-500/70">SCANS:</span>
                      <span className="text-green-400 ml-2">{result.results.archives.totalScans}</span>
                    </div>
                  )}
                  {result.results.archives?.firstScan && (
                    <div>
                      <span className="text-green-500/70">FIRST:</span>
                      <span className="text-green-400 ml-2 text-xs">{new Date(result.results.archives.firstScan).toLocaleDateString()}</span>
                    </div>
                  )}
                  {result.results.archives?.lastScan && (
                    <div>
                      <span className="text-green-500/70">LAST SCANNED:</span>
                      <span className="text-green-400 ml-2 text-xs">{new Date(result.results.archives.lastScan).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {hasData('socialTags') && (
              <Card className="p-6" variant="hacker">
                <h3 className="text-lg font-bold text-green-500 smooch-sans flex items-center gap-2 mb-4">
                  <Tag className="w-5 h-5" />
                  SOCIAL TAGS
                </h3>
                <div className="space-y-2 text-sm font-mono">
                  {result.results.socialTags?.description && (
                    <div className="text-green-400 text-xs line-clamp-2">{result.results.socialTags.description}</div>
                  )}
                  {result.results.socialTags?.keywords && (
                    <div>
                      <span className="text-green-500/70">KEYWORDS:</span>
                      <span className="text-green-400 ml-2 text-xs">{result.results.socialTags.keywords.split(',').length} tags</span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {hasData('quality') && (
              <Card className="p-6" variant="hacker">
                <h3 className="text-lg font-bold text-green-500 smooch-sans flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5" />
                  QUALITY SCORE
                </h3>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-400 mb-2">{result.results.quality?.overall || 0}</div>
                    <div className="text-green-500/70 text-xs font-mono">OVERALL SCORE</div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm font-mono">
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-400">{result.results.quality?.performance?.score || 0}</div>
                      <div className="text-green-500/70 text-xs">PERFORMANCE</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-400">{result.results.quality?.seo?.score || 0}</div>
                      <div className="text-green-500/70 text-xs">SEO</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-400">{result.results.quality?.accessibility?.score || 0}</div>
                      <div className="text-green-500/70 text-xs">ACCESSIBILITY</div>
                    </div>
                  </div>
                  {(result.results.quality?.performance?.issues?.length > 0 || 
                    result.results.quality?.seo?.issues?.length > 0 || 
                    result.results.quality?.accessibility?.issues?.length > 0) && (
                    <div className="mt-4 pt-4 border-t border-green-500/30 space-y-2 text-xs">
                      {result.results.quality?.performance?.issues?.map((issue: string, i: number) => (
                        <div key={i} className="text-yellow-400">• {issue}</div>
                      ))}
                      {result.results.quality?.seo?.issues?.map((issue: string, i: number) => (
                        <div key={i} className="text-yellow-400">• {issue}</div>
                      ))}
                      {result.results.quality?.accessibility?.issues?.map((issue: string, i: number) => (
                        <div key={i} className="text-yellow-400">• {issue}</div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {hasData('traceRoute') && (
              <Card className="p-6" variant="hacker">
                <h3 className="text-lg font-bold text-green-500 smooch-sans flex items-center gap-2 mb-4">
                  <Route className="w-5 h-5" />
                  TRACEROUTE
                </h3>
                <div className="space-y-2 text-sm font-mono">
                  {result.results.traceRoute?.hops && result.results.traceRoute.hops.length > 0 ? (
                    result.results.traceRoute.hops.map((hop: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-green-500/70">HOP {hop.hop}:</span>
                        <span className="text-green-400">{hop.ip || hop.hostname || 'Unknown'}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-green-500/70">No route information available</div>
                  )}
                </div>
              </Card>
            )}

            {hasData('mailConfig') && (
              <Card className="p-6" variant="hacker">
                <h3 className="text-lg font-bold text-green-500 smooch-sans flex items-center gap-2 mb-4">
                  <Mail className="w-5 h-5" />
                  MAIL CONFIG
                </h3>
                <div className="space-y-3 text-sm font-mono">
                  {result.results.mailConfig?.mx && result.results.mailConfig.mx.length > 0 && (
                    <div>
                      <span className="text-green-500/70">MX RECORDS:</span>
                      <div className="mt-1 space-y-1">
                        {result.results.mailConfig.mx.map((mx: any, idx: number) => (
                          <div key={idx} className="text-green-400 text-xs">
                            {mx.priority} - {mx.exchange}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    {result.results.mailConfig?.spf?.exists ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-green-400">SPF Record</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.results.mailConfig?.dkim?.exists ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-green-400">DKIM Record</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.results.mailConfig?.dmarc?.exists ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-green-400">DMARC Record</span>
                    {result.results.mailConfig?.dmarc?.policy && (
                      <span className="text-green-500/70 text-xs ml-2">({result.results.mailConfig.dmarc.policy})</span>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {hasData('rank') && (
              <Card className="p-6" variant="hacker">
                <h3 className="text-lg font-bold text-green-500 smooch-sans flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5" />
                  RANKING
                </h3>
                <div className="space-y-2 text-sm font-mono">
                  {result.results.rank?.alexa && (
                    <div>
                      <span className="text-green-500/70">ALEXA RANK:</span>
                      <span className="text-green-400 ml-2">#{result.results.rank.alexa.toLocaleString()}</span>
                    </div>
                  )}
                  {!result.results.rank?.alexa && (
                    <div className="text-green-500/70">Ranking data not available</div>
                  )}
                </div>
              </Card>
            )}

            {hasData('screenshot') && result.results.screenshot?.url && (
              <Card className="p-6 md:col-span-2" variant="hacker">
                <h3 className="text-lg font-bold text-green-500 smooch-sans flex items-center gap-2 mb-4">
                  <Camera className="w-5 h-5" />
                  SCREENSHOT
                </h3>
                {result.results.screenshot.url && (
                  <div className="space-y-2">
                    <img 
                      src={result.results.screenshot.url} 
                      alt="Website screenshot" 
                      className="w-full border-2 border-green-500/30 rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="text-xs text-green-500/70 font-mono">
                      {result.results.screenshot.width}x{result.results.screenshot.height}px
                      {result.results.screenshot.service && ` • ${result.results.screenshot.service}`}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {hasData('tlsCipherSuites') && (
              <Card className="p-6" variant="hacker">
                <h3 className="text-lg font-bold text-green-500 smooch-sans flex items-center gap-2 mb-4">
                  <Settings className="w-5 h-5" />
                  TLS CIPHER SUITES
                </h3>
                <div className="space-y-3 text-sm font-mono">
                  {result.results.tlsCipherSuites?.grade && (
                    <div>
                      <span className="text-green-500/70">SSL LABS GRADE:</span>
                      <span className="text-green-400 ml-2 font-bold">{result.results.tlsCipherSuites.grade}</span>
                    </div>
                  )}
                  {result.results.tlsCipherSuites?.supported && result.results.tlsCipherSuites.supported.length > 0 && (
                    <div>
                      <span className="text-green-500/70">SUPPORTED:</span>
                      <span className="text-green-400 ml-2">{result.results.tlsCipherSuites.supported.length}</span>
                    </div>
                  )}
                  {result.results.tlsCipherSuites?.recommended && result.results.tlsCipherSuites.recommended.length > 0 && (
                    <div>
                      <span className="text-green-500/70">RECOMMENDED:</span>
                      <span className="text-green-400 ml-2">{result.results.tlsCipherSuites.recommended.length}</span>
                    </div>
                  )}
                  {result.results.tlsCipherSuites?.weak && result.results.tlsCipherSuites.weak.length > 0 && (
                    <div>
                      <span className="text-red-500/70">WEAK:</span>
                      <span className="text-red-400 ml-2">{result.results.tlsCipherSuites.weak.length}</span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {hasData('tlsSecurityConfig') && (
              <Card className="p-6" variant="hacker">
                <h3 className="text-lg font-bold text-green-500 smooch-sans flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5" />
                  TLS SECURITY
                </h3>
                <div className="space-y-3 text-sm font-mono">
                  {result.results.tlsSecurityConfig?.protocol && (
                    <div>
                      <span className="text-green-500/70">PROTOCOL:</span>
                      <span className="text-green-400 ml-2">{result.results.tlsSecurityConfig.protocol}</span>
                    </div>
                  )}
                  {result.results.tlsSecurityConfig?.grade && (
                    <div>
                      <span className="text-green-500/70">GRADE:</span>
                      <span className="text-green-400 ml-2 font-bold">{result.results.tlsSecurityConfig.grade}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    {result.results.tlsSecurityConfig?.certificate?.valid ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-green-400">Certificate Valid</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.results.tlsSecurityConfig?.hsts ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-green-400">HSTS Enabled</span>
                  </div>
                  {result.results.tlsSecurityConfig?.issues && result.results.tlsSecurityConfig.issues.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-green-500/30">
                      {result.results.tlsSecurityConfig.issues.map((issue: string, i: number) => (
                        <div key={i} className="text-yellow-400 text-xs">• {issue}</div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {hasData('tlsClientSupport') && (
              <Card className="p-6" variant="hacker">
                <h3 className="text-lg font-bold text-green-500 smooch-sans flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5" />
                  TLS CLIENT SUPPORT
                </h3>
                <div className="space-y-2 text-sm font-mono">
                  <div className="flex items-center gap-2">
                    {result.results.tlsClientSupport?.tls13 ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-green-400">TLS 1.3</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.results.tlsClientSupport?.tls12 ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-green-400">TLS 1.2</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.results.tlsClientSupport?.tls11 ? (
                      <CheckCircle className="w-4 h-4 text-yellow-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-500" />
                    )}
                    <span className="text-green-400">TLS 1.1 (Deprecated)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.results.tlsClientSupport?.tls10 ? (
                      <CheckCircle className="w-4 h-4 text-yellow-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-500" />
                    )}
                    <span className="text-green-400">TLS 1.0 (Deprecated)</span>
                  </div>
                  {result.results.tlsClientSupport?.recommended && result.results.tlsClientSupport.recommended.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-green-500/30">
                      <div className="text-green-500/70 text-xs mb-1">RECOMMENDATIONS:</div>
                      {result.results.tlsClientSupport.recommended.map((rec: string, i: number) => (
                        <div key={i} className="text-yellow-400 text-xs">• {rec}</div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {hasData('features') && (
              <Card className="p-6" variant="hacker">
                <h3 className="text-lg font-bold text-green-500 smooch-sans flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5" />
                  WEBSITE FEATURES
                </h3>
                <div className="space-y-2 text-sm font-mono">
                  <div className="flex items-center gap-2">
                    {result.results.features?.pwa ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-500" />
                    )}
                    <span className="text-green-400">Progressive Web App</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.results.features?.serviceWorker ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-500" />
                    )}
                    <span className="text-green-400">Service Worker</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.results.features?.webPush ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-500" />
                    )}
                    <span className="text-green-400">Web Push Notifications</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.results.features?.offline ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-500" />
                    )}
                    <span className="text-green-400">Offline Support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.results.features?.responsive ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-500" />
                    )}
                    <span className="text-green-400">Responsive Design</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.results.features?.darkMode ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-500" />
                    )}
                    <span className="text-green-400">Dark Mode</span>
                  </div>
                </div>
              </Card>
            )}

            {hasData('carbon') && (
              <Card className="p-6" variant="hacker">
                <h3 className="text-lg font-bold text-green-500 smooch-sans flex items-center gap-2 mb-4">
                  <Leaf className="w-5 h-5" />
                  CARBON FOOTPRINT
                </h3>
                <div className="space-y-3 text-sm font-mono">
                  <div>
                    <span className="text-green-500/70">EMISSIONS:</span>
                    <span className="text-green-400 ml-2">{result.results.carbon?.emissions?.toFixed(4) || 0} g CO₂</span>
                  </div>
                  <div>
                    <span className="text-green-500/70">CLEANER THAN:</span>
                    <span className="text-green-400 ml-2">{result.results.carbon?.cleanerThan || 0}% of websites</span>
                  </div>
                  <div>
                    <span className="text-green-500/70">PAGE SIZE:</span>
                    <span className="text-green-400 ml-2">{(result.results.carbon?.size || 0) / 1024} KB</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.results.carbon?.greenHosting ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-500" />
                    )}
                    <span className="text-green-400">Green Hosting</span>
                  </div>
                  {result.results.carbon?.recommendations && result.results.carbon.recommendations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-green-500/30">
                      <div className="text-green-500/70 text-xs mb-1">RECOMMENDATIONS:</div>
                      {result.results.carbon.recommendations.map((rec: string, i: number) => (
                        <div key={i} className="text-yellow-400 text-xs">• {rec}</div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {hasData('location') && result.results.location?.latitude && result.results.location?.longitude && (
              <Card className="p-6 md:col-span-3" variant="hacker">
                <h3 className="text-lg font-bold text-green-500 smooch-sans flex items-center gap-2 mb-4">
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
                        <span className="text-green-500/70">CITY:</span>
                        <span className="text-green-400 ml-2">{result.results.location.city}</span>
                      </div>
                    )}
                    {result.results.location?.country && (
                      <div>
                        <span className="text-green-500/70">COUNTRY:</span>
                        <span className="text-green-400 ml-2">{result.results.location.country}</span>
                      </div>
                    )}
                    {result.results.location?.region && (
                      <div>
                        <span className="text-green-500/70">REGION:</span>
                        <span className="text-green-400 ml-2">{result.results.location.region}</span>
                      </div>
                    )}
                    {result.results.location?.timezone && (
                      <div>
                        <span className="text-green-500/70">TIMEZONE:</span>
                        <span className="text-green-400 ml-2">{result.results.location.timezone}</span>
                      </div>
                    )}
                    {result.results.location?.currency && (
                      <div>
                        <span className="text-green-500/70">CURRENCY:</span>
                        <span className="text-green-400 ml-2">{result.results.location.currency}</span>
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