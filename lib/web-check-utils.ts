export interface DNSRecords {
  a?: string[];
  aaaa?: string[];
  mx?: { exchange: string; priority: number }[];
  txt?: string[][];
  ns?: string[];
  cname?: string[];
  soa?: {
    nsname: string;
    hostmaster: string;
    serial: number;
    refresh: number;
    retry: number;
    expire: number;
    minttl: number;
  };
}

export const commonSubdomains = [
  'www', 'mail', 'ftp', 'localhost', 'webmail', 'smtp', 'pop', 'ns1', 'webdisk',
  'ns2', 'cpanel', 'whm', 'autodiscover', 'autoconfig', 'm', 'imap', 'test',
  'ns', 'blog', 'pop3', 'dev', 'www2', 'admin', 'forum', 'news', 'vpn',
  'ns3', 'mail2', 'new', 'mysql', 'old', 'lists', 'support', 'mobile', 'mx',
  'static', 'docs', 'beta', 'shop', 'sql', 'secure', 'demo', 'cp', 'calendar',
  'wiki', 'web', 'media', 'email', 'images', 'img', 'www1', 'intranet',
  'portal', 'video', 'sip', 'dns2', 'api', 'cdn', 'stats', 'dns1', 'ns4',
  'www3', 'dns', 'search', 'staging', 'server', 'mx1', 'chat', 'wap', 'my',
  'svn', 'mail1', 'sites', 'proxy', 'ads', 'host', 'crm', 'cms', 'backup',
  'mx2', 'lyncdiscover', 'info', 'apps', 'download', 'remote', 'db', 'forums',
  'store', 'relay', 'files', 'newsletter', 'app', 'live', 'owa', 'en', 'start',
  'sms', 'office', 'exchange', 'ipv4', 'help', 'home', 'git', 'dashboard',
  'assets', 'internal', 'services', 'network', 'manage', 'preview', 'public'
];

export const commonPorts: Record<number, string> = {
  21: 'FTP',
  22: 'SSH',
  23: 'Telnet',
  25: 'SMTP',
  53: 'DNS',
  80: 'HTTP',
  110: 'POP3',
  143: 'IMAP',
  443: 'HTTPS',
  445: 'SMB',
  3306: 'MySQL',
  3389: 'RDP',
  5432: 'PostgreSQL',
  6379: 'Redis',
  8080: 'HTTP Alternate',
  8443: 'HTTPS Alternate',
  27017: 'MongoDB'
};

export async function fetchWithTimeout(url: string, timeout = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      redirect: 'follow'
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export async function checkCommonFiles(baseUrl: string): Promise<Array<{path: string; exists: boolean; size?: number}>> {
  const commonPaths = [
    '/robots.txt',
    '/.well-known/security.txt',
    '/sitemap.xml',
    '/.env',
    '/config.php',
    '/wp-config.php',
    '/.git/config',
    '/package.json',
    '/composer.json',
    '/.htaccess',
    '/admin',
    '/phpmyadmin',
    '/wp-admin',
    '/api',
    '/.env.local',
    '/backup.sql',
    '/.DS_Store',
    '/crossdomain.xml'
  ];

  const results = await Promise.all(
    commonPaths.map(async (path) => {
      try {
        const response = await fetchWithTimeout(`${baseUrl}${path}`, 5000);
        return {
          path,
          exists: response.ok,
          size: response.ok ? parseInt(response.headers.get('content-length') || '0') : undefined
        };
      } catch {
        return { path, exists: false };
      }
    })
  );

  return results.filter(r => r.exists);
}

export async function checkRobotsTxt(baseUrl: string) {
  try {
    const response = await fetchWithTimeout(`${baseUrl}/robots.txt`, 5000);
    if (!response.ok) return { exists: false };
    
    const content = await response.text();
    const disallowedPaths = content.match(/Disallow:\s*([^\n\r]+)/gi)?.map(line => 
      line.replace(/Disallow:\s*/i, '').trim()
    ) || [];
    
    const sitemaps = content.match(/Sitemap:\s*([^\n\r]+)/gi)?.map(line =>
      line.replace(/Sitemap:\s*/i, '').trim()
    ) || [];

    return {
      exists: true,
      content,
      disallowedPaths,
      sitemaps
    };
  } catch {
    return { exists: false };
  }
}

export async function checkSecurityTxt(baseUrl: string) {
  try {
    const response = await fetchWithTimeout(`${baseUrl}/.well-known/security.txt`, 5000);
    if (!response.ok) return { exists: false };
    
    const content = await response.text();
    return { exists: true, content };
  } catch {
    return { exists: false };
  }
}

export function extractEmails(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = text.match(emailRegex) || [];
  return [...new Set(emails)];
}

export function extractPhoneNumbers(text: string): string[] {
  const phoneRegex = /(\+?1?\s*\(?[0-9]{3}\)?[\s.-]?[0-9]{3}[\s.-]?[0-9]{4})/g;
  const phones = text.match(phoneRegex) || [];
  return [...new Set(phones)];
}

export function extractApiKeys(text: string): string[] {
  const patterns = [
    /AIza[0-9A-Za-z-_]{35}/g,
    /sk_live_[0-9a-zA-Z]{24,}/g,
    /sk_test_[0-9a-zA-Z]{24,}/g,
    /AKIA[0-9A-Z]{16}/g,
    /ya29\.[0-9A-Za-z\-_]+/g,
  ];
  
  const keys: string[] = [];
  patterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) keys.push(...matches);
  });
  
  return [...new Set(keys)];
}

