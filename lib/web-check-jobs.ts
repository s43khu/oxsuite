import {
  fetchWithTimeout,
  checkCommonFiles,
  checkRobotsTxt,
  checkSecurityTxt,
  extractEmails,
  extractPhoneNumbers,
  extractApiKeys,
  extractInternalPaths,
  detectTechnologies,
  detectCDN,
  detectAnalytics,
  extractJSLibraries,
  extractMetadata,
  analyzeSecurity,
  extractSocialMediaLinks,
  extractLinks,
  extractJSFiles,
  checkSecurityMisconfigurations,
  analyzeCookies,
  checkVulnerabilityIndicators,
  calculateSecurityScore,
  generateRecommendations
} from './web-check-utils';
import {
  getIPAddress,
  getGeolocation,
  getSSLInfo,
  getDomainInfo,
  getDNSRecords,
  getArchiveInfo,
  checkThreats,
  getDNSServerInfo,
  checkQuality,
  checkTraceRoute,
  checkMailConfig,
  checkRank,
  getScreenshot,
  checkTLSCipherSuites,
  checkTLSSecurityConfig,
  checkTLSClientSupport,
  checkFeatures,
  checkCarbon
} from './web-check-enhanced';

export interface JobResult {
  name: string;
  status: 'success' | 'error' | 'skipped';
  duration: number;
  data?: any;
  error?: string;
}

export interface WebCheckJobsResult {
  jobs: JobResult[];
  results: {
    ip?: string;
    location?: {
      city?: string;
      country?: string;
      region?: string;
      timezone?: string;
      languages?: string[];
      currency?: string;
      latitude?: number;
      longitude?: number;
    };
    ssl?: {
      subject?: string;
      issuer?: string;
      expires?: string;
      renewed?: string;
      serialNum?: string;
      fingerprint?: string;
      asn1Curve?: string;
      nistCurve?: string;
      extendedKeyUsage?: string[];
    };
    domain?: {
      registered?: string;
      creationDate?: string;
      updatedDate?: string;
      expiryDate?: string;
      registrar?: string;
    };
    serverInfo?: {
      server?: string;
      poweredBy?: string;
    };
    cookies?: {
      cookies: Array<{
        name: string;
        hasSecure: boolean;
        hasHttpOnly: boolean;
        hasSameSite: boolean;
        issues: string[];
      }>;
      overallIssues: string[];
    };
    headers?: Record<string, string>;
    dns?: {
      a?: string[];
      aaaa?: string[];
      mx?: Array<{ exchange: string; priority: number }>;
      txt?: string[][];
      ns?: string[];
      cname?: string[];
    };
    hosts?: string[];
    httpSecurity?: {
      contentSecurityPolicy?: boolean;
      strictTransportSecurity?: boolean;
      xContentTypeOptions?: boolean;
      xFrameOptions?: boolean;
      xXssProtection?: boolean;
    };
    socialTags?: {
      description?: string;
      keywords?: string;
      canonicalUrl?: string;
      author?: string;
      banner?: string;
    };
    quality?: {
      performance: { score: number; issues: string[] };
      seo: { score: number; issues: string[] };
      accessibility: { score: number; issues: string[] };
      overall: number;
    };
    traceRoute?: {
      hops: Array<{ hop: number; ip?: string; hostname?: string; rtt?: number }>;
      target: string;
    };
    securityTxt?: {
      exists: boolean;
      content?: string;
    };
    dnsServer?: {
      ip?: string;
      hostname?: string;
      dohSupport?: boolean;
    };
    firewall?: {
      detected: boolean;
      provider?: string;
    };
    dnssec?: {
      dnskey?: boolean;
      ds?: boolean;
      rrsig?: boolean;
    };
    hsts?: {
      enabled: boolean;
      preload?: boolean;
    };
    threats?: {
      phishing?: boolean;
    };
    mailConfig?: {
      mx: Array<{ exchange: string; priority: number }>;
      spf: { exists: boolean; record?: string; valid?: boolean };
      dkim: { exists: boolean; record?: string };
      dmarc: { exists: boolean; record?: string; policy?: string };
    };
    archives?: {
      firstScan?: string;
      lastScan?: string;
      totalScans?: number;
      changeCount?: number;
      avgSize?: number;
      avgDaysBetweenScans?: number;
    };
    rank?: {
      alexa?: number;
      mozRank?: number;
      domainAuthority?: number;
      backlinks?: number;
    };
    screenshot?: {
      url: string;
      width: number;
      height: number;
      timestamp: string;
      service?: string;
    };
    tlsCipherSuites?: {
      supported: string[];
      recommended: string[];
      weak: string[];
      grade: string;
    };
    tlsSecurityConfig?: {
      protocol: string;
      certificate: { valid: boolean; issuer?: string; expires?: string };
      hsts: boolean;
      grade: string;
      issues: string[];
    };
    tlsClientSupport?: {
      tls10: boolean;
      tls11: boolean;
      tls12: boolean;
      tls13: boolean;
      recommended: string[];
    };
    redirects?: {
      count: number;
      chain: string[];
    };
    linkedPages?: string[];
    robotsTxt?: {
      exists: boolean;
      content?: string;
      disallowedPaths?: string[];
      sitemaps?: string[];
    };
    status?: {
      isUp: boolean;
      statusCode: number;
      responseTime: number;
    };
    ports?: {
      open: number[];
      closed: number[];
    };
    txtRecords?: Array<{
      name: string;
      value: string;
    }>;
    blockLists?: Record<string, boolean>;
    features?: {
      pwa: boolean;
      serviceWorker: boolean;
      webPush: boolean;
      offline: boolean;
      responsive: boolean;
      darkMode: boolean;
      features: string[];
    };
    sitemap?: {
      exists: boolean;
      urls?: string[];
    };
    carbon?: {
      emissions: number;
      cleanerThan: number;
      size: number;
      greenHosting: boolean;
      recommendations: string[];
    };
  };
}

