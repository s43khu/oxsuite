import cookieData from './cookies.json';

interface CookieAnalysis {
  name: string;
  type: string;
  category: 'tracking' | 'authentication' | 'functional' | 'advertising' | 'analytics' | 'security' | 'session' | 'unknown';
  value: any;
  parsedValue?: any;
  metadata: {
    firstSeen?: string;
    lastAccess?: string;
    timestamp?: number;
    duration?: number;
    version?: string;
    userId?: string;
    sessionId?: string;
    domain?: string;
    purposes?: Record<string, boolean>;
    confirmed?: boolean;
    vendor?: string;
    expiration?: string;
    privacy?: string;
    purpose?: string;
  };
  description: string;
  insights: string[];
}

type CookieCategory = 'tracking' | 'authentication' | 'functional' | 'advertising' | 'analytics' | 'security' | 'session' | 'unknown';

const categoryMap: Record<string, CookieCategory> = {
  'analytics': 'analytics',
  'advertising': 'advertising',
  'functional': 'functional',
  'security': 'security',
  'authentication': 'authentication',
  'tracking': 'tracking',
  'session': 'session',
  'performance': 'functional',
  'social_media': 'tracking',
  'preferences': 'functional'
};

let cookiePatternsCache: Map<string, any> | null = null;

function loadCookiePatterns(): Map<string, any> {
  if (cookiePatternsCache) {
    return cookiePatternsCache;
  }

  cookiePatternsCache = new Map();
  const cookies = cookieData.cookies as Record<string, any>;

  for (const [pattern, info] of Object.entries(cookies)) {
    cookiePatternsCache.set(pattern.toLowerCase(), {
      name: info.name,
      category: categoryMap[info.category] || 'unknown',
      vendor: info.vendor,
      description: info.description,
      expiration: info.expiration,
      privacy: info.privacy,
      purpose: info.purpose
    });
  }

  return cookiePatternsCache;
}

function findCookieMatch(cookieName: string): any | null {
  const patterns = loadCookiePatterns();
  const lowerName = cookieName.toLowerCase();

  const exactMatch = patterns.get(lowerName);
  if (exactMatch) {
    return exactMatch;
  }

  for (const [pattern, info] of patterns.entries()) {
    if (pattern.endsWith('_') && lowerName.startsWith(pattern)) {
      return info;
    }
    if (pattern.startsWith('_') && pattern.endsWith('_') && lowerName.includes(pattern)) {
      return info;
    }
    if (lowerName.startsWith(pattern) || lowerName.includes(pattern)) {
      return info;
    }
  }

  return null;
}