export function extractInternalPaths(text: string): string[] {
  const pathRegex = /["'](\/[a-zA-Z0-9/_-]+)["']/g;
  const paths: string[] = [];
  let match;
  
  while ((match = pathRegex.exec(text)) !== null) {
    if (match[1] && !match[1].includes('http') && !match[1].includes('.css') && !match[1].includes('.js')) {
      paths.push(match[1]);
    }
  }
  
  return [...new Set(paths)].slice(0, 50);
}

export interface Technology {
  name: string;
  version?: string;
  confidence: 'high' | 'medium' | 'low';
  category?: string;
  evidence?: string[];
}

export interface TechDetectionResult {
  technologies: Technology[];
  cdn?: string;
  server?: string;
  cms?: string;
  frameworks: string[];
  analytics: string[];
  security: string[];
}

const TECH_PATTERNS = {
  frameworks: [
    {
      name: 'Next.js',
      patterns: [
        /__NEXT_DATA__/,
        /_next\//,
        /\/_next\/static\//,
        /next\.js/i,
        /class="__next"/,
        /id="__next"/
      ],
      versionPattern: /"buildId":"([^"]+)"/,
      confidence: 'high'
    },
    {
      name: 'Nuxt.js',
      patterns: [
        /__nuxt/,
        /_nuxt\//,
        /window\.__NUXT__/,
        /nuxt\.js/i
      ],
      versionPattern: /nuxt[\/\-](\d+\.\d+\.\d+)/i,
      confidence: 'high'
    },
    {
      name: 'React',
      patterns: [
        /__react/i,
        /react-dom/,
        /react\.production/,
        /react\.development/,
        /data-reactroot/,
        /data-react-/
      ],
      versionPattern: /react[\/\-@](\d+\.\d+\.\d+)/i,
      confidence: 'medium'
    },
    {
      name: 'Vue.js',
      patterns: [
        /\bvue\.js\b/i,
        /data-v-[a-f0-9]{8}/,
        /\bvue\b.*\.js/,
        /__vue/
      ],
      versionPattern: /vue[\/\-@](\d+\.\d+\.\d+)/i,
      confidence: 'medium'
    },
    {
      name: 'Angular',
      patterns: [
        /ng-version/,
        /ng-app/,
        /_angular/,
        /angular\.js/i,
        /\[ng-/
      ],
      versionPattern: /ng-version="([^"]+)"/,
      confidence: 'high'
    },
    {
      name: 'Svelte',
      patterns: [
        /svelte/i,
        /class="svelte-/,
        /data-svelte/
      ],
      confidence: 'medium'
    },
    {
      name: 'Remix',
      patterns: [
        /__remix/,
        /remix\.js/i,
        /"context":{"remix"/
      ],
      confidence: 'high'
    },
    {
      name: 'Astro',
      patterns: [
        /astro-/,
        /data-astro-/,
        /\.astro/
      ],
      confidence: 'high'
    },
    {
      name: 'SvelteKit',
      patterns: [
        /__sveltekit/,
        /_app\/immutable/,
        /sveltekit/i
      ],
      confidence: 'high'
    },
    {
      name: 'Gatsby',
      patterns: [
        /___gatsby/,
        /gatsby-/,
        /public\/static\/[a-f0-9]+\/[a-f0-9]+\.js/
      ],
      confidence: 'high'
    }
  ],
  cms: [
    {
      name: 'WordPress',
      patterns: [
        /wp-content/,
        /wp-includes/,
        /\/wordpress\//i,
        /<meta name="generator" content="WordPress/,
        /\/xmlrpc\.php/
      ],
      versionPattern: /WordPress (\d+\.\d+\.?\d*)/i,
      confidence: 'high'
    },
    {
      name: 'Drupal',
      patterns: [
        /Drupal/,
        /\/sites\/default\/files\//,
        /\/modules\//,
        /\/themes\//,
        /Drupal\.settings/
      ],
      versionPattern: /Drupal (\d+)/,
      confidence: 'high'
    },
    {
      name: 'Joomla',
      patterns: [
        /\/components\/com_/,
        /Joomla!/,
        /\/media\/jui\//
      ],
      confidence: 'high'
    },
    {
      name: 'Shopify',
      patterns: [
        /cdn\.shopify\.com/,
        /\/wpm@/,
        /Shopify\.theme/,
        /shopify-section/
      ],
      confidence: 'high'
    },
    {
      name: 'Webflow',
      patterns: [
        /webflow\.com/,
        /data-wf-page/,
        /\.webflow\.io/
      ],
      confidence: 'high'
    },
    {
      name: 'Wix',
      patterns: [
        /static\.wixstatic\.com/,
        /wix\.com/,
        /parastorage\.com/
      ],
      confidence: 'high'
    },
    {
      name: 'Squarespace',
      patterns: [
        /squarespace/i,
        /\.sqsp\./,
        /static1\.squarespace/
      ],
      confidence: 'high'
    },
    {
      name: 'Ghost',
      patterns: [
        /ghost\.io/,
        /ghost-/,
        /powered by Ghost/i
      ],
      confidence: 'high'
    },
    {
      name: 'Contentful',
      patterns: [
        /contentful\.com/,
        /\/\/images\.ctfassets\.net/
      ],
      confidence: 'high'
    },
    {
      name: 'Strapi',
      patterns: [
        /X-Powered-By: Strapi/i,
        /strapi/i
      ],
      confidence: 'medium'
    }
  ],
  analytics: [
    {
      name: 'Google Analytics',
      patterns: [
        /google-analytics\.com\/analytics\.js/,
        /googletagmanager\.com\/gtag\/js/,
        /ga\.js/,
        /gtag\(/,
        /ga\(['"]create['"]/
      ],
      versionPattern: /UA-\d+-\d+|G-[A-Z0-9]+/,
      confidence: 'high'
    },
    {
      name: 'Google Tag Manager',
      patterns: [
        /googletagmanager\.com\/gtm\.js/,
        /GTM-[A-Z0-9]+/
      ],
      confidence: 'high'
    },
    {
      name: 'Facebook Pixel',
      patterns: [
        /connect\.facebook\.net\/.*\/fbevents\.js/,
        /fbq\(/
      ],
      confidence: 'high'
    },
    {
      name: 'Hotjar',
      patterns: [
        /static\.hotjar\.com/,
        /hj\(/
      ],
      confidence: 'high'
    },
    {
      name: 'Mixpanel',
      patterns: [
        /cdn\.mxpnl\.com/,
        /mixpanel/
      ],
      confidence: 'high'
    },
    {
      name: 'Segment',
      patterns: [
        /cdn\.segment\.com/,
        /analytics\.js/
      ],
      confidence: 'medium'
    },
    {
      name: 'Matomo',
      patterns: [
        /matomo\.js/,
        /piwik\.js/,
        /_paq\.push/
      ],
      confidence: 'high'
    },
    {
      name: 'Plausible',
      patterns: [
        /plausible\.io\/js\//
      ],
      confidence: 'high'
    }
  ],
  cdn: [
    {
      name: 'Cloudflare',
      headers: ['cf-ray', 'cf-cache-status', 'cf-request-id'],
      patterns: [/cloudflare/i],
      confidence: 'high'
    },
    {
      name: 'AWS CloudFront',
      headers: ['x-amz-cf-id', 'x-amz-cf-pop'],
      patterns: [/cloudfront\.net/],
      confidence: 'high'
    },
    {
      name: 'Fastly',
      headers: ['x-fastly-request-id', 'fastly-io-info'],
      patterns: [/fastly/i],
      confidence: 'high'
    },
    {
      name: 'Akamai',
      headers: ['x-akamai-transformed', 'akamai-origin-hop'],
      patterns: [/akamai/i],
      confidence: 'high'
    },
    {
      name: 'Vercel',
      headers: ['x-vercel-id', 'x-vercel-cache'],
      patterns: [/vercel\.app/, /\.vercel-analytics\.com/],
      confidence: 'high'
    },
    {
      name: 'Netlify',
      headers: ['x-nf-request-id', 'server: Netlify'],
      patterns: [/netlify\.app/, /\.netlify\.com/],
      confidence: 'high'
    },
    {
      name: 'Heroku',
      headers: ['via: .*heroku'],
      patterns: [/herokuapp\.com/],
      confidence: 'high'
    }
  ],
  security: [
    {
      name: 'reCAPTCHA',
      patterns: [
        /google\.com\/recaptcha/,
        /recaptcha/
      ],
      confidence: 'high'
    },
    {
      name: 'hCaptcha',
      patterns: [
        /hcaptcha\.com/,
        /hcaptcha/
      ],
      confidence: 'high'
    },
    {
      name: 'Cloudflare Turnstile',
      patterns: [
        /challenges\.cloudflare\.com/,
        /turnstile/
      ],
      confidence: 'high'
    }
  ]
};

function detectBundlerArtifacts(html: string): Technology[] {
  const technologies: Technology[] = [];
  
  if (/webpackJsonp|__webpack/.test(html)) {
    technologies.push({
      name: 'Webpack',
      confidence: 'high',
      category: 'bundler'
    });
  }
  
  if (/@vite\/client|import\.meta\.hot/.test(html)) {
    technologies.push({
      name: 'Vite',
      confidence: 'high',
      category: 'bundler'
    });
  }
  
  if (/\/\*! rollup |rollup\.js/.test(html)) {
    technologies.push({
      name: 'Rollup',
      confidence: 'medium',
      category: 'bundler'
    });
  }
  
  if (/parcel-bundler/.test(html)) {
    technologies.push({
      name: 'Parcel',
      confidence: 'high',
      category: 'bundler'
    });
  }
  
  return technologies;
}

function detectCSSFrameworks(html: string): Technology[] {
  const technologies: Technology[] = [];
  
  const cssPatterns = [
    { name: 'Tailwind CSS', pattern: /class="[^"]*(?:flex|grid|text-|bg-|p-|m-|w-|h-)[a-z0-9-]*/ },
    { name: 'Bootstrap', pattern: /class="[^"]*(?:container|row|col-|btn-|alert-)/ },
    { name: 'Material-UI', pattern: /class="[^"]*MuiButton|MuiPaper|MuiGrid/ },
    { name: 'Ant Design', pattern: /class="[^"]*ant-btn|ant-layout|ant-menu/ },
    { name: 'Chakra UI', pattern: /class="[^"]*chakra-/ },
    { name: 'Bulma', pattern: /class="[^"]*(?:container|columns|column|button is-)/ },
    { name: 'Foundation', pattern: /class="[^"]*(?:grid-x|cell|callout)/ }
  ];
  
  for (const { name, pattern } of cssPatterns) {
    const matches = html.match(new RegExp(pattern, 'g'));
    if (matches && matches.length > 3) {
      technologies.push({
        name,
        confidence: matches.length > 10 ? 'high' : 'medium',
        category: 'css-framework'
      });
    }
  }
  
  return technologies;
}

