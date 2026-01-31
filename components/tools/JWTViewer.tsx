"use client";

import { useState, useRef, useEffect } from "react";
import { gsap } from "gsap";
import {
  Key,
  RotateCcw,
  Copy,
  Download,
  AlertCircle,
  Upload,
  File,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useTheme } from "@/components/ui/ThemeProvider";
import { hexToRgba } from "@/lib/color-utils";

interface JWTPayload {
  header: any;
  payload: any;
  signature: string;
  isValid: boolean;
  error?: string;
}

export default function JWTViewer() {
  const { theme } = useTheme();
  const [jwtInput, setJwtInput] = useState("");
  const [decodedJWT, setDecodedJWT] = useState<JWTPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (decodedJWT && resultRef.current) {
      gsap.fromTo(
        resultRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 },
      );
    }
  }, [decodedJWT]);

  const base64UrlDecode = (str: string): string => {
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/");

    while (base64.length % 4) {
      base64 += "=";
    }

    try {
      const decoded = atob(base64);
      return decodeURIComponent(
        Array.from(decoded)
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      );
    } catch (err) {
      throw new Error("Invalid base64url encoding");
    }
  };

  const formatJSON = (obj: any): string => {
    return JSON.stringify(obj, null, 2);
  };

  const decodeJWT = () => {
    if (!jwtInput.trim()) {
      setDecodedJWT(null);
      setError(null);
      return;
    }

    try {
      const token = jwtInput.trim();
      const parts = token.split(".");

      if (parts.length !== 3) {
        throw new Error(
          "Invalid JWT format. JWT should have 3 parts separated by dots.",
        );
      }

      const [headerEncoded, payloadEncoded, signature] = parts;

      let header: any;
      let payload: any;

      try {
        const headerDecoded = base64UrlDecode(headerEncoded);
        header = JSON.parse(headerDecoded);
      } catch (err) {
        throw new Error("Failed to decode JWT header");
      }

      try {
        const payloadDecoded = base64UrlDecode(payloadEncoded);
        payload = JSON.parse(payloadDecoded);
      } catch (err) {
        throw new Error("Failed to decode JWT payload");
      }

      setDecodedJWT({
        header,
        payload,
        signature,
        isValid: true,
      });
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to decode JWT";
      setError(errorMessage);
      setDecodedJWT(null);
    }
  };

  useEffect(() => {
    if (jwtInput.trim()) {
      decodeJWT();
    } else {
      setDecodedJWT(null);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jwtInput]);

  const handleClear = () => {
    setJwtInput("");
    setDecodedJWT(null);
    setError(null);
    setFileError(null);
    setFileName(null);
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
        `File size exceeds 5MB limit. File size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
      );
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        setJwtInput(content.trim());
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

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleDownload = () => {
    if (!decodedJWT) return;

    const content = JSON.stringify(
      {
        header: decodedJWT.header,
        payload: decodedJWT.payload,
        signature: decodedJWT.signature,
      },
      null,
      2,
    );

    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "jwt-decoded.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (timestamp: number): string => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const isExpired = (exp?: number): boolean => {
    if (!exp) return false;
    return Date.now() / 1000 > exp;
  };

  const getTimeUntilExpiry = (exp?: number): string => {
    if (!exp) return "N/A";
    const now = Date.now() / 1000;
    const diff = exp - now;
    if (diff < 0) return "Expired";

    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = Math.floor(diff % 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <Card variant="hacker" className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Key className="w-8 h-8" style={{ color: theme.colors.primary }} />
          <h2
            className="text-3xl font-bold font-semibold"
            style={{ color: theme.colors.primary }}
          >
            JWT Viewer
          </h2>
        </div>

        <div className="mb-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.jwt,.token"
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
              Open JWT File
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
              (Max 5MB)
            </span>
          </div>
          {fileError && (
            <div
              className="p-2 border rounded text-sm font-mono"
              style={{
                backgroundColor: hexToRgba(theme.colors.accent, 0.1),
                borderColor: theme.colors.accent,
                color: theme.colors.accent,
              }}
            >
              {fileError}
            </div>
          )}
        </div>

        <div>
          <label
            className="block text-sm font-medium font-mono mb-2"
            style={{ color: theme.colors.foreground, opacity: 0.7 }}
          >
            JWT Token
          </label>
          <textarea
            ref={textareaRef}
            value={jwtInput}
            onChange={(e) => setJwtInput(e.target.value)}
            className="w-full h-32 px-4 py-3 rounded-lg border-2 font-mono focus:outline-none focus:ring-2 resize-none"
            placeholder="Paste your JWT token here...&#10;Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
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
              e.currentTarget.style.borderColor = hexToRgba(
                theme.colors.primary,
                0.5,
              );
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>

        <div className="flex flex-wrap gap-3 mt-4">
          <Button
            onClick={decodeJWT}
            variant="primary"
            size="md"
            className="flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Decode JWT
          </Button>
          <Button
            onClick={() => handleCopy(jwtInput)}
            variant="outline"
            size="md"
            className="flex items-center gap-2"
          >
            <Copy className="w-5 h-5" />
            Copy Token
          </Button>
          <Button
            onClick={handleDownload}
            variant="outline"
            size="md"
            className="flex items-center gap-2"
            disabled={!decodedJWT}
          >
            <Download className="w-5 h-5" />
            Download
          </Button>
          <Button
            onClick={handleClear}
            variant="outline"
            size="md"
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Clear
          </Button>
        </div>
      </Card>

      {error && (
        <Card
          variant="outlined"
          className="p-6"
          style={{ borderColor: hexToRgba(theme.colors.accent, 0.5) }}
        >
          <div className="flex items-start gap-2">
            <XCircle
              className="w-5 h-5 flex-shrink-0 mt-0.5"
              style={{ color: theme.colors.accent }}
            />
            <div className="flex-1">
              <p
                className="font-mono text-sm font-semibold mb-1"
                style={{ color: theme.colors.accent }}
              >
                Invalid JWT Token:
              </p>
              <p
                className="font-mono text-sm"
                style={{ color: theme.colors.accent, opacity: 0.8 }}
              >
                {error}
              </p>
              <div
                className="mt-3 p-3 border rounded-lg"
                style={{
                  backgroundColor: hexToRgba(theme.colors.accent, 0.1),
                  borderColor: hexToRgba(theme.colors.accent, 0.3),
                }}
              >
                <p
                  className="font-mono text-xs font-semibold mb-2"
                  style={{ color: theme.colors.accent, opacity: 0.9 }}
                >
                  Common JWT Format Issues:
                </p>
                <ul
                  className="font-mono text-xs space-y-1 ml-4 list-disc"
                  style={{ color: theme.colors.accent, opacity: 0.7 }}
                >
                  <li>
                    JWT must have exactly 3 parts separated by dots
                    (header.payload.signature)
                  </li>
                  <li>Each part must be valid base64url encoded</li>
                  <li>Header and payload must be valid JSON</li>
                  <li>Check for extra spaces or line breaks in the token</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      )}

      {decodedJWT && decodedJWT.isValid && (
        <div ref={resultRef}>
          <Card variant="hacker" className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <CheckCircle
                  className="w-6 h-6"
                  style={{ color: theme.colors.primary }}
                />
                <h3
                  className="text-xl font-semibold font-mono"
                  style={{ color: theme.colors.primary }}
                >
                  Decoded JWT
                </h3>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    className="block text-sm font-medium font-mono"
                    style={{ color: theme.colors.foreground, opacity: 0.7 }}
                  >
                    Header
                  </label>
                  <Button
                    onClick={() => handleCopy(formatJSON(decodedJWT.header))}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    Copy
                  </Button>
                </div>
                <div
                  className="w-full px-4 py-3 rounded-lg border-2 overflow-auto"
                  style={{
                    backgroundColor: theme.colors.background,
                    borderColor: hexToRgba(theme.colors.primary, 0.5),
                  }}
                >
                  <pre
                    className="font-mono text-sm whitespace-pre-wrap"
                    style={{ color: theme.colors.accent }}
                  >
                    {formatJSON(decodedJWT.header)}
                  </pre>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    className="block text-sm font-medium font-mono"
                    style={{ color: theme.colors.foreground, opacity: 0.7 }}
                  >
                    Payload
                  </label>
                  <Button
                    onClick={() => handleCopy(formatJSON(decodedJWT.payload))}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    Copy
                  </Button>
                </div>
                <div
                  className="w-full px-4 py-3 rounded-lg border-2 overflow-auto"
                  style={{
                    backgroundColor: theme.colors.background,
                    borderColor: hexToRgba(theme.colors.primary, 0.5),
                  }}
                >
                  <pre
                    className="font-mono text-sm whitespace-pre-wrap"
                    style={{ color: theme.colors.accent }}
                  >
                    {formatJSON(decodedJWT.payload)}
                  </pre>
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium font-mono mb-2"
                  style={{ color: theme.colors.foreground, opacity: 0.7 }}
                >
                  Signature
                </label>
                <div
                  className="w-full px-4 py-3 rounded-lg border-2 overflow-auto"
                  style={{
                    backgroundColor: theme.colors.background,
                    borderColor: hexToRgba(theme.colors.primary, 0.5),
                  }}
                >
                  <pre
                    className="font-mono text-sm break-all"
                    style={{ color: theme.colors.accent }}
                  >
                    {decodedJWT.signature}
                  </pre>
                </div>
              </div>

              {decodedJWT.payload && (
                <div>
                  <label
                    className="block text-sm font-medium font-mono mb-2"
                    style={{ color: theme.colors.foreground, opacity: 0.7 }}
                  >
                    Token Information
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {decodedJWT.payload.iat && (
                      <div
                        className="p-3 rounded border"
                        style={{
                          backgroundColor: hexToRgba(
                            theme.colors.background,
                            0.5,
                          ),
                          borderColor: hexToRgba(theme.colors.primary, 0.3),
                        }}
                      >
                        <div
                          className="text-xs font-mono mb-1"
                          style={{
                            color: theme.colors.foreground,
                            opacity: 0.5,
                          }}
                        >
                          Issued At
                        </div>
                        <div
                          className="text-sm font-mono"
                          style={{ color: theme.colors.accent }}
                        >
                          {formatTimestamp(decodedJWT.payload.iat)}
                        </div>
                      </div>
                    )}
                    {decodedJWT.payload.exp && (
                      <div
                        className="p-3 rounded border"
                        style={{
                          backgroundColor: hexToRgba(
                            theme.colors.background,
                            0.5,
                          ),
                          borderColor: isExpired(decodedJWT.payload.exp)
                            ? hexToRgba(theme.colors.accent, 0.5)
                            : hexToRgba(theme.colors.primary, 0.3),
                        }}
                      >
                        <div
                          className="text-xs font-mono mb-1"
                          style={{
                            color: theme.colors.foreground,
                            opacity: 0.5,
                          }}
                        >
                          Expires At
                        </div>
                        <div
                          className="text-sm font-mono"
                          style={{
                            color: isExpired(decodedJWT.payload.exp)
                              ? theme.colors.accent
                              : theme.colors.accent,
                          }}
                        >
                          {formatTimestamp(decodedJWT.payload.exp)}
                          {isExpired(decodedJWT.payload.exp) && (
                            <span
                              className="ml-2"
                              style={{ color: theme.colors.accent }}
                            >
                              (Expired)
                            </span>
                          )}
                        </div>
                        {!isExpired(decodedJWT.payload.exp) && (
                          <div
                            className="text-xs font-mono mt-1"
                            style={{
                              color: theme.colors.foreground,
                              opacity: 0.7,
                            }}
                          >
                            Expires in:{" "}
                            {getTimeUntilExpiry(decodedJWT.payload.exp)}
                          </div>
                        )}
                      </div>
                    )}
                    {decodedJWT.payload.nbf && (
                      <div
                        className="p-3 rounded border"
                        style={{
                          backgroundColor: hexToRgba(
                            theme.colors.background,
                            0.5,
                          ),
                          borderColor: hexToRgba(theme.colors.primary, 0.3),
                        }}
                      >
                        <div
                          className="text-xs font-mono mb-1"
                          style={{
                            color: theme.colors.foreground,
                            opacity: 0.5,
                          }}
                        >
                          Not Before
                        </div>
                        <div
                          className="text-sm font-mono"
                          style={{ color: theme.colors.accent }}
                        >
                          {formatTimestamp(decodedJWT.payload.nbf)}
                        </div>
                      </div>
                    )}
                    {decodedJWT.payload.sub && (
                      <div
                        className="p-3 rounded border"
                        style={{
                          backgroundColor: hexToRgba(
                            theme.colors.background,
                            0.5,
                          ),
                          borderColor: hexToRgba(theme.colors.primary, 0.3),
                        }}
                      >
                        <div
                          className="text-xs font-mono mb-1"
                          style={{
                            color: theme.colors.foreground,
                            opacity: 0.5,
                          }}
                        >
                          Subject
                        </div>
                        <div
                          className="text-sm font-mono break-all"
                          style={{ color: theme.colors.accent }}
                        >
                          {decodedJWT.payload.sub}
                        </div>
                      </div>
                    )}
                    {decodedJWT.payload.iss && (
                      <div
                        className="p-3 rounded border"
                        style={{
                          backgroundColor: hexToRgba(
                            theme.colors.background,
                            0.5,
                          ),
                          borderColor: hexToRgba(theme.colors.primary, 0.3),
                        }}
                      >
                        <div
                          className="text-xs font-mono mb-1"
                          style={{
                            color: theme.colors.foreground,
                            opacity: 0.5,
                          }}
                        >
                          Issuer
                        </div>
                        <div
                          className="text-sm font-mono break-all"
                          style={{ color: theme.colors.accent }}
                        >
                          {decodedJWT.payload.iss}
                        </div>
                      </div>
                    )}
                    {decodedJWT.payload.aud && (
                      <div
                        className="p-3 rounded border"
                        style={{
                          backgroundColor: hexToRgba(
                            theme.colors.background,
                            0.5,
                          ),
                          borderColor: hexToRgba(theme.colors.primary, 0.3),
                        }}
                      >
                        <div
                          className="text-xs font-mono mb-1"
                          style={{
                            color: theme.colors.foreground,
                            opacity: 0.5,
                          }}
                        >
                          Audience
                        </div>
                        <div
                          className="text-sm font-mono break-all"
                          style={{ color: theme.colors.accent }}
                        >
                          {Array.isArray(decodedJWT.payload.aud)
                            ? decodedJWT.payload.aud.join(", ")
                            : decodedJWT.payload.aud}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