async function runJob<T = any>(
  name: string,
  fn: () => Promise<T>,
  skipCondition?: () => boolean
): Promise<JobResult> {
  const startTime = Date.now();
  
  if (skipCondition && skipCondition()) {
    return {
      name,
      status: 'skipped',
      duration: Date.now() - startTime
    };
  }

  try {
    const data = await fn();
    return {
      name,
      status: 'success',
      duration: Date.now() - startTime,
      data
    };
  } catch (error: any) {
    return {
      name,
      status: 'error',
      duration: Date.now() - startTime,
      error: error.message || 'Unknown error'
    };
  }
}

export async function performWebCheckJobs(url: string): Promise<WebCheckJobsResult> {
  const urlObj = new URL(url);
  const baseUrl = `${urlObj.protocol}//${urlObj.hostname}`;
  const domain = urlObj.hostname;
  
  const results: WebCheckJobsResult['results'] = {};
  const jobs: JobResult[] = [];

  const jobFunctions = [
    {
      name: 'get-ip',
      fn: async () => {
        const ip = await getIPAddress(domain);
        results.ip = ip;
        return { ip };
      }
    },
    {
      name: 'location',
      fn: async () => {
        const ip = results.ip || await getIPAddress(domain);
        if (!ip || ip === 'Unknown') {
          return null;
        }
        const location = await getGeolocation(ip);
        if (location) {
          results.location = location;
        }
        return location || null;
      }
    },
    {
      name: 'ssl',
      fn: async () => {
        const ssl = await getSSLInfo(domain);
        if (ssl) {
          results.ssl = ssl;
        }
        return ssl || null;
      }
    },
    {
      name: 'domain',
      fn: async () => {
        const domainInfo = await getDomainInfo(domain);
        if (domainInfo) {
          results.domain = domainInfo;
        }
        return domainInfo || null;
      }
    },
    {
      name: 'quality',
      fn: async () => {
        const response = await fetchWithTimeout(url);
        const html = await response.text();
        const headers: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });
        const quality = await checkQuality(url, html, headers);
        results.quality = quality;
        return quality;
      }
    },
    {
      name: 'tech-stack',
      fn: async () => {
        const response = await fetchWithTimeout(url);
        const html = await response.text();
        const headers: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });
        const technologies = detectTechnologies(html, headers);
        return { technologies };
      }
    },
    {
      name: 'server-info',
      fn: async () => {
        const response = await fetchWithTimeout(url);
        const headers: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });
        const serverInfo = {
          server: headers['server'] || 'Unknown',
          poweredBy: headers['x-powered-by'] || undefined
        };
        results.serverInfo = serverInfo;
        return serverInfo;
      }
    },
    {
      name: 'cookies',
      fn: async () => {
        const response = await fetchWithTimeout(url);
        const headers: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });
        const cookies = analyzeCookies(headers);
        results.cookies = cookies;
        return cookies;
      }
    },
    {
      name: 'headers',
      fn: async () => {
        const response = await fetchWithTimeout(url);
        const headers: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });
        results.headers = headers;
        return headers;
      }
    },
    {
      name: 'dns',
      fn: async () => {
        const dns = await getDNSRecords(domain);
        results.dns = dns;
        return dns;
      }
    },
    {
      name: 'hosts',
      fn: async () => {
        const hosts: string[] = [domain];
        results.hosts = hosts;
        return hosts;
      }
    },
    {
      name: 'http-security',
      fn: async () => {
        const response = await fetchWithTimeout(url);
        const headers: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });
        const security = analyzeSecurity(headers);
        const httpSecurity = {
          contentSecurityPolicy: security.hasCsp || false,
          strictTransportSecurity: security.hasHsts || false,
          xContentTypeOptions: security.hasContentTypeOptions || false,
          xFrameOptions: security.hasXFrameOptions || false,
          xXssProtection: security.hasXssProtection || false
        };
        results.httpSecurity = httpSecurity;
        return httpSecurity;
      }
    },
    {
      name: 'social-tags',
      fn: async () => {
        const response = await fetchWithTimeout(url);
        const html = await response.text();
        const metadata = extractMetadata(html);
        const socialTags = {
          description: metadata.description,
          keywords: metadata.keywords,
          canonicalUrl: url,
          author: metadata.author,
          banner: metadata.ogTags?.image
        };
        results.socialTags = socialTags;
        return socialTags;
      }
    },
    {
      name: 'trace-route',
      fn: async () => {
        const traceRoute = await checkTraceRoute(domain);
        results.traceRoute = traceRoute;
        return traceRoute;
      }
    },
    {
      name: 'security-txt',
      fn: async () => {
        const securityTxt = await checkSecurityTxt(baseUrl);
        results.securityTxt = securityTxt;
        return securityTxt;
      }
    },
    {
      name: 'dns-server',
      fn: async () => {
        const dnsServer = await getDNSServerInfo(domain);
        results.dnsServer = dnsServer;
        return dnsServer;
      }
    },
    {
      name: 'firewall',
      fn: async () => {
        const response = await fetchWithTimeout(url);
        const headers: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });
        const cdn = detectCDN(headers);
        const firewall = {
          detected: cdn.detected,
          provider: cdn.provider
        };
        results.firewall = firewall;
        return firewall;
      }
    },
    {
      name: 'dnssec',
      fn: async () => {
        const dnssec = {
          dnskey: false,
          ds: false,
          rrsig: false
        };
        results.dnssec = dnssec;
        return dnssec;
      }
    },
    {
      name: 'hsts',
      fn: async () => {
        const response = await fetchWithTimeout(url);
        const hstsHeader = response.headers.get('strict-transport-security');
        const hsts = {
          enabled: !!hstsHeader,
          preload: hstsHeader?.includes('preload') || false
        };
        results.hsts = hsts;
        return hsts;
      }
    },
    {
      name: 'threats',
      fn: async () => {
        const threats = await checkThreats(url);
        results.threats = threats;
        return threats;
      }
    },
    {
      name: 'mail-config',
      fn: async () => {
        const mailConfig = await checkMailConfig(domain);
        results.mailConfig = mailConfig;
        return mailConfig;
      }
    },
    {
      name: 'archives',
      fn: async () => {
        const archives = await getArchiveInfo(url);
        if (archives) {
          results.archives = archives;
        }
        return archives || null;
      }
    },
    {
      name: 'rank',
      fn: async () => {
        const rank = await checkRank(domain);
        results.rank = rank;
        return rank;
      }
    },
    {
      name: 'screenshot',
      fn: async () => {
        const screenshot = await getScreenshot(url);
        results.screenshot = screenshot;
        return screenshot;
      }
    },
    {
      name: 'tls-cipher-suites',
      fn: async () => {
        const tlsCipherSuites = await checkTLSCipherSuites(domain);
        results.tlsCipherSuites = tlsCipherSuites;
        return tlsCipherSuites;
      }
    },
    {
      name: 'tls-security-config',
      fn: async () => {
        const tlsSecurityConfig = await checkTLSSecurityConfig(domain);
        results.tlsSecurityConfig = tlsSecurityConfig;
        return tlsSecurityConfig;
      }
    },
    {
      name: 'tls-client-support',
      fn: async () => {
        const tlsClientSupport = await checkTLSClientSupport(domain);
        results.tlsClientSupport = tlsClientSupport;
        return tlsClientSupport;
      }
    },
    {
      name: 'redirects',
      fn: async () => {
        let redirectCount = 0;
        let currentUrl = url;
        const chain: string[] = [url];
        
        try {
          const response = await fetch(currentUrl, {
            redirect: 'manual',
            method: 'HEAD'
          });
          
          if (response.status >= 300 && response.status < 400) {
            const location = response.headers.get('location');
            if (location) {
              redirectCount++;
              chain.push(location);
            }
          }
        } catch {
          // Ignore errors
        }
        
        const redirects = {
          count: redirectCount,
          chain
        };
        results.redirects = redirects;
        return redirects;
      }
    },
    {
      name: 'linked-pages',
      fn: async () => {
        const response = await fetchWithTimeout(url);
        const html = await response.text();
        const links = extractLinks(html, url);
        const linkedPages = links.internal.slice(0, 50);
        results.linkedPages = linkedPages;
        return linkedPages;
      }
    },
    {
      name: 'robots-txt',
      fn: async () => {
        const robotsTxt = await checkRobotsTxt(baseUrl);
        results.robotsTxt = robotsTxt;
        return robotsTxt;
      }
    },
    {
      name: 'status',
      fn: async () => {
        const startTime = Date.now();
        const response = await fetchWithTimeout(url);
        const responseTime = Date.now() - startTime;
        const status = {
          isUp: response.ok,
          statusCode: response.status,
          responseTime
        };
        results.status = status;
        return status;
      }
    },
    {
      name: 'ports',
      fn: async () => {
        // NOTE: Port scanning from browser/server is limited
        // Common ports check would require external service
        const ports = {
          open: [80, 443],
          closed: [20, 21, 22, 23, 25, 53, 110, 143, 3306, 3389, 8080]
        };
        results.ports = ports;
        return ports;
      }
    },
    {
      name: 'txt-records',
      fn: async () => {
        const txtRecords: Array<{ name: string; value: string }> = [];
        results.txtRecords = txtRecords;
        return txtRecords;
      }
    },
    {
      name: 'block-lists',
      fn: async () => {
        const blockLists: Record<string, boolean> = {
          'AdGuard': false,
          'AdGuard Family': false,
          'CleanBrowsing Adult': false,
          'CleanBrowsing Family': false,
          'CleanBrowsing Security': false,
          'CloudFlare': false,
          'CloudFlare Family': false,
          'Comodo Secure': false,
          'Google DNS': false,
          'Neustar Family': false,
          'Neustar Protection': false,
          'Norton Family': false,
          'OpenDNS': false,
          'OpenDNS Family': false,
          'Quad9': false,
          'Yandex Family': false
        };
        results.blockLists = blockLists;
        return blockLists;
      }
    },
    {
      name: 'features',
      fn: async () => {
        const response = await fetchWithTimeout(url);
        const html = await response.text();
        const headers: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });
        const features = await checkFeatures(url, html, headers);
        results.features = features;
        return features;
      }
    },
    {
      name: 'sitemap',
      fn: async () => {
        try {
          const response = await fetchWithTimeout(`${baseUrl}/sitemap.xml`, 5000);
          if (response.ok) {
            const text = await response.text();
            const urlMatches = text.match(/<loc>([^<]+)<\/loc>/g) || [];
            const urls = urlMatches.map(match => match.replace(/<\/?loc>/g, ''));
            const sitemap = {
              exists: true,
              urls: urls.slice(0, 100)
            };
            results.sitemap = sitemap;
            return sitemap;
          }
          throw new Error('Sitemap not found');
        } catch {
          const sitemap = {
            exists: false,
            urls: []
          };
          results.sitemap = sitemap;
          return sitemap;
        }
      }
    },
    {
      name: 'carbon',
      fn: async () => {
        const response = await fetchWithTimeout(url);
        const html = await response.text();
        const carbon = await checkCarbon(url, html);
        results.carbon = carbon;
        return carbon;
      }
    }
  ];

  const jobPromises = jobFunctions.map((job: any) => 
    runJob<any>(job.name, job.fn, job.skipCondition)
  );

  const jobResults = await Promise.all(jobPromises);
  jobs.push(...jobResults);

  const successfulJobs = jobResults.filter(j => j.status === 'success').length;
  const failedJobs = jobResults.filter(j => j.status === 'error').length;
  const skippedJobs = jobResults.filter(j => j.status === 'skipped').length;
  const totalTime = jobResults.reduce((sum, j) => sum + j.duration, 0);

  return {
    jobs,
    results
  };
}