function detectFromScripts(html: string): Technology[] {
  const technologies: Technology[] = [];
  const scriptMatches = html.match(/<script[^>]*src=["']([^"']+)["']/gi) || [];
  
  const cdnPatterns = [
    { pattern: /unpkg\.com\/([^@\/]+)@?([^\/]*)/i, name: '$1', version: '$2' },
    { pattern: /cdn\.jsdelivr\.net\/npm\/([^@\/]+)@?([^\/]*)/i, name: '$1', version: '$2' },
    { pattern: /cdnjs\.cloudflare\.com\/ajax\/libs\/([^\/]+)\/([^\/]+)/i, name: '$1', version: '$2' },
    { pattern: /cdn\.skypack\.dev\/([^@\/]+)@?([^\/]*)/i, name: '$1', version: '$2' }
  ];
  
  for (const scriptTag of scriptMatches) {
    for (const { pattern, name: namePattern, version: versionPattern } of cdnPatterns) {
      const match = scriptTag.match(pattern);
      if (match) {
        technologies.push({
          name: match[1],
          version: match[2] || undefined,
          confidence: 'high',
          category: 'library'
        });
      }
    }
  }
  
  return technologies;
}

function detectMetaGenerators(html: string): Technology[] {
  const technologies: Technology[] = [];
  const generatorMatches = html.match(/<meta[^>]*name=["']generator["'][^>]*content=["']([^"']+)["']/i);
  
  if (generatorMatches && generatorMatches[1]) {
    const generator = generatorMatches[1];
    const versionMatch = generator.match(/(\d+\.\d+\.?\d*)/);
    
    technologies.push({
      name: generator.split(/\s+/)[0],
      version: versionMatch?.[1],
      confidence: 'high',
      category: 'cms'
    });
  }
  
  return technologies;
}

function detectFromHeaders(headers: Record<string, string>): Technology[] {
  const technologies: Technology[] = [];
  const lowerHeaders: Record<string, string> = {};
  
  Object.keys(headers).forEach(key => {
    lowerHeaders[key.toLowerCase()] = headers[key];
  });
  
  if (lowerHeaders['server']) {
    const server = lowerHeaders['server'];
    const [name, version] = server.split('/');
    technologies.push({
      name: name.trim(),
      version: version?.trim(),
      confidence: 'high',
      category: 'server'
    });
  }
  
  if (lowerHeaders['x-powered-by']) {
    const powered = lowerHeaders['x-powered-by'];
    const [name, version] = powered.split('/');
    technologies.push({
      name: name.trim(),
      version: version?.trim(),
      confidence: 'high',
      category: 'backend'
    });
  }
  
  const originHeaders = [
    'x-origin-server',
    'x-backend-server',
    'x-served-by',
    'x-upstream-server'
  ];
  
  for (const header of originHeaders) {
    if (lowerHeaders[header]) {
      technologies.push({
        name: lowerHeaders[header],
        confidence: 'medium',
        category: 'server',
        evidence: [`Header: ${header}`]
      });
    }
  }
  
  return technologies;
}

function matchPatterns(
  content: string,
  headers: Record<string, string>,
  category: keyof typeof TECH_PATTERNS
): Technology[] {
  const technologies: Technology[] = [];
  const patterns = TECH_PATTERNS[category] as any[];
  
  for (const tech of patterns) {
    let matched = false;
    let version: string | undefined;
    const evidence: string[] = [];
    
    if (tech.patterns) {
      for (const pattern of tech.patterns) {
        if (pattern.test(content)) {
          matched = true;
          evidence.push(`Pattern: ${pattern.toString()}`);
          break;
        }
      }
    }
    
    if (tech.headers) {
      const lowerHeaders: Record<string, string> = {};
      Object.keys(headers).forEach(key => {
        lowerHeaders[key.toLowerCase()] = headers[key];
      });
      
      for (const header of tech.headers) {
        if (lowerHeaders[header.toLowerCase()]) {
          matched = true;
          evidence.push(`Header: ${header}`);
        }
      }
    }
    
    if (matched && tech.versionPattern) {
      const versionMatch = content.match(tech.versionPattern);
      version = versionMatch?.[1];
    }
    
    if (matched) {
      technologies.push({
        name: tech.name,
        version,
        confidence: tech.confidence,
        category,
        evidence: evidence.length > 0 ? evidence : undefined
      });
    }
  }
  
  return technologies;
}

export function detectTechnologies(html: string, headers: Record<string, string>): Array<{name: string; version?: string; confidence: 'high' | 'medium' | 'low'}> {
  const allTechnologies: Technology[] = [];
  
  allTechnologies.push(...detectFromHeaders(headers));
  allTechnologies.push(...detectMetaGenerators(html));
  allTechnologies.push(...detectBundlerArtifacts(html));
  allTechnologies.push(...detectCSSFrameworks(html));
  allTechnologies.push(...detectFromScripts(html));
  
  allTechnologies.push(...matchPatterns(html, headers, 'frameworks'));
  allTechnologies.push(...matchPatterns(html, headers, 'cms'));
  allTechnologies.push(...matchPatterns(html, headers, 'analytics'));
  allTechnologies.push(...matchPatterns(html, headers, 'cdn'));
  allTechnologies.push(...matchPatterns(html, headers, 'security'));
  
  const uniqueTechs = new Map<string, Technology>();
  for (const tech of allTechnologies) {
    const key = tech.name.toLowerCase();
    const existing = uniqueTechs.get(key);
    
    if (!existing || tech.confidence === 'high') {
      uniqueTechs.set(key, tech);
    }
  }
  
  const technologies = Array.from(uniqueTechs.values());
  
  return technologies.map(t => ({
    name: t.name,
    version: t.version,
    confidence: t.confidence
  }));
}

export function detectCDN(headers: Record<string, string>) {
  if (headers['cf-ray'] || headers['cf-cache-status']) {
    return { detected: true, provider: 'Cloudflare' };
  }
  if (headers['x-amz-cf-id']) {
    return { detected: true, provider: 'AWS CloudFront' };
  }
  if (headers['x-fastly-request-id']) {
    return { detected: true, provider: 'Fastly' };
  }
  if (headers['x-akamai-transformed']) {
    return { detected: true, provider: 'Akamai' };
  }
  return { detected: false };
}

export function detectAnalytics(html: string) {
  return {
    googleAnalytics: html.includes('google-analytics.com') || html.includes('gtag'),
    facebookPixel: html.includes('facebook.net/en_US/fbevents.js') || html.includes('fbq('),
    hotjar: html.includes('hotjar.com'),
    mixpanel: html.includes('mixpanel.com'),
    customTrackers: []
  };
}

export function extractJSLibraries(html: string) {
  const libraries: Array<{name: string; version?: string; vulnerabilities?: string[]}> = [];
  
  const jqueryMatch = html.match(/jquery[.-]?([\d.]+)?(\.min)?\.js/i);
  if (jqueryMatch) {
    libraries.push({ name: 'jQuery', version: jqueryMatch[1] });
  }

  const bootstrapMatch = html.match(/bootstrap[.-]?([\d.]+)?(\.min)?\.js/i);
  if (bootstrapMatch) {
    libraries.push({ name: 'Bootstrap', version: bootstrapMatch[1] });
  }

  if (html.includes('lodash')) {
    libraries.push({ name: 'Lodash' });
  }

  if (html.includes('moment.js') || html.includes('moment.min.js')) {
    libraries.push({ name: 'Moment.js' });
  }

  return libraries;
}

export function extractMetadata(html: string) {
  const metadata: any = {};

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  metadata.title = titleMatch?.[1]?.trim();

  const metaRegex = /<meta[^>]*name=["']([^"']+)["'][^>]*content=["']([^"']+)["']/gi;
  let match;
  while ((match = metaRegex.exec(html)) !== null) {
    const name = match[1].toLowerCase();
    const content = match[2];
    
    if (name === 'description') metadata.description = content;
    if (name === 'keywords') metadata.keywords = content;
    if (name === 'author') metadata.author = content;
    if (name === 'robots') metadata.robots = content;
  }

  const ogTags: Record<string, string> = {};
  const ogRegex = /<meta[^>]*property=["']og:([^"']+)["'][^>]*content=["']([^"']+)["']/gi;
  while ((match = ogRegex.exec(html)) !== null) {
    ogTags[match[1]] = match[2];
  }
  if (Object.keys(ogTags).length > 0) metadata.ogTags = ogTags;

  const twitterTags: Record<string, string> = {};
  const twitterRegex = /<meta[^>]*name=["']twitter:([^"']+)["'][^>]*content=["']([^"']+)["']/gi;
  while ((match = twitterRegex.exec(html)) !== null) {
    twitterTags[match[1]] = match[2];
  }
  if (Object.keys(twitterTags).length > 0) metadata.twitterTags = twitterTags;

  return metadata;
}

export function analyzeSecurity(headers: Record<string, string>) {
  const missingHeaders = [];
  
  if (!headers['strict-transport-security']) missingHeaders.push('Strict-Transport-Security');
  if (!headers['content-security-policy']) missingHeaders.push('Content-Security-Policy');
  if (!headers['x-frame-options']) missingHeaders.push('X-Frame-Options');
  if (!headers['x-content-type-options']) missingHeaders.push('X-Content-Type-Options');
  if (!headers['x-xss-protection']) missingHeaders.push('X-XSS-Protection');
  if (!headers['referrer-policy']) missingHeaders.push('Referrer-Policy');

  const vulnerabilities = [];
  
  if (headers['server']) {
    vulnerabilities.push('Server header exposes server information');
  }
  if (headers['x-powered-by']) {
    vulnerabilities.push('X-Powered-By header exposes technology stack');
  }
  if (!headers['x-frame-options'] && !headers['content-security-policy']?.includes('frame-ancestors')) {
    vulnerabilities.push('Missing clickjacking protection');
  }

  const setCookieHeaders = Object.entries(headers)
    .filter(([key]) => key.toLowerCase() === 'set-cookie')
    .map(([, value]) => value);

  const cookiesSecurity = {
    hasSecureFlag: setCookieHeaders.some(cookie => cookie.toLowerCase().includes('secure')),
    hasHttpOnlyFlag: setCookieHeaders.some(cookie => cookie.toLowerCase().includes('httponly')),
    hasSameSiteFlag: setCookieHeaders.some(cookie => cookie.toLowerCase().includes('samesite'))
  };

  return {
    hasHsts: !!headers['strict-transport-security'],
    hasCsp: !!headers['content-security-policy'],
    hasXFrameOptions: !!headers['x-frame-options'],
    hasXssProtection: !!headers['x-xss-protection'],
    hasContentTypeOptions: !!headers['x-content-type-options'],
    hasReferrerPolicy: !!headers['referrer-policy'],
    hasPermissionsPolicy: !!headers['permissions-policy'],
    cookiesSecurity,
    missingHeaders,
    vulnerabilities
  };
}

export function extractSocialMediaLinks(html: string) {
  const links: Record<string, string> = {};
  
  const platforms = {
    facebook: /https?:\/\/(www\.)?facebook\.com\/[a-zA-Z0-9._-]+/i,
    twitter: /https?:\/\/(www\.)?(twitter|x)\.com\/[a-zA-Z0-9._-]+/i,
    instagram: /https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9._-]+/i,
    linkedin: /https?:\/\/(www\.)?linkedin\.com\/(company|in)\/[a-zA-Z0-9._-]+/i,
    youtube: /https?:\/\/(www\.)?youtube\.com\/(channel|c|user)\/[a-zA-Z0-9._-]+/i,
    github: /https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9._-]+/i
  };

  Object.entries(platforms).forEach(([platform, regex]) => {
    const match = html.match(regex);
    if (match) links[platform] = match[0];
  });

  return links;
}

export function extractLinks(html: string, baseUrl: string): {
  internal: string[];
  external: string[];
} {
  const internal: Set<string> = new Set();
  const external: Set<string> = new Set();
  
  const linkRegex = /href=["']([^"']+)["']/gi;
  let match;
  
  const baseDomain = new URL(baseUrl).hostname;
  
  while ((match = linkRegex.exec(html)) !== null) {
    const url = match[1];
    
    try {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        const urlObj = new URL(url);
        if (urlObj.hostname === baseDomain) {
          internal.add(url);
        } else {
          external.add(url);
        }
      } else if (url.startsWith('/')) {
        internal.add(new URL(url, baseUrl).href);
      }
    } catch {
      // Invalid URL, skip
    }
  }
  
  return {
    internal: Array.from(internal).slice(0, 100),
    external: Array.from(external).slice(0, 50)
  };
}