export function analyzeCookie(name: string, value: string, parsedValue?: any): CookieAnalysis {
  const analysis: CookieAnalysis = {
    name,
    type: 'Unknown',
    category: 'unknown',
    value,
    parsedValue,
    metadata: {},
    description: 'Unknown cookie type',
    insights: []
  };

  const match = findCookieMatch(name);
  if (match) {
    analysis.type = match.name;
    analysis.category = match.category;
    analysis.description = match.description;
    if (match.vendor) {
      analysis.metadata.vendor = match.vendor;
    }
    if (match.expiration) {
      analysis.metadata.expiration = match.expiration;
    }
    if (match.privacy) {
      analysis.metadata.privacy = match.privacy;
    }
    if (match.purpose) {
      analysis.metadata.purpose = match.purpose;
    }
  }

  const valueToAnalyze = parsedValue || value;

  if (typeof valueToAnalyze === 'object' && valueToAnalyze !== null) {
    analysis.parsedValue = valueToAnalyze;

    if ('timestamp' in valueToAnalyze) {
      analysis.metadata.timestamp = typeof valueToAnalyze.timestamp === 'number' 
        ? valueToAnalyze.timestamp 
        : Date.parse(valueToAnalyze.timestamp);
      if (analysis.metadata.timestamp) {
        analysis.metadata.firstSeen = new Date(analysis.metadata.timestamp).toUTCString();
      }
    }

    if ('created' in valueToAnalyze) {
      const created = typeof valueToAnalyze.created === 'number' ? valueToAnalyze.created : Date.parse(valueToAnalyze.created);
      if (created) {
        analysis.metadata.firstSeen = new Date(created).toUTCString();
        analysis.metadata.timestamp = created;
      }
    }

    if ('time' in valueToAnalyze) {
      analysis.metadata.timestamp = valueToAnalyze.time;
      analysis.metadata.lastAccess = new Date(valueToAnalyze.time).toUTCString();
    }

    if ('c' in valueToAnalyze) {
      analysis.metadata.timestamp = valueToAnalyze.c;
      analysis.metadata.lastAccess = new Date(valueToAnalyze.c).toUTCString();
    }

    if ('userId' in valueToAnalyze) {
      analysis.metadata.userId = valueToAnalyze.userId;
    }

    if ('id' in valueToAnalyze) {
      if (name.includes('user') || name.includes('User')) {
        analysis.metadata.userId = valueToAnalyze.id;
      } else if (name.includes('session') || name.includes('Session')) {
        analysis.metadata.sessionId = valueToAnalyze.id;
      }
    }

    if ('sessionId' in valueToAnalyze) {
      analysis.metadata.sessionId = valueToAnalyze.sessionId;
    }

    if ('purposes' in valueToAnalyze) {
      analysis.metadata.purposes = valueToAnalyze.purposes;
      analysis.metadata.confirmed = valueToAnalyze.confirmed;
    }

    if ('duration' in valueToAnalyze) {
      analysis.metadata.duration = valueToAnalyze.duration;
    }

    if ('version' in valueToAnalyze) {
      analysis.metadata.version = valueToAnalyze.version;
    }

    if ('lastAccess' in valueToAnalyze) {
      const lastAccess = typeof valueToAnalyze.lastAccess === 'number' 
        ? valueToAnalyze.lastAccess 
        : Date.parse(valueToAnalyze.lastAccess);
      if (lastAccess) {
        analysis.metadata.lastAccess = new Date(lastAccess).toUTCString();
      }
    }
  } else if (typeof valueToAnalyze === 'string') {
    if (valueToAnalyze.startsWith('GA1.')) {
      const parts = valueToAnalyze.split('.');
      if (parts.length >= 3) {
        const timestamp = parseInt(parts[2], 10);
        if (timestamp) {
          analysis.metadata.timestamp = timestamp;
          analysis.metadata.firstSeen = new Date(timestamp * 1000).toUTCString();
        }
      }
    }

    if (valueToAnalyze.startsWith('GS')) {
      const parts = valueToAnalyze.split('$');
      if (parts.length > 0) {
        const sessionData = parts[0].replace('GS', '').split('.');
        if (sessionData.length >= 2) {
          const timestamp = parseInt(sessionData[1], 10);
          if (timestamp) {
            analysis.metadata.timestamp = timestamp;
            analysis.metadata.lastAccess = new Date(timestamp * 1000).toUTCString();
          }
        }
      }
    }

    if (valueToAnalyze.startsWith('fb.')) {
      const parts = valueToAnalyze.split('.');
      if (parts.length >= 3) {
        const timestamp = parseInt(parts[2], 10);
        if (timestamp) {
          analysis.metadata.timestamp = timestamp;
          analysis.metadata.firstSeen = new Date(timestamp).toUTCString();
        }
      }
    }
  }

  if (name === '__cf_bm') {
    const parts = valueToAnalyze.split('.');
    if (parts.length >= 2) {
      try {
        const decoded = atob(parts[0]);
        const data = JSON.parse(decoded);
        if (data.ts) {
          analysis.metadata.timestamp = data.ts * 1000;
          analysis.metadata.lastAccess = new Date(data.ts * 1000).toUTCString();
        }
        if (data.v) {
          analysis.metadata.version = data.v;
        }
      } catch {
        // Ignore parsing errors
      }
    }
  }

  if (name === '_cfuvid') {
    if (typeof valueToAnalyze === 'string') {
      analysis.metadata.duration = 604800000;
      if (analysis.metadata.timestamp) {
        const expiry = new Date(analysis.metadata.timestamp + 604800000);
        analysis.insights.push(`Expires: ${expiry.toUTCString()} (7 days)`);
      }
    }
  }

  if (analysis.metadata.purposes) {
    const purposes = Object.keys(analysis.metadata.purposes).filter(
      p => analysis.metadata.purposes![p]
    );
    if (purposes.length > 0) {
      analysis.insights.push(`Consent purposes: ${purposes.join(', ')}`);
    }
  }

  if (analysis.metadata.userId) {
    analysis.insights.push(`User ID: ${analysis.metadata.userId}`);
  }

  if (analysis.metadata.sessionId) {
    analysis.insights.push(`Session ID: ${analysis.metadata.sessionId}`);
  }

  if (analysis.metadata.vendor) {
    analysis.insights.push(`Vendor: ${analysis.metadata.vendor}`);
  }

  if (analysis.metadata.expiration) {
    analysis.insights.push(`Expiration: ${analysis.metadata.expiration}`);
  }

  return analysis;
}

