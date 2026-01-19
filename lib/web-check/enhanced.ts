import { fetchWithTimeout } from "./utils";

export interface EnhancedWebCheckResult {
  ip?: string;
  location?: {
    city: string;
    country: string;
    region: string;
    timezone: string;
    languages: string[];
    currency: string;
    latitude: number;
    longitude: number;
  };
  ssl?: {
    subject: string;
    issuer: string;
    expires: string;
    renewed: string;
    serialNum: string;
    fingerprint: string;
    asn1Curve: string;
    nistCurve: string;
    extendedKeyUsage: string[];
    validFrom?: string;
    validTo?: string;
    daysRemaining?: number;
  };
  domain?: {
    registered: string;
    creationDate: string;
    updatedDate: string;
    expiryDate: string;
    registrar: string;
  };
  dns?: {
    a: string[];
    aaaa: string[];
    mx: Array<{ exchange: string; priority: number }>;
    txt: string[][];
    ns: string[];
    cname: string[];
  };
  dnsServer?: {
    ip: string;
    hostname: string;
    dohSupport: boolean;
  };
  archives?: {
    firstScan: string;
    lastScan: string;
    totalScans: number;
    changeCount: number;
    avgSize: number;
    avgDaysBetweenScans: number;
    snapshots?: Array<{
      timestamp: string;
      url: string;
    }>;
  };
  threats?: {
    phishing: boolean;
    malware: boolean;
    suspicious: boolean;
  };
}

export async function getIPAddress(domain: string): Promise<string> {
  try {
    const response = await fetchWithTimeout(
      `https://dns.google/resolve?name=${domain}&type=A`,
      5000
    );
    const data = await response.json();

    if (data.Answer && data.Answer.length > 0) {
      return data.Answer[0].data;
    }
    return "Unknown";
  } catch (error) {
    console.error("IP lookup failed:", error);
    return "Unknown";
  }
}

export async function getGeolocation(
  ip: string
): Promise<EnhancedWebCheckResult["location"] | null> {
  if (ip === "Unknown") return null;

  try {
    const response = await fetchWithTimeout(
      `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,currency,isp,org,as`,
      5000
    );
    const data = await response.json();

    if (data.status === "success") {
      return {
        city: data.city || "Unknown",
        country: data.country || "Unknown",
        region: data.regionName || "Unknown",
        timezone: data.timezone || "Unknown",
        languages: [],
        currency: data.currency || "Unknown",
        latitude: data.lat || 0,
        longitude: data.lon || 0,
      };
    }
    return null;
  } catch (error) {
    console.error("Geolocation lookup failed:", error);
    return null;
  }
}

export async function getSSLInfo(domain: string): Promise<EnhancedWebCheckResult["ssl"] | null> {
  try {
    const response = await fetchWithTimeout(`https://crt.sh/?q=${domain}&output=json`, 10000);
    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      const mostRecent = data.reduce((prev, current) => {
        return new Date(current.entry_timestamp) > new Date(prev.entry_timestamp) ? current : prev;
      });

      const validFrom = new Date(mostRecent.not_before);
      const validTo = new Date(mostRecent.not_after);
      const now = new Date();
      const daysRemaining = Math.floor((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        subject: mostRecent.name_value.split("\n")[0],
        issuer: mostRecent.issuer_name || "Unknown",
        expires: validTo.toISOString(),
        renewed: validFrom.toISOString(),
        serialNum: mostRecent.serial_number || "Unknown",
        fingerprint: "Unknown",
        asn1Curve: "Unknown",
        nistCurve: "Unknown",
        extendedKeyUsage: ["TLS Web Server Authentication"],
        validFrom: validFrom.toISOString(),
        validTo: validTo.toISOString(),
        daysRemaining,
      };
    }

    return null;
  } catch (error) {
    console.error("SSL lookup failed:", error);
    return null;
  }
}