export function extractJSFiles(html: string, baseUrl: string): string[] {
  const jsFiles: Set<string> = new Set();
  
  const scriptRegex = /<script[^>]*src=["']([^"']+)["']/gi;
  let match;
  
  while ((match = scriptRegex.exec(html)) !== null) {
    const src = match[1];
    
    try {
      if (src.startsWith('http://') || src.startsWith('https://')) {
        jsFiles.add(src);
      } else if (src.startsWith('/')) {
        jsFiles.add(new URL(src, baseUrl).href);
      } else {
        jsFiles.add(new URL(src, baseUrl).href);
      }
    } catch {
      // Invalid URL, skip
    }
  }
  
  return Array.from(jsFiles);
}

export function checkSecurityMisconfigurations(data: {
  headers: Record<string, string>;
  html: string;
  url: string;
}): string[] {
  const issues: string[] = [];
  
  if (data.html.includes('localhost:') || data.html.includes('127.0.0.1')) {
    issues.push('Development references found in production code');
  }
  
  if (data.html.includes('debug=true') || data.html.includes('DEBUG')) {
    issues.push('Debug mode may be enabled');
  }
  
  if (data.html.includes('.map') || data.headers['sourcemap']) {
    issues.push('Source maps exposed (reveals original source code)');
  }
  
  if (data.html.includes('stack trace') || data.html.includes('error at line')) {
    issues.push('Verbose error messages exposed');
  }
  
  if (data.html.includes('admin/admin') || data.html.includes('password')) {
    issues.push('Potential default credentials mentioned');
  }
  
  if (data.headers['access-control-allow-origin'] === '*') {
    issues.push('CORS allows all origins (potential security risk)');
  }
  
  if (data.url.startsWith('https://') && data.html.includes('http://')) {
    issues.push('Mixed content detected (HTTP resources on HTTPS page)');
  }
  
  return issues;
}

