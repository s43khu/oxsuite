import { NextRequest, NextResponse } from 'next/server';

interface Cookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
  maxAge?: number;
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    let targetUrl: URL;
    try {
      targetUrl = new URL(url);
    } catch {
      try {
        targetUrl = new URL(`https://${url}`);
      } catch {
        return NextResponse.json(
          { error: 'Invalid URL format' },
          { status: 400 }
        );
      }
    }

    if (!['http:', 'https:'].includes(targetUrl.protocol)) {
      return NextResponse.json(
        { error: 'Only HTTP and HTTPS URLs are supported' },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(targetUrl.toString(), {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        redirect: 'follow',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const setCookieHeaders = response.headers.getSetCookie();
      
      if (!setCookieHeaders || setCookieHeaders.length === 0) {
        return NextResponse.json({
          cookies: [],
          message: 'No cookies found in response',
          url: targetUrl.toString(),
          status: response.status,
          timestamp: new Date().toISOString()
        });
      }

      const cookies: Cookie[] = setCookieHeaders.map(cookieStr => {
        const parts = cookieStr.split(';').map(p => p.trim());
        const [nameValue, ...attributes] = parts;
        
        if (!nameValue || !nameValue.includes('=')) {
          return null;
        }

        const [name, ...valueParts] = nameValue.split('=');
        const value = valueParts.join('=');

        const cookie: Cookie = {
          name: name.trim(),
          value: value.trim(),
        };

        attributes.forEach(attr => {
          if (!attr) return;
          
          const equalIndex = attr.indexOf('=');
          if (equalIndex === -1) {
            const lowerKey = attr.toLowerCase();
            if (lowerKey === 'secure') {
              cookie.secure = true;
            } else if (lowerKey === 'httponly') {
              cookie.httpOnly = true;
            }
            return;
          }

          const key = attr.substring(0, equalIndex).trim();
          const val = attr.substring(equalIndex + 1).trim();
          const lowerKey = key.toLowerCase();

          switch (lowerKey) {
            case 'domain':
              cookie.domain = val;
              break;
            case 'path':
              cookie.path = val;
              break;
            case 'expires':
              cookie.expires = val;
              break;
            case 'max-age':
              cookie.maxAge = parseInt(val, 10);
              break;
            case 'secure':
              cookie.secure = true;
              break;
            case 'httponly':
              cookie.httpOnly = true;
              break;
            case 'samesite':
              cookie.sameSite = val as 'Strict' | 'Lax' | 'None';
              break;
          }
        });

        return cookie;
      }).filter((cookie): cookie is Cookie => cookie !== null);

      return NextResponse.json({
        cookies,
        count: cookies.length,
        url: targetUrl.toString(),
        status: response.status,
        timestamp: new Date().toISOString()
      });

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timeout - URL took too long to respond' },
          { status: 408 }
        );
      }

      if (fetchError.message?.includes('fetch failed')) {
        return NextResponse.json(
          { error: 'Failed to connect to URL. It may be unreachable or blocked.' },
          { status: 503 }
        );
      }

      throw fetchError;
    }

  } catch (error) {
    console.error('Cookie extraction error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to extract cookies',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const cookieStore = req.cookies.getAll();

  const parsedCookies: Record<string, any> = {};

  for (const cookie of cookieStore) {
    const { name, value } = cookie;

    try {
      parsedCookies[name] = JSON.parse(decodeURIComponent(value));
    } catch {
      parsedCookies[name] = value;
    }
  }

  return NextResponse.json({
    domain: req.headers.get('host'),
    totalCookies: cookieStore.length,
    cookies: parsedCookies,
    cookieDetails: cookieStore.map(cookie => ({
      name: cookie.name,
      value: cookie.value,
      parsedValue: parsedCookies[cookie.name]
    })),
    timestamp: new Date().toISOString()
  });
}

