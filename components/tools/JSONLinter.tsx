'use client';

import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Code, RotateCcw, CheckCircle, XCircle, Copy, Download, AlertCircle, Upload, File, Plus, Minus, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface ValidationResult {
  isValid: boolean;
  error?: string;
  errorLine?: number;
  errorColumn?: number;
  formatted?: string;
  stats?: {
    keys: number;
    depth: number;
    size: number;
  };
}

interface JSONViewerProps {
  data: any;
  level?: number;
  collapsed?: Set<string>;
  onToggle?: (path: string) => void;
  path?: string;
}

function JSONViewer({ data, level = 0, collapsed = new Set(), onToggle, path = '' }: JSONViewerProps) {
  const indent = level * 20;
  const isCollapsed = collapsed.has(path);

  const handleToggle = () => {
    if (onToggle) {
      onToggle(path);
    }
  };

  const renderValue = (value: any): React.ReactElement => {
    if (value === null) {
      return <span className="text-purple-400">null</span>;
    }

    const valueType = typeof value;

    switch (valueType) {
      case 'boolean':
        return <span className="text-blue-400">{String(value)}</span>;
      case 'number':
        return <span className="text-yellow-400">{String(value)}</span>;
      case 'string':
        return <span className="text-green-300">"{value}"</span>;
      case 'object':
        if (Array.isArray(value)) {
          if (value.length === 0) {
            return <span className="text-green-500/50">[]</span>;
          }
          const arrayPath = path ? `${path}[]` : '[]';
          const isArrayCollapsed = collapsed.has(arrayPath);
          return (
            <span className="inline-flex items-center gap-1">
              <button
                onClick={() => onToggle?.(arrayPath)}
                className="flex items-center justify-center text-green-500 hover:text-green-400 transition-colors"
              >
                {isArrayCollapsed ? <Plus className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              </button>
              <span className="text-green-500/50">[</span>
              {!isArrayCollapsed && (
                <div className="ml-2 inline-block">
                  {value.map((item, index) => {
                    const itemPath = `${arrayPath}[${index}]`;
                    return (
                      <div key={index} className="flex items-start mb-1">
                        <span className="text-green-500/50 mr-2">{index}:</span>
                        <div className="flex-1">
                          {typeof item === 'object' && item !== null ? (
                            <JSONViewer
                              data={item}
                              level={level + 1}
                              collapsed={collapsed}
                              onToggle={onToggle}
                              path={itemPath}
                            />
                          ) : (
                            renderValue(item)
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {isArrayCollapsed && <span className="text-green-500/50">... {value.length} items</span>}
              <span className="text-green-500/50">]</span>
            </span>
          );
        } else {
          const keys = Object.keys(value);
          if (keys.length === 0) {
            return <span className="text-green-500/50">{'{}'}</span>;
          }
          return <span className="text-green-500/50">{'{...}'}</span>;
        }
      default:
        return <span className="text-green-500/50">{String(value)}</span>;
    }
  };

  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    const keys = Object.keys(data);
    const hasChildren = keys.length > 0;

    return (
      <div className="flex items-start" style={{ marginLeft: `${indent}px` }}>
        {hasChildren && (
          <button
            onClick={handleToggle}
            className="flex-shrink-0 w-4 h-4 mt-0.5 mr-1 flex items-center justify-center text-green-500 hover:text-green-400 transition-colors"
          >
            {isCollapsed ? (
              <Plus className="w-3 h-3" />
            ) : (
              <Minus className="w-3 h-3" />
            )}
          </button>
        )}
        {!hasChildren && <span className="w-4 mr-1" />}
        <div className="flex-1">
          {!isCollapsed && keys.map((key) => {
            const value = data[key];
            const isValueObject = typeof value === 'object' && value !== null;
            const valuePath = path ? `${path}.${key}` : key;
            const isValueCollapsed = collapsed.has(valuePath);

            return (
              <div key={key} className="mb-1 flex items-start">
                <span className="text-red-400 font-semibold font-mono flex-shrink-0">{key}</span>
                <span className="text-green-500/70 mx-2">:</span>
                {isValueObject ? (
                  <div className="flex-1">
                    {isValueCollapsed ? (
                      <button
                        onClick={() => onToggle?.(valuePath)}
                        className="flex items-center gap-1 text-green-500/70 hover:text-green-400 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>
                          {Array.isArray(value) ? `[${value.length} items]` : `{${Object.keys(value).length} keys}`}
                        </span>
                      </button>
                    ) : (
                      <div>
                        <JSONViewer
                          data={value}
                          level={level + 1}
                          collapsed={collapsed}
                          onToggle={onToggle}
                          path={valuePath}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1">{renderValue(value)}</div>
                )}
              </div>
            );
          })}
          {isCollapsed && (
            <span className="text-green-500/50">... {keys.length} keys</span>
          )}
        </div>
      </div>
    );
  }

  if (Array.isArray(data)) {
    return (
      <div style={{ marginLeft: `${indent}px` }}>
        {renderValue(data)}
      </div>
    );
  }

  return (
    <div style={{ marginLeft: `${indent}px` }}>
      {renderValue(data)}
    </div>
  );
}

export default function JSONLinter() {
  const [jsonInput, setJsonInput] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [indentSize, setIndentSize] = useState(2);
  const [autoValidate, setAutoValidate] = useState(true);
  const [errorLine, setErrorLine] = useState<number | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [collapsedPaths, setCollapsedPaths] = useState<Set<string>>(new Set());
  const [parsedData, setParsedData] = useState<any>(null);

  const resultRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const formattedRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (validationResult && resultRef.current) {
      gsap.fromTo(
        resultRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 }
      );
    }
  }, [validationResult]);

  useEffect(() => {
    if (autoValidate && jsonInput.trim()) {
      validateJSON();
    } else if (!jsonInput.trim()) {
      setValidationResult(null);
      setErrorLine(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jsonInput, autoValidate]);

  const calculateStats = (obj: any, depth = 0): { keys: number; depth: number; size: number } => {
    if (typeof obj !== 'object' || obj === null) {
      return { keys: 0, depth, size: JSON.stringify(obj).length };
    }

    if (Array.isArray(obj)) {
      let maxDepth = depth;
      let totalKeys = 0;
      let totalSize = 0;

      obj.forEach((item) => {
        const itemStats = calculateStats(item, depth + 1);
        maxDepth = Math.max(maxDepth, itemStats.depth);
        totalKeys += itemStats.keys;
        totalSize += itemStats.size;
      });

      return { keys: totalKeys, depth: maxDepth, size: totalSize };
    }

    let maxDepth = depth;
    let totalSize = 0;
    const keys = Object.keys(obj);

    keys.forEach((key) => {
      const valueStats = calculateStats(obj[key], depth + 1);
      maxDepth = Math.max(maxDepth, valueStats.depth);
      totalSize += valueStats.size + key.length;
    });

    return { keys: keys.length, depth: maxDepth, size: totalSize };
  };

  const validateJSON = () => {
    if (!jsonInput.trim()) {
      setValidationResult(null);
      setErrorLine(null);
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      const formatted = JSON.stringify(parsed, null, indentSize);
      const stats = calculateStats(parsed);

      setParsedData(parsed);
      setValidationResult({
        isValid: true,
        formatted,
        stats
      });
      setErrorLine(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      let errorLineNum: number | undefined;
      let errorCol: number | undefined;

      const match = errorMessage.match(/position (\d+)/);
      if (match) {
        const position = parseInt(match[1], 10);
        const lines = jsonInput.substring(0, position).split('\n');
        errorLineNum = lines.length;
        errorCol = lines[lines.length - 1].length + 1;
      }

      setParsedData(null);
      setValidationResult({
        isValid: false,
        error: errorMessage,
        errorLine: errorLineNum,
        errorColumn: errorCol
      });
      setErrorLine(errorLineNum || null);
    }
  };

  const formatJSON = () => {
    if (!jsonInput.trim()) return;

    try {
      const parsed = JSON.parse(jsonInput);
      const formatted = JSON.stringify(parsed, null, indentSize);
      setJsonInput(formatted);
      validateJSON();
    } catch {
      validateJSON();
    }
  };

  const minifyJSON = () => {
    if (!jsonInput.trim()) return;

    try {
      const parsed = JSON.parse(jsonInput);
      const minified = JSON.stringify(parsed);
      setJsonInput(minified);
      validateJSON();
    } catch {
      validateJSON();
    }
  };

  const handleClear = () => {
    setJsonInput('');
    setValidationResult(null);
    setErrorLine(null);
    setFileError(null);
    setFileName(null);
    setParsedData(null);
    setCollapsedPaths(new Set());
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleToggleCollapse = (path: string) => {
    setCollapsedPaths((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
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

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (fileExtension !== 'json' && !file.type.includes('json')) {
      setFileError('Please upload a valid JSON file (.json)');
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        setJsonInput(content);
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

  const handleCopy = () => {
    if (validationResult?.formatted) {
      navigator.clipboard.writeText(validationResult.formatted);
    } else if (jsonInput) {
      navigator.clipboard.writeText(jsonInput);
    }
  };

  const handleDownload = () => {
    const content = validationResult?.formatted || jsonInput;
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const scrollToError = () => {
    if (errorLine !== null && textareaRef.current) {
      const textarea = textareaRef.current;
      const lines = textarea.value.split('\n');
      
      if (errorLine < 0 || errorLine >= lines.length) return;

      let position = 0;
      for (let i = 0; i < errorLine - 1; i++) {
        position += lines[i].length + 1;
      }

      textarea.focus();
      textarea.setSelectionRange(position, position);
      
      const lineHeight = 20;
      const scrollTop = (errorLine - 1) * lineHeight - textarea.clientHeight / 2;
      textarea.scrollTop = Math.max(0, scrollTop);
      
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = textarea.scrollTop;
      }
    }
  };

  useEffect(() => {
    if (errorLine !== null) {
      scrollToError();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorLine]);

  const getLineNumbers = (text: string): string[] => {
    const lines = text.split('\n');
    return lines.map((_, i) => String(i + 1));
  };

  const renderTextareaWithLineNumbers = (
    value: string,
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void,
    placeholder: string,
    label: string,
    highlightedLine: number | null
  ) => {
    const lines = value.split('\n');
    const lineNumbers = getLineNumbers(value);
    const maxLineNumberLength = lineNumbers.length > 0 ? lineNumbers[lineNumbers.length - 1].length : 1;

    const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
      const target = e.target as HTMLTextAreaElement;
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = target.scrollTop;
      }
    };

    return (
      <div className="relative">
        <label className="block text-sm font-medium text-green-500/70 font-mono mb-2">
          {label}
        </label>
        <div className="flex border-2 border-green-500/50 rounded-lg overflow-hidden bg-black h-96">
          <div 
            ref={lineNumbersRef}
            className="flex-shrink-0 px-2 py-3 bg-black/50 border-r border-green-500/30 text-green-500/50 font-mono text-sm select-none overflow-y-hidden"
            style={{ width: `${Math.max(3, maxLineNumberLength + 1) * 0.6}rem` }}
          >
            {lineNumbers.map((num, i) => (
              <div
                key={i}
                className={`h-5 leading-5 text-right pr-2 ${
                  highlightedLine === i + 1
                    ? 'bg-red-500/30 text-red-400 font-bold'
                    : ''
                }`}
              >
                {num}
              </div>
            ))}
            {lines.length === 0 && (
              <div className="h-5 leading-5 text-right pr-2">
                1
              </div>
            )}
          </div>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={onChange}
            className="flex-1 px-4 py-3 bg-black text-green-500 font-mono focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-green-500/30 resize-none"
            placeholder={placeholder}
            style={{ lineHeight: '1.25rem' }}
            onScroll={handleScroll}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <Card variant="hacker" className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Code className="w-8 h-8 text-green-500" />
          <h2 className="text-3xl font-bold text-green-500 smooch-sans font-effect-anaglyph">
            JSON Linter
          </h2>
        </div>

        <div className="mb-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
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
              Open JSON File
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

        {renderTextareaWithLineNumbers(
          jsonInput,
          (e) => setJsonInput(e.target.value),
          'Paste your JSON here or upload a file...',
          'JSON Input',
          errorLine
        )}

        <div className="flex flex-wrap items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-green-500/70 font-mono">Indent:</label>
            <select
              value={indentSize}
              onChange={(e) => setIndentSize(Number(e.target.value))}
              className="px-3 py-1 bg-black border-2 border-green-500/50 text-green-500 font-mono rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value={2}>2 spaces</option>
              <option value={4}>4 spaces</option>
              <option value={8}>8 spaces</option>
              <option value={0}>No indent</option>
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoValidate}
              onChange={(e) => setAutoValidate(e.target.checked)}
              className="w-4 h-4 text-green-500 bg-black border-green-500 rounded focus:ring-green-500"
            />
            <span className="text-sm text-green-500/70 font-mono">Auto-validate</span>
          </label>
        </div>

        <div className="flex flex-wrap gap-3 mt-4">
          <Button onClick={validateJSON} variant="primary" size="md" className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Validate
          </Button>
          <Button onClick={formatJSON} variant="outline" size="md" className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Format
          </Button>
          <Button onClick={minifyJSON} variant="outline" size="md" className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Minify
          </Button>
          <Button onClick={handleCopy} variant="outline" size="md" className="flex items-center gap-2">
            <Copy className="w-5 h-5" />
            Copy
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

      {validationResult && (
        <div ref={resultRef}>
          <Card variant={validationResult.isValid ? 'hacker' : 'outlined'} className="p-6">
            <div className="flex items-center gap-3 mb-4">
              {validationResult.isValid ? (
                <>
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <h3 className="text-xl font-semibold text-green-500 font-mono">Valid JSON</h3>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-red-500" />
                  <h3 className="text-xl font-semibold text-red-500 font-mono">Invalid JSON</h3>
                </>
              )}
            </div>

            {validationResult.isValid ? (
              <>
                {validationResult.stats && (
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-black/50 rounded border border-green-500/30">
                      <div className="text-2xl font-bold text-green-500 font-mono">{validationResult.stats.keys}</div>
                      <div className="text-xs text-green-500/70 font-mono">Keys</div>
                    </div>
                    <div className="text-center p-3 bg-black/50 rounded border border-green-500/30">
                      <div className="text-2xl font-bold text-green-500 font-mono">{validationResult.stats.depth}</div>
                      <div className="text-xs text-green-500/70 font-mono">Max Depth</div>
                    </div>
                    <div className="text-center p-3 bg-black/50 rounded border border-green-500/30">
                      <div className="text-2xl font-bold text-green-500 font-mono">{validationResult.stats.size}</div>
                      <div className="text-xs text-green-500/70 font-mono">Size (chars)</div>
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-green-500/70 font-mono">
                      Formatted JSON Viewer
                    </label>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setCollapsedPaths(new Set());
                        }}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        Expand All
                      </Button>
                      <Button
                        onClick={() => {
                          const allPaths = new Set<string>();
                          const collectPaths = (obj: any, currentPath: string = '') => {
                            if (typeof obj === 'object' && obj !== null) {
                              if (Array.isArray(obj)) {
                                if (obj.length > 0) {
                                  const arrayPath = currentPath ? `${currentPath}[]` : '[]';
                                  allPaths.add(arrayPath);
                                  obj.forEach((item, index) => {
                                    const itemPath = `${arrayPath}[${index}]`;
                                    if (typeof item === 'object' && item !== null) {
                                      collectPaths(item, itemPath);
                                    }
                                  });
                                }
                              } else {
                                const keys = Object.keys(obj);
                                if (keys.length > 0) {
                                  keys.forEach((key) => {
                                    const newPath = currentPath ? `${currentPath}.${key}` : key;
                                    const value = obj[key];
                                    if (typeof value === 'object' && value !== null) {
                                      if (Array.isArray(value)) {
                                        allPaths.add(newPath);
                                        const arrayPath = `${newPath}[]`;
                                        allPaths.add(arrayPath);
                                        value.forEach((item, index) => {
                                          const itemPath = `${arrayPath}[${index}]`;
                                          if (typeof item === 'object' && item !== null) {
                                            collectPaths(item, itemPath);
                                          }
                                        });
                                      } else {
                                        allPaths.add(newPath);
                                        collectPaths(value, newPath);
                                      }
                                    }
                                  });
                                }
                              }
                            }
                          };
                          collectPaths(parsedData);
                          setCollapsedPaths(allPaths);
                        }}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        Collapse All
                      </Button>
                    </div>
                  </div>
                  <div className="w-full h-96 px-4 py-3 rounded-lg border-2 bg-black border-green-500/50 overflow-auto">
                    <div className="font-mono text-sm">
                      {parsedData && (
                        <JSONViewer
                          data={parsedData}
                          collapsed={collapsedPaths}
                          onToggle={handleToggleCollapse}
                        />
                      )}
                    </div>
                  </div>
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-green-500/70 font-mono mb-2">
                      Raw JSON (for copying)
                    </label>
                    <textarea
                      ref={formattedRef}
                      value={validationResult.formatted}
                      readOnly
                      className="w-full h-48 px-4 py-3 rounded-lg border-2 bg-black text-green-500 font-mono border-green-500/50"
                      style={{ lineHeight: '1.25rem' }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="p-4 bg-red-500/10 border-2 border-red-500 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-red-500 font-mono text-sm font-semibold mb-1">Error:</p>
                      <p className="text-red-400 font-mono text-sm">{validationResult.error}</p>
                      {validationResult.errorLine && (
                        <p className="text-red-400/70 font-mono text-xs mt-2">
                          Line {validationResult.errorLine}
                          {validationResult.errorColumn && `, Column ${validationResult.errorColumn}`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                {errorLine && (
                  <Button
                    onClick={scrollToError}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4" />
                    Go to Error Line
                  </Button>
                )}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