export function analyzeCookies(headers: Record<string, string>): {
  cookies: Array<{
    name: string;
    hasSecure: boolean;
    hasHttpOnly: boolean;
    hasSameSite: boolean;
    issues: string[];
  }>;
  overallIssues: string[];
} {
  const cookies: any[] = [];
  const overallIssues: string[] = [];
  
  const setCookieHeaders = Object.entries(headers)
    .filter(([key]) => key.toLowerCase() === 'set-cookie')
    .map(([, value]) => value);
  
  setCookieHeaders.forEach(cookieHeader => {
    const parts = cookieHeader.split(';').map(p => p.trim());
    const [nameValue] = parts;
    const [name] = nameValue.split('=');
    
    const cookie = {
      name,
      hasSecure: parts.some(p => p.toLowerCase() === 'secure'),
      hasHttpOnly: parts.some(p => p.toLowerCase() === 'httponly'),
      hasSameSite: parts.some(p => p.toLowerCase().startsWith('samesite')),
      issues: [] as string[]
    };
    
    if (!cookie.hasSecure) {
      cookie.issues.push('Missing Secure flag');
    }
    if (!cookie.hasHttpOnly) {
      cookie.issues.push('Missing HttpOnly flag (XSS risk)');
    }
    if (!cookie.hasSameSite) {
      cookie.issues.push('Missing SameSite flag (CSRF risk)');
    }
    
    cookies.push(cookie);
  });
  
  if (cookies.length === 0) {
    overallIssues.push('No cookies set');
  } else if (cookies.some(c => c.issues.length > 0)) {
    overallIssues.push('Some cookies have security issues');
  }
  
  return { cookies, overallIssues };
}

