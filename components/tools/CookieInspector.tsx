'use client';

import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Cookie, RotateCcw, Copy, Download, AlertCircle, Upload, File, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface ParsedCookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: string;
  maxAge?: number;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
  size: number;
}

export default function CookieInspector() {
  const [cookieInput, setCookieInput] = useState('');
  const [parsedCookies, setParsedCookies] = useState<ParsedCookie[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
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
    }
  }, [parsedCookies]);

  const parseCookieString = (cookieString: string): ParsedCookie | null => {
    if (!cookieString.trim()) return null;

    const parts = cookieString.split(';').map(p => p.trim());
    const [nameValue, ...attributes] = parts;

    if (!nameValue || !nameValue.includes('=')) {
      return null;
    }

    const [name, ...valueParts] = nameValue.split('=');
    const value = valueParts.join('=');

    const cookie: ParsedCookie = {
      name: name.trim(),
      value: value.trim(),
      size: cookieString.length
    };

    attributes.forEach(attr => {
      const [key, val] = attr.split('=').map(s => s.trim());
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
  };

  const parseCookies = () => {
    if (!cookieInput.trim()) {
      setParsedCookies([]);
      setError(null);
      return;
    }

    try {
      const lines = cookieInput.split('\n').filter(line => line.trim());
      const cookies: ParsedCookie[] = [];

      lines.forEach((line, index) => {
        const cookie = parseCookieString(line);
        if (cookie) {
          cookies.push(cookie);
        } else if (line.trim()) {
          setError(`Failed to parse cookie on line ${index + 1}`);
        }
      });

      setParsedCookies(cookies);
      if (cookies.length > 0) {
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse cookies');
      setParsedCookies([]);
    }
  };

  useEffect(() => {
    if (cookieInput.trim()) {
      parseCookies();
    } else {
      setParsedCookies([]);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cookieInput]);

  const handleClear = () => {
    setCookieInput('');
    setParsedCookies([]);
    setError(null);
    setFileError(null);
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileError(null);
    setFileName(null);

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setFileError(`File size exceeds 5MB limit. File size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
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
        setFileError('Failed to read file');
      }
    };

    reader.onerror = () => {
      setFileError('Error reading file');
    };

    reader.readAsText(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleCopy = (cookie?: ParsedCookie) => {
    if (cookie) {
      const cookieString = `${cookie.name}=${cookie.value}`;
      navigator.clipboard.writeText(cookieString);
    } else {
      navigator.clipboard.writeText(cookieInput);
    }
  };

  const handleDownload = () => {
    const content = cookieInput || parsedCookies.map(c => `${c.name}=${c.value}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cookies.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const removeCookie = (index: number) => {
    setParsedCookies(prev => prev.filter((_, i) => i !== index));
    const lines = cookieInput.split('\n');
    const newLines = lines.filter((_, i) => {
      const cookie = parseCookieString(lines[i]);
      return cookie?.name !== parsedCookies[index]?.name;
    });
    setCookieInput(newLines.join('\n'));
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <Card variant="hacker" className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Cookie className="w-8 h-8 text-green-500" />
          <h2 className="text-3xl font-bold text-green-500 smooch-sans font-effect-anaglyph">
            Cookie Inspector
          </h2>
        </div>

        <div className="mb-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.cookie"
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
              Open Cookie File
            </Button>
            {fileName && (
              <div className="flex items-center gap-2 text-sm text-green-500/70 font-mono">
                <File className="w-4 h-4" />
                <span>{fileName}</span>
              </div>
            )}
            <span className="text-xs text-green-500/50 font-mono">(Max 5MB)</span>
          </div>
          {fileError && (
            <div className="p-2 bg-red-500/10 border border-red-500 rounded text-red-400 text-sm font-mono">
              {fileError}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-green-500/70 font-mono mb-2">
            Cookie String(s) - One per line
          </label>
          <textarea
            ref={textareaRef}
            value={cookieInput}
            onChange={(e) => setCookieInput(e.target.value)}
            className="w-full h-48 px-4 py-3 rounded-lg border-2 bg-black text-green-500 font-mono border-green-500/50 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-green-500/30 resize-none"
            placeholder="Paste cookie strings here, one per line...&#10;Example: sessionId=abc123; Path=/; Domain=example.com; Secure; HttpOnly"
            style={{ lineHeight: '1.25rem' }}
          />
        </div>

        <div className="flex flex-wrap gap-3 mt-4">
          <Button onClick={parseCookies} variant="primary" size="md" className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Parse Cookies
          </Button>
          <Button onClick={() => handleCopy()} variant="outline" size="md" className="flex items-center gap-2">
            <Copy className="w-5 h-5" />
            Copy All
          </Button>
          <Button onClick={handleDownload} variant="outline" size="md" className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Download
          </Button>
          <Button onClick={handleClear} variant="outline" size="md" className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5" />
            Clear
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
                <Card key={index} variant="default" className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-red-400 font-semibold font-mono text-lg">{cookie.name}</span>
                        <span className="text-green-500/70">=</span>
                        <span className="text-green-300 font-mono break-all">{cookie.value}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleCopy(cookie)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        onClick={() => removeCookie(index)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 text-red-500 border-red-500/50 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-green-500/30">
                    <div>
                      <div className="text-xs text-green-500/50 font-mono mb-1">Domain</div>
                      <div className="text-sm text-green-400 font-mono">{cookie.domain || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-green-500/50 font-mono mb-1">Path</div>
                      <div className="text-sm text-green-400 font-mono">{cookie.path || '/'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-green-500/50 font-mono mb-1">Expires</div>
                      <div className="text-sm text-green-400 font-mono">{formatDate(cookie.expires)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-green-500/50 font-mono mb-1">Size</div>
                      <div className="text-sm text-green-400 font-mono">{cookie.size} bytes</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-green-500/30">
                    {cookie.secure && (
                      <span className="px-2 py-1 bg-green-500/10 border border-green-500 text-green-500 rounded text-xs font-mono">
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