export function generateCookieSummary(analyses: CookieAnalysis[], domain?: string): {
  domain: string;
  totalCookies: number;
  categories: Record<string, number>;
  trackingServices: string[];
  consentStatus: {
    hasConsent: boolean;
    purposes?: Record<string, boolean>;
  };
  sessionInfo: {
    firstSeen?: string;
    lastAccess?: string;
  };
  insights: string[];
} {
  const summary = {
    domain: domain || 'Unknown',
    totalCookies: analyses.length,
    categories: {} as Record<string, number>,
    trackingServices: [] as string[],
    consentStatus: {
      hasConsent: false,
      purposes: {} as Record<string, boolean>
    },
    sessionInfo: {} as { firstSeen?: string; lastAccess?: string },
    insights: [] as string[]
  };

  const seenServices = new Set<string>();
  const timestamps: number[] = [];

  analyses.forEach(analysis => {
    summary.categories[analysis.category] = (summary.categories[analysis.category] || 0) + 1;

    if (analysis.category === 'analytics' || analysis.category === 'advertising' || analysis.category === 'tracking') {
      if (!seenServices.has(analysis.type)) {
        seenServices.add(analysis.type);
        summary.trackingServices.push(analysis.type);
      }
    }

    if (analysis.metadata.purposes) {
      summary.consentStatus.hasConsent = true;
      Object.entries(analysis.metadata.purposes).forEach(([purpose, enabled]) => {
        if (enabled) {
          summary.consentStatus.purposes![purpose] = true;
        }
      });
    }

    if (analysis.metadata.timestamp) {
      timestamps.push(analysis.metadata.timestamp);
    }

    if (analysis.metadata.lastAccess) {
      const lastAccessTime = new Date(analysis.metadata.lastAccess).getTime();
      if (!summary.sessionInfo.lastAccess || lastAccessTime > new Date(summary.sessionInfo.lastAccess).getTime()) {
        summary.sessionInfo.lastAccess = analysis.metadata.lastAccess;
      }
    }
  });

  if (timestamps.length > 0) {
    const earliest = Math.min(...timestamps);
    summary.sessionInfo.firstSeen = new Date(earliest).toUTCString();
  }

  if (summary.trackingServices.length > 0) {
    summary.insights.push(`Active tracking services: ${summary.trackingServices.join(', ')}`);
  }

  if (summary.consentStatus.hasConsent) {
    const purposes = Object.keys(summary.consentStatus.purposes || {});
    if (purposes.length > 0) {
      summary.insights.push(`User consented to: ${purposes.join(', ')}`);
    }
  }

  if (summary.sessionInfo.firstSeen && summary.sessionInfo.lastAccess) {
    const firstDate = new Date(summary.sessionInfo.firstSeen);
    const lastDate = new Date(summary.sessionInfo.lastAccess);
    const daysDiff = Math.floor((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 0) {
      summary.insights.push(`User tracked since ${firstDate.toLocaleDateString()} (${daysDiff} days)`);
    }
  }

  return summary;
}