export function checkVulnerabilityIndicators(html: string, url: string): {
  category: string;
  indicator: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
}[] {
  const indicators: any[] = [];
  
  if (html.includes('mysql_') || html.includes('SQL syntax')) {
    indicators.push({
      category: 'SQL Injection',
      indicator: 'Database error messages visible',
      severity: 'high',
      description: 'Error messages may reveal database structure'
    });
  }
  
  if (!html.includes('Content-Security-Policy') && html.includes('<script>')) {
    indicators.push({
      category: 'XSS',
      indicator: 'No CSP with inline scripts',
      severity: 'medium',
      description: 'Missing Content Security Policy increases XSS risk'
    });
  }
  
  if (url.includes('../') || html.includes('file://')) {
    indicators.push({
      category: 'Path Traversal',
      indicator: 'Path traversal patterns detected',
      severity: 'high',
      description: 'Potential directory traversal vulnerability'
    });
  }
  
  if (html.includes('phpinfo()') || html.includes('<?php')) {
    indicators.push({
      category: 'Information Disclosure',
      indicator: 'PHP code visible in source',
      severity: 'high',
      description: 'PHP source code exposed'
    });
  }
  
  if (html.match(/wordpress\/[\d.]+/i)) {
    const version = html.match(/wordpress\/([\d.]+)/i)?.[1];
    if (version && parseFloat(version) < 6.0) {
      indicators.push({
        category: 'Outdated Software',
        indicator: `WordPress ${version} detected`,
        severity: 'medium',
        description: 'Outdated WordPress version may have known vulnerabilities'
      });
    }
  }
  
  return indicators;
}