export async function getDomainInfo(
  domain: string
): Promise<EnhancedWebCheckResult["domain"] | null> {
  try {
    const rdapResponse = await fetchWithTimeout(`https://rdap.org/domain/${domain}`, 10000);

    if (rdapResponse.ok) {
      const data = await rdapResponse.json();

      return {
        registered: domain.toUpperCase(),
        creationDate:
          data.events?.find((e: any) => e.eventAction === "registration")?.eventDate || "Unknown",
        updatedDate:
          data.events?.find((e: any) => e.eventAction === "last changed")?.eventDate || "Unknown",
        expiryDate:
          data.events?.find((e: any) => e.eventAction === "expiration")?.eventDate || "Unknown",
        registrar:
          data.entities?.find((e: any) => e.roles?.includes("registrar"))
            ?.vcardArray?.[1]?.[1]?.[3] || "Unknown",
      };
    }

    return null;
  } catch (error) {
    console.error("Domain info lookup failed:", error);
    return null;
  }
}

export async function getDNSRecords(domain: string): Promise<EnhancedWebCheckResult["dns"]> {
  const dns: EnhancedWebCheckResult["dns"] = {
    a: [],
    aaaa: [],
    mx: [],
    txt: [],
    ns: [],
    cname: [],
  };

  const recordTypes = [
    { type: "A", key: "a" },
    { type: "AAAA", key: "aaaa" },
    { type: "MX", key: "mx" },
    { type: "TXT", key: "txt" },
    { type: "NS", key: "ns" },
    { type: "CNAME", key: "cname" },
  ];

  for (const { type, key } of recordTypes) {
    try {
      const response = await fetchWithTimeout(
        `https://dns.google/resolve?name=${domain}&type=${type}`,
        5000
      );
      const data = await response.json();

      if (data.Answer) {
        if (type === "MX") {
          dns.mx = data.Answer.map((record: any) => {
            const parts = record.data?.split(" ") || [];
            const priority = parts[0];
            const exchange = parts[1];

            if (!exchange) {
              return null;
            }

            return {
              priority: parseInt(priority) || 0,
              exchange: exchange.replace(/\.$/, ""),
            };
          }).filter((record: any) => record !== null);
        } else if (type === "TXT") {
          dns.txt = data.Answer.map((record: any) => [record.data.replace(/"/g, "")]);
        } else {
          (dns as any)[key] = data.Answer.map((record: any) => record.data.replace(/\.$/, ""));
        }
      }
    } catch (error) {
      console.error(`DNS ${type} lookup failed:`, error);
    }
  }

  return dns;
}

export async function getArchiveInfo(
  url: string
): Promise<EnhancedWebCheckResult["archives"] | null> {
  try {
    const encodedUrl = encodeURIComponent(url);
    const response = await fetchWithTimeout(
      `https://web.archive.org/cdx/search/cdx?url=${encodedUrl}&output=json&limit=1000`,
      10000
    );

    if (response.ok) {
      const data = await response.json();

      if (data.length > 1) {
        const snapshots = data.slice(1);
        const firstSnapshot = snapshots[0];
        const lastSnapshot = snapshots[snapshots.length - 1];

        const timestamps = snapshots.map((s: any) => {
          const ts = s[1];
          return new Date(
            ts.substring(0, 4) + "-" + ts.substring(4, 6) + "-" + ts.substring(6, 8)
          ).getTime();
        });

        let totalDaysBetween = 0;
        for (let i = 1; i < timestamps.length; i++) {
          totalDaysBetween += (timestamps[i] - timestamps[i - 1]) / (1000 * 60 * 60 * 24);
        }
        const avgDaysBetweenScans =
          timestamps.length > 1 ? totalDaysBetween / (timestamps.length - 1) : 0;

        const sizes = snapshots.map((s: any) => parseInt(s[4]) || 0);
        const avgSize = sizes.reduce((a: number, b: number) => a + b, 0) / sizes.length;

        const formatTimestamp = (ts: string) => {
          return `${ts.substring(0, 4)}-${ts.substring(4, 6)}-${ts.substring(6, 8)}T${ts.substring(8, 10)}:${ts.substring(10, 12)}:${ts.substring(12, 14)}Z`;
        };

        return {
          firstScan: formatTimestamp(firstSnapshot[1]),
          lastScan: formatTimestamp(lastSnapshot[1]),
          totalScans: snapshots.length,
          changeCount: snapshots.length - 1,
          avgSize: Math.round(avgSize),
          avgDaysBetweenScans: Math.round(avgDaysBetweenScans * 10) / 10,
          snapshots: snapshots.slice(0, 10).map((s: any) => ({
            timestamp: formatTimestamp(s[1]),
            url: `https://web.archive.org/web/${s[1]}/${s[2]}`,
          })),
        };
      }
    }

    return null;
  } catch (error) {
    console.error("Archive lookup failed:", error);
    return null;
  }
}

export async function checkThreats(url: string): Promise<EnhancedWebCheckResult["threats"]> {
  const threats: EnhancedWebCheckResult["threats"] = {
    phishing: false,
    malware: false,
    suspicious: false,
  };

  try {
    const domain = new URL(url).hostname;
    const response = await fetchWithTimeout(
      `https://urlscan.io/api/v1/search/?q=domain:${domain}`,
      10000
    );

    if (response.ok) {
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const recentResults = data.results.slice(0, 5);

        for (const result of recentResults) {
          if (result.verdict) {
            if (result.verdict.malicious) {
              threats.malware = true;
            }
            if (result.verdict.categories?.phishing) {
              threats.phishing = true;
            }
          }

          if (result.verdicts) {
            const overallVerdicts = result.verdicts.overall;
            if (overallVerdicts?.malicious > 0) {
              threats.malware = true;
            }
            if (overallVerdicts?.suspicious > 0) {
              threats.suspicious = true;
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Threat check failed:", error);
  }

  return threats;
}

export async function getDNSServerInfo(
  domain: string
): Promise<EnhancedWebCheckResult["dnsServer"]> {
  try {
    const response = await fetchWithTimeout(
      `https://dns.google/resolve?name=${domain}&type=NS`,
      5000
    );
    const data = await response.json();

    if (data.Answer && data.Answer.length > 0) {
      const nameserver = data.Answer[0].data.replace(/\.$/, "");

      const nsIpResponse = await fetchWithTimeout(
        `https://dns.google/resolve?name=${nameserver}&type=A`,
        5000
      );
      const nsIpData = await nsIpResponse.json();

      const nsIp = nsIpData.Answer?.[0]?.data || "Unknown";

      return {
        ip: nsIp,
        hostname: nameserver,
        dohSupport: false,
      };
    }
  } catch (error) {
    console.error("DNS server lookup failed:", error);
  }

  return {
    ip: "Unknown",
    hostname: "Unknown",
    dohSupport: false,
  };
}

export async function getEnhancedWebCheckData(url: string): Promise<EnhancedWebCheckResult> {
  const urlObj = new URL(url);
  const domain = urlObj.hostname;

  const [ip, dns, dnsServer, archives, threats] = await Promise.all([
    getIPAddress(domain),
    getDNSRecords(domain),
    getDNSServerInfo(domain),
    getArchiveInfo(url),
    checkThreats(url),
  ]);

  const [location, ssl, domainInfo] = await Promise.all([
    getGeolocation(ip),
    getSSLInfo(domain),
    getDomainInfo(domain),
  ]);

  const result: EnhancedWebCheckResult = {
    ip,
    dns,
    dnsServer,
    threats,
  };

  if (location) result.location = location;
  if (ssl) result.ssl = ssl;
  if (domainInfo) result.domain = domainInfo;
  if (archives) result.archives = archives;

  return result;
}

export async function checkQuality(
  url: string,
  html: string,
  headers: Record<string, string>
): Promise<{
  performance: { score: number; issues: string[] };
  seo: { score: number; issues: string[] };
  accessibility: { score: number; issues: string[] };
  overall: number;
}> {
  const performance = { score: 100, issues: [] as string[] };
  const seo = { score: 100, issues: [] as string[] };
  const accessibility = { score: 100, issues: [] as string[] };

  const htmlSize = new Blob([html]).size;
  if (htmlSize > 500000) {
    performance.score -= 10;
    performance.issues.push("Large HTML size may impact load time");
  }

  const hasTitle = /<title[^>]*>([^<]+)<\/title>/i.test(html);
  if (!hasTitle) {
    seo.score -= 15;
    seo.issues.push("Missing title tag");
  }

  const hasMetaDescription =
    /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i.test(html);
  if (!hasMetaDescription) {
    seo.score -= 10;
    seo.issues.push("Missing meta description");
  }

  const hasH1 = /<h1[^>]*>/i.test(html);
  if (!hasH1) {
    seo.score -= 5;
    seo.issues.push("Missing H1 tag");
  }

  const hasAltImages = html.match(/<img[^>]*>/gi) || [];
  const imagesWithoutAlt = hasAltImages.filter((img) => !/alt=["'][^"']+["']/i.test(img));
  if (imagesWithoutAlt.length > 0) {
    accessibility.score -= imagesWithoutAlt.length * 5;
    accessibility.issues.push(`${imagesWithoutAlt.length} image(s) missing alt text`);
  }

  const hasLang = /<html[^>]*lang=["']([^"']+)["']/i.test(html);
  if (!hasLang) {
    accessibility.score -= 5;
    accessibility.issues.push("Missing lang attribute on html tag");
  }

  const hasViewport = /<meta[^>]*name=["']viewport["']/i.test(html);
  if (!hasViewport) {
    performance.score -= 10;
    performance.issues.push("Missing viewport meta tag");
  }

  const scriptCount = (html.match(/<script[^>]*>/gi) || []).length;
  if (scriptCount > 20) {
    performance.score -= 5;
    performance.issues.push("Too many script tags may impact performance");
  }

  performance.score = Math.max(0, performance.score);
  seo.score = Math.max(0, seo.score);
  accessibility.score = Math.max(0, accessibility.score);

  const overall = Math.round((performance.score + seo.score + accessibility.score) / 3);

  return { performance, seo, accessibility, overall };
}

export async function checkTraceRoute(domain: string): Promise<{
  hops: Array<{ hop: number; ip?: string; hostname?: string; rtt?: number }>;
  target: string;
}> {
  const hops: Array<{ hop: number; ip?: string; hostname?: string; rtt?: number }> = [];
  const target = domain;

  try {
    const ip = await getIPAddress(domain);
    if (ip && ip !== "Unknown") {
      hops.push({ hop: 1, ip, hostname: domain });
    }
  } catch (error) {
    console.error("Traceroute failed:", error);
  }

  return { hops, target };
}

export async function checkMailConfig(domain: string): Promise<{
  mx: Array<{ exchange: string; priority: number }>;
  spf: { exists: boolean; record?: string; valid?: boolean };
  dkim: { exists: boolean; record?: string };
  dmarc: { exists: boolean; record?: string; policy?: string };
}> {
  const result = {
    mx: [] as Array<{ exchange: string; priority: number }>,
    spf: { exists: false } as { exists: boolean; record?: string; valid?: boolean },
    dkim: { exists: false } as { exists: boolean; record?: string },
    dmarc: { exists: false } as { exists: boolean; record?: string; policy?: string },
  };

  try {
    const dns = await getDNSRecords(domain);
    if (!dns) {
      return result;
    }

    result.mx = dns.mx || [];

    const txtRecords = dns.txt || [];
    for (const txtArray of txtRecords) {
      const txtRecord = Array.isArray(txtArray) ? txtArray.join(" ") : txtArray;

      if (txtRecord.includes("v=spf1")) {
        result.spf = {
          exists: true,
          record: txtRecord,
          valid: txtRecord.includes("v=spf1"),
        };
      }

      if (txtRecord.includes("v=DKIM1") || txtRecord.includes("k=rsa")) {
        result.dkim = {
          exists: true,
          record: txtRecord,
        };
      }

      if (txtRecord.includes("v=DMARC1")) {
        const policyMatch = txtRecord.match(/p=([^;]+)/);
        result.dmarc = {
          exists: true,
          record: txtRecord,
          policy: policyMatch ? policyMatch[1] : "none",
        };
      }
    }

    const dmarcRecord = await fetchWithTimeout(
      `https://dns.google/resolve?name=_dmarc.${domain}&type=TXT`,
      5000
    ).catch(() => null);

    if (dmarcRecord) {
      const dmarcData = await dmarcRecord.json();
      if (dmarcData.Answer && dmarcData.Answer.length > 0) {
        const dmarcTxt = dmarcData.Answer[0].data.replace(/"/g, "");
        if (dmarcTxt.includes("v=DMARC1")) {
          const policyMatch = dmarcTxt.match(/p=([^;]+)/);
          result.dmarc = {
            exists: true,
            record: dmarcTxt,
            policy: policyMatch ? policyMatch[1] : "none",
          };
        }
      }
    }
  } catch (error) {
    console.error("Mail config check failed:", error);
  }

  return result;
}

export async function checkRank(domain: string): Promise<{
  alexa?: number;
  mozRank?: number;
  domainAuthority?: number;
  backlinks?: number;
}> {
  const result: {
    alexa?: number;
    mozRank?: number;
    domainAuthority?: number;
    backlinks?: number;
  } = {};

  try {
    const response = await fetchWithTimeout(
      `https://www.alexa.com/siteinfo/${domain}`,
      10000
    ).catch(() => null);

    if (response && response.ok) {
      const text = await response.text();
      const rankMatch = text.match(/Global Rank[^<]*<[^>]*>([^<]+)</i);
      if (rankMatch) {
        const rank = parseInt(rankMatch[1].replace(/,/g, ""));
        if (!isNaN(rank)) {
          result.alexa = rank;
        }
      }
    }
  } catch (error) {
    console.error("Rank check failed:", error);
  }

  return result;
}

export async function getScreenshot(url: string): Promise<{
  url: string;
  width: number;
  height: number;
  timestamp: string;
  service?: string;
}> {
  try {
    const encodedUrl = encodeURIComponent(url);
    const screenshotUrl = `https://image.thum.io/get/width/1280/crop/720/${encodedUrl}`;

    const response = await fetchWithTimeout(screenshotUrl, 15000);

    if (response.ok && response.headers.get("content-type")?.startsWith("image/")) {
      return {
        url: screenshotUrl,
        width: 1280,
        height: 720,
        timestamp: new Date().toISOString(),
        service: "thum.io",
      };
    }
  } catch (error) {
    console.error("Screenshot failed:", error);
  }

  try {
    const encodedUrl = encodeURIComponent(url);
    const screenshotUrl = `https://api.screenshotone.com/take?access_key=demo&url=${encodedUrl}&viewport_width=1280&viewport_height=720&format=png&delay=3`;

    const response = await fetchWithTimeout(screenshotUrl, 15000);

    if (response.ok) {
      return {
        url: screenshotUrl,
        width: 1280,
        height: 720,
        timestamp: new Date().toISOString(),
        service: "screenshotone",
      };
    }
  } catch (error) {
    console.error("Screenshot fallback failed:", error);
  }

  return {
    url: "",
    width: 0,
    height: 0,
    timestamp: new Date().toISOString(),
  };
}

export async function checkTLSCipherSuites(domain: string): Promise<{
  supported: string[];
  recommended: string[];
  weak: string[];
  grade: string;
}> {
  const result = {
    supported: [] as string[],
    recommended: [] as string[],
    weak: [] as string[],
    grade: "Unknown",
  };

  try {
    const response = await fetchWithTimeout(
      `https://api.ssllabs.com/api/v3/analyze?host=${domain}&publish=off&fromCache=on&maxAge=24`,
      15000
    ).catch(() => null);

    if (response && response.ok) {
      const data = await response.json();
      if (data.endpoints && data.endpoints.length > 0) {
        const endpoint = data.endpoints[0];
        if (endpoint.details && endpoint.details.suites) {
          const suites = endpoint.details.suites;
          suites.forEach((suite: any) => {
            if (suite.list) {
              suite.list.forEach((cipher: any) => {
                result.supported.push(cipher.name || "Unknown");
                if (cipher.cipherStrength && cipher.cipherStrength >= 128) {
                  result.recommended.push(cipher.name || "Unknown");
                } else {
                  result.weak.push(cipher.name || "Unknown");
                }
              });
            }
          });
        }
        if (endpoint.grade) {
          result.grade = endpoint.grade;
        }
      }
    }
  } catch (error) {
    console.error("TLS cipher suites check failed:", error);
  }

  return result;
}

export async function checkTLSSecurityConfig(domain: string): Promise<{
  protocol: string;
  certificate: { valid: boolean; issuer?: string; expires?: string };
  hsts: boolean;
  grade: string;
  issues: string[];
}> {
  const result = {
    protocol: "Unknown",
    certificate: { valid: false } as { valid: boolean; issuer?: string; expires?: string },
    hsts: false,
    grade: "Unknown",
    issues: [] as string[],
  };

  try {
    const ssl = await getSSLInfo(domain);
    if (ssl) {
      result.certificate = {
        valid: ssl.daysRemaining ? ssl.daysRemaining > 0 : false,
        issuer: ssl.issuer,
        expires: ssl.expires,
      };
      if (ssl.daysRemaining && ssl.daysRemaining < 30) {
        result.issues.push("Certificate expires soon");
      }
    }

    const response = await fetchWithTimeout(`https://${domain}`, 5000);
    if (response.ok) {
      result.protocol = "TLS 1.2+";
      const hstsHeader = response.headers.get("strict-transport-security");
      result.hsts = !!hstsHeader;
      if (!hstsHeader) {
        result.issues.push("HSTS not enabled");
      }
    }

    const ssllabsResponse = await fetchWithTimeout(
      `https://api.ssllabs.com/api/v3/analyze?host=${domain}&publish=off&fromCache=on&maxAge=24`,
      15000
    ).catch(() => null);

    if (ssllabsResponse && ssllabsResponse.ok) {
      const data = await ssllabsResponse.json();
      if (data.endpoints && data.endpoints.length > 0) {
        result.grade = data.endpoints[0].grade || "Unknown";
      }
    }
  } catch (error) {
    console.error("TLS security config check failed:", error);
  }

  return result;
}

export async function checkTLSClientSupport(domain: string): Promise<{
  tls10: boolean;
  tls11: boolean;
  tls12: boolean;
  tls13: boolean;
  recommended: string[];
}> {
  const result = {
    tls10: false,
    tls11: false,
    tls12: false,
    tls13: false,
    recommended: [] as string[],
  };

  try {
    const response = await fetchWithTimeout(
      `https://api.ssllabs.com/api/v3/analyze?host=${domain}&publish=off&fromCache=on&maxAge=24`,
      15000
    ).catch(() => null);

    if (response && response.ok) {
      const data = await response.json();
      if (data.endpoints && data.endpoints.length > 0) {
        const endpoint = data.endpoints[0];
        if (endpoint.details && endpoint.details.protocols) {
          endpoint.details.protocols.forEach((protocol: any) => {
            if (protocol.name === "TLS 1.0") result.tls10 = protocol.enabled;
            if (protocol.name === "TLS 1.1") result.tls11 = protocol.enabled;
            if (protocol.name === "TLS 1.2") result.tls12 = protocol.enabled;
            if (protocol.name === "TLS 1.3") result.tls13 = protocol.enabled;
          });
        }
      }
    }

    if (result.tls13) result.recommended.push("TLS 1.3");
    if (result.tls12) result.recommended.push("TLS 1.2");
    if (result.tls10 || result.tls11) {
      result.recommended.push("Disable TLS 1.0 and 1.1 (deprecated)");
    }
  } catch (error) {
    console.error("TLS client support check failed:", error);
  }

  return result;
}

export async function checkFeatures(
  url: string,
  html: string,
  headers: Record<string, string>
): Promise<{
  pwa: boolean;
  serviceWorker: boolean;
  webPush: boolean;
  offline: boolean;
  responsive: boolean;
  darkMode: boolean;
  features: string[];
}> {
  const result = {
    pwa: false,
    serviceWorker: false,
    webPush: false,
    offline: false,
    responsive: false,
    darkMode: false,
    features: [] as string[],
  };

  const hasManifest = /<link[^>]*rel=["']manifest["']/i.test(html);
  const hasServiceWorker = /navigator\.serviceWorker|serviceWorker\.register/i.test(html);
  const hasWebPush = /PushManager|pushManager/i.test(html);
  const hasOffline = /applicationCache|offline|cache\.addAll/i.test(html);
  const hasViewport = /<meta[^>]*name=["']viewport["']/i.test(html);
  const hasDarkMode = /prefers-color-scheme|dark-mode|theme-dark/i.test(html);

  result.pwa = hasManifest && hasServiceWorker;
  result.serviceWorker = hasServiceWorker;
  result.webPush = hasWebPush;
  result.offline = hasOffline;
  result.responsive = hasViewport;
  result.darkMode = hasDarkMode;

  if (result.pwa) result.features.push("Progressive Web App");
  if (result.serviceWorker) result.features.push("Service Worker");
  if (result.webPush) result.features.push("Web Push Notifications");
  if (result.offline) result.features.push("Offline Support");
  if (result.responsive) result.features.push("Responsive Design");
  if (result.darkMode) result.features.push("Dark Mode Support");

  return result;
}

export async function checkCarbon(
  url: string,
  html: string
): Promise<{
  emissions: number;
  cleanerThan: number;
  size: number;
  greenHosting: boolean;
  recommendations: string[];
}> {
  const result = {
    emissions: 0,
    cleanerThan: 0,
    size: 0,
    greenHosting: false,
    recommendations: [] as string[],
  };

  try {
    const htmlSize = new Blob([html]).size;
    const jsFiles = html.match(/<script[^>]*src=["']([^"']+)["']/gi) || [];
    const cssFiles =
      html.match(/<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi) || [];
    const images = html.match(/<img[^>]*src=["']([^"']+)["']/gi) || [];

    result.size =
      htmlSize + jsFiles.length * 50000 + cssFiles.length * 20000 + images.length * 100000;

    result.emissions = (result.size / 1024 / 1024) * 0.2;

    if (result.size > 2000000) {
      result.recommendations.push("Optimize page size (currently large)");
    }

    if (jsFiles.length > 10) {
      result.recommendations.push("Reduce number of JavaScript files");
    }

    if (images.length > 20) {
      result.recommendations.push("Optimize images (consider lazy loading)");
    }

    const response = await fetchWithTimeout(url, 5000);
    const server = response.headers.get("server") || "";
    const poweredBy = response.headers.get("x-powered-by") || "";

    const greenHosts = ["green", "sustainable", "renewable", "carbon-neutral"];
    result.greenHosting = greenHosts.some(
      (keyword) =>
        server.toLowerCase().includes(keyword) || poweredBy.toLowerCase().includes(keyword)
    );

    if (!result.greenHosting) {
      result.recommendations.push("Consider using green hosting providers");
    }

    result.cleanerThan = Math.max(0, Math.min(100, 100 - result.emissions * 10));
  } catch (error) {
    console.error("Carbon check failed:", error);
  }

  return result;
}