export function calculateSecurityScore(data: {
  security: any;
  exposedData: any;
  endpoints: any;
  ssl: any;
}): {
  score: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  factors: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;
} {
  let score = 100;
  const factors: any[] = [];
  
  if (!data.security?.hasHsts) {
    score -= 10;
    factors.push({
      factor: 'Missing HSTS',
      impact: -10,
      description: 'No HTTP Strict Transport Security'
    });
  }
  if (!data.security?.hasCsp) {
    score -= 10;
    factors.push({
      factor: 'Missing CSP',
      impact: -10,
      description: 'No Content Security Policy'
    });
  }
  if (!data.security?.hasXFrameOptions) {
    score -= 10;
    factors.push({
      factor: 'Missing X-Frame-Options',
      impact: -10,
      description: 'Vulnerable to clickjacking'
    });
  }
  if ((data.security?.missingHeaders?.length || 0) > 3) {
    score -= 10;
    factors.push({
      factor: 'Multiple Missing Headers',
      impact: -10,
      description: `${data.security.missingHeaders.length} security headers missing`
    });
  }
  
  if (!data.ssl?.valid) {
    score -= 20;
    factors.push({
      factor: 'No SSL/TLS',
      impact: -20,
      description: 'Site not using HTTPS'
    });
  }
  
  if ((data.exposedData?.apiKeys?.length || 0) > 0) {
    score -= 15;
    factors.push({
      factor: 'API Keys Exposed',
      impact: -15,
      description: 'Critical: API keys found in source code'
    });
  }
  if ((data.exposedData?.emails?.length || 0) > 5) {
    score -= 5;
    factors.push({
      factor: 'Email Exposure',
      impact: -5,
      description: 'Multiple email addresses exposed'
    });
  }
  
  const sensitiveFiles = data.endpoints?.commonFiles?.filter((f: any) => 
    f.path.includes('.env') || f.path.includes('.git') || f.path.includes('backup')
  ) || [];
  
  if (sensitiveFiles.length > 0) {
    score -= 10;
    factors.push({
      factor: 'Sensitive Files Accessible',
      impact: -10,
      description: `${sensitiveFiles.length} sensitive file(s) publicly accessible`
    });
  }
  
  score = Math.max(0, Math.min(100, score));
  
  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  if (score >= 95) grade = 'A+';
  else if (score >= 85) grade = 'A';
  else if (score >= 75) grade = 'B';
  else if (score >= 65) grade = 'C';
  else if (score >= 50) grade = 'D';
  else grade = 'F';
  
  return { score, grade, factors };
}

export function generateRecommendations(findings: any): Array<{
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  resources?: string[];
}> {
  const recommendations: any[] = [];
  
  if (findings.exposedData?.apiKeys?.length > 0) {
    recommendations.push({
      priority: 'critical',
      title: 'Rotate Exposed API Keys Immediately',
      description: 'API keys were found in your source code. These should never be exposed client-side.',
      action: 'Rotate all exposed API keys immediately and move them to environment variables on the server.',
      resources: [
        'https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html'
      ]
    });
  }
  
  if (findings.endpoints?.commonFiles?.some((f: any) => f.path.includes('.env'))) {
    recommendations.push({
      priority: 'critical',
      title: 'Block Access to .env Files',
      description: '.env file is publicly accessible, exposing sensitive configuration.',
      action: 'Add server configuration to block access to .env files.',
      resources: [
        'https://stackoverflow.com/questions/38677727/how-to-hide-env-file-in-web-server'
      ]
    });
  }
  
  if (!findings.security?.hasHsts) {
    recommendations.push({
      priority: 'high',
      title: 'Implement HSTS',
      description: 'HTTP Strict Transport Security forces browsers to use HTTPS.',
      action: 'Add header: Strict-Transport-Security: max-age=31536000; includeSubDomains',
      resources: [
        'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security'
      ]
    });
  }
  
  if (!findings.security?.hasCsp) {
    recommendations.push({
      priority: 'high',
      title: 'Implement Content Security Policy',
      description: 'CSP helps prevent XSS attacks by controlling resource loading.',
      action: 'Add a Content-Security-Policy header appropriate for your site.',
      resources: [
        'https://content-security-policy.com/'
      ]
    });
  }
  
  if (findings.security?.vulnerabilities?.includes('Server header exposes server information')) {
    recommendations.push({
      priority: 'medium',
      title: 'Hide Server Version',
      description: 'Server header reveals technology stack to potential attackers.',
      action: 'Configure your web server to hide version information.',
      resources: []
    });
  }
  
  return recommendations.sort((a, b) => {
    const priorityOrder: Record<'critical' | 'high' | 'medium' | 'low', number> = { critical: 0, high: 1, medium: 2, low: 3 };
    const aPriority = a.priority as 'critical' | 'high' | 'medium' | 'low';
    const bPriority = b.priority as 'critical' | 'high' | 'medium' | 'low';
    return priorityOrder[aPriority] - priorityOrder[bPriority];
  });
}

export async function discoverSubdomains(domain: string): Promise<string[]> {
  const discovered: string[] = [];
  
  for (const subdomain of commonSubdomains.slice(0, 20)) {
    const fullDomain = `${subdomain}.${domain}`;
    
    try {
      const response = await fetch(`https://${fullDomain}`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(3000)
      });
      
      if (response.ok) {
        discovered.push(fullDomain);
      }
    } catch {
      // Subdomain doesn't exist or is not accessible
    }
  }
  
  return discovered;
}

