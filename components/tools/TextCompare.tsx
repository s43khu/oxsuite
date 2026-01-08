'use client';

import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { FileText, RotateCcw, ArrowLeftRight, CheckCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface DiffResult {
  original: string;
  modified: string;
  differences: Array<{
    type: 'equal' | 'insert' | 'delete' | 'replace';
    value: string;
    originalIndex?: number;
    modifiedIndex?: number;
  }>;
}

export default function TextCompare() {
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [selectedDiffIndex, setSelectedDiffIndex] = useState<number | null>(null);
  const [highlightedLine1, setHighlightedLine1] = useState<number | null>(null);
  const [highlightedLine2, setHighlightedLine2] = useState<number | null>(null);
  const [options, setOptions] = useState({
    toLowerCase: false,
    sortLines: false,
    replaceLineBreaks: false,
    removeExcessWhitespace: false
  });

  const resultRef = useRef<HTMLDivElement>(null);
  const textarea1Ref = useRef<HTMLTextAreaElement>(null);
  const textarea2Ref = useRef<HTMLTextAreaElement>(null);
  const lineNumbers1Ref = useRef<HTMLDivElement>(null);
  const lineNumbers2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (diffResult && resultRef.current) {
      gsap.fromTo(
        resultRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 }
      );
    }
  }, [diffResult]);

  const preprocessText = (text: string): string => {
    let processed = text;

    if (options.toLowerCase) {
      processed = processed.toLowerCase();
    }

    if (options.replaceLineBreaks) {
      processed = processed.replace(/\n/g, ' ');
    }

    if (options.removeExcessWhitespace) {
      processed = processed.replace(/\s+/g, ' ').trim();
    }

    if (options.sortLines) {
      const lines = processed.split('\n');
      processed = lines.sort().join('\n');
    }

    return processed;
  };

  const computeDiff = (text1: string, text2: string): DiffResult => {
    const processed1 = preprocessText(text1);
    const processed2 = preprocessText(text2);

    if (processed1 === processed2) {
      return {
        original: processed1,
        modified: processed2,
        differences: processed1.split('\n').map((line, i) => ({
          type: 'equal' as const,
          value: line,
          originalIndex: i,
          modifiedIndex: i
        }))
      };
    }

    const lines1 = processed1.split('\n');
    const lines2 = processed2.split('\n');
    const differences: DiffResult['differences'] = [];

    const lcs = computeLCS(lines1, lines2);
    let i = 0;
    let j = 0;
    let lcsIndex = 0;

    while (i < lines1.length || j < lines2.length) {
      if (lcsIndex < lcs.length && i < lines1.length && j < lines2.length && lines1[i] === lcs[lcsIndex] && lines2[j] === lcs[lcsIndex]) {
        differences.push({
          type: 'equal',
          value: lines1[i],
          originalIndex: i,
          modifiedIndex: j
        });
        i++;
        j++;
        lcsIndex++;
      } else if (lcsIndex < lcs.length && j < lines2.length && lines2[j] === lcs[lcsIndex]) {
        differences.push({
          type: 'delete',
          value: lines1[i],
          originalIndex: i
        });
        i++;
      } else if (lcsIndex < lcs.length && i < lines1.length && lines1[i] === lcs[lcsIndex]) {
        differences.push({
          type: 'insert',
          value: lines2[j],
          modifiedIndex: j
        });
        j++;
      } else if (i < lines1.length && j < lines2.length) {
        if (lines1[i].trim() === '' && lines2[j].trim() !== '') {
          differences.push({
            type: 'insert',
            value: lines2[j],
            modifiedIndex: j
          });
          j++;
        } else if (lines1[i].trim() !== '' && lines2[j].trim() === '') {
          differences.push({
            type: 'delete',
            value: lines1[i],
            originalIndex: i
          });
          i++;
        } else {
          differences.push({
            type: 'replace',
            value: lines1[i],
            originalIndex: i
          });
          differences.push({
            type: 'insert',
            value: lines2[j],
            modifiedIndex: j
          });
          i++;
          j++;
        }
      } else if (i < lines1.length) {
        differences.push({
          type: 'delete',
          value: lines1[i],
          originalIndex: i
        });
        i++;
      } else if (j < lines2.length) {
        differences.push({
          type: 'insert',
          value: lines2[j],
          modifiedIndex: j
        });
        j++;
      }
    }

    return {
      original: processed1,
      modified: processed2,
      differences
    };
  };

  const computeLCS = (arr1: string[], arr2: string[]): string[] => {
    const m = arr1.length;
    const n = arr2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (arr1[i - 1] === arr2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    const lcs: string[] = [];
    let i = m;
    let j = n;

    while (i > 0 && j > 0) {
      if (arr1[i - 1] === arr2[j - 1]) {
        lcs.unshift(arr1[i - 1]);
        i--;
        j--;
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }

    return lcs;
  };

  const handleCompare = () => {
    if (!text1 && !text2) {
      return;
    }

    const result = computeDiff(text1, text2);
    setDiffResult(result);
  };

  const handleSwitch = () => {
    const temp = text1;
    setText1(text2);
    setText2(temp);
    setDiffResult(null);
  };

  const handleClear = () => {
    setText1('');
    setText2('');
    setDiffResult(null);
    setSelectedDiffIndex(null);
    setHighlightedLine1(null);
    setHighlightedLine2(null);
  };

  const scrollToLine = (
    textareaRef: React.RefObject<HTMLTextAreaElement | null>,
    lineNumbersRef: React.RefObject<HTMLDivElement | null>,
    lineNumber: number
  ) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const lines = textarea.value.split('\n');
    
    if (lineNumber < 0 || lineNumber >= lines.length) return;

    let position = 0;
    for (let i = 0; i < lineNumber; i++) {
      position += lines[i].length + 1;
    }

    textarea.focus();
    textarea.setSelectionRange(position, position);
    
    const lineHeight = 20;
    const scrollTop = lineNumber * lineHeight - textarea.clientHeight / 2;
    textarea.scrollTop = Math.max(0, scrollTop);
    
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textarea.scrollTop;
    }
  };

  const handleDiffClick = (diff: DiffResult['differences'][0], index: number) => {
    setSelectedDiffIndex(index);
    
    if (diff.originalIndex !== undefined) {
      setHighlightedLine1(diff.originalIndex);
      scrollToLine(textarea1Ref, lineNumbers1Ref, diff.originalIndex);
    } else {
      setHighlightedLine1(null);
    }

    if (diff.modifiedIndex !== undefined) {
      setHighlightedLine2(diff.modifiedIndex);
      scrollToLine(textarea2Ref, lineNumbers2Ref, diff.modifiedIndex);
    } else {
      setHighlightedLine2(null);
    }
  };

  const renderDiffLine = (diff: DiffResult['differences'][0], index: number) => {
    const isSelected = selectedDiffIndex === index;
    const baseClass = 'px-3 py-1 font-mono text-sm cursor-pointer transition-all duration-200';
    const selectedClass = isSelected ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-black' : '';
    
    switch (diff.type) {
      case 'equal':
        return (
          <div 
            key={index} 
            onClick={() => handleDiffClick(diff, index)}
            className={`${baseClass} ${selectedClass} text-green-500/70 bg-black hover:bg-green-500/5`}
          >
            {diff.value || '\u00A0'}
          </div>
        );
      case 'delete':
        return (
          <div 
            key={index} 
            onClick={() => handleDiffClick(diff, index)}
            className={`${baseClass} ${selectedClass} text-red-500 bg-red-500/10 border-l-2 border-red-500 hover:bg-red-500/20`}
          >
            <span className="line-through">- {diff.value || '\u00A0'}</span>
          </div>
        );
      case 'insert':
        return (
          <div 
            key={index} 
            onClick={() => handleDiffClick(diff, index)}
            className={`${baseClass} ${selectedClass} text-green-400 bg-green-500/10 border-l-2 border-green-500 hover:bg-green-500/20`}
          >
            + {diff.value || '\u00A0'}
          </div>
        );
      case 'replace':
        return (
          <div 
            key={index} 
            onClick={() => handleDiffClick(diff, index)}
            className={`${baseClass} ${selectedClass} text-yellow-500 bg-yellow-500/10 border-l-2 border-yellow-500 hover:bg-yellow-500/20`}
          >
            ~ {diff.value || '\u00A0'}
          </div>
        );
      default:
        return null;
    }
  };

  const getLineNumbers = (text: string): string[] => {
    const lines = text.split('\n');
    return lines.map((_, i) => String(i + 1));
  };

  const renderTextareaWithLineNumbers = (
    value: string,
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void,
    placeholder: string,
    label: string,
    textareaRef: React.RefObject<HTMLTextAreaElement | null>,
    lineNumbersRef: React.RefObject<HTMLDivElement | null>,
    highlightedLine: number | null,
    isTextarea1: boolean
  ) => {
    const lines = value.split('\n');
    const lineNumbers = getLineNumbers(value);
    const maxLineNumberLength = lineNumbers.length > 0 ? lineNumbers[lineNumbers.length - 1].length : 1;

    const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
      const target = e.target as HTMLTextAreaElement;
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = target.scrollTop;
      }
      
      const lineHeight = 20;
      const scrollTop = target.scrollTop;
      const currentLine = Math.floor(scrollTop / lineHeight);
      if (highlightedLine !== null && Math.abs(currentLine - highlightedLine) > 5) {
        if (isTextarea1) setHighlightedLine1(null);
        else setHighlightedLine2(null);
      }
    };

    return (
      <div className="relative">
        <label className="block text-sm font-medium text-green-500/70 font-mono mb-2">
          {label}
        </label>
        <div className="flex border-2 border-green-500/50 rounded-lg overflow-hidden bg-black h-64">
          <div 
            ref={lineNumbersRef}
            className="flex-shrink-0 px-2 py-3 bg-black/50 border-r border-green-500/30 text-green-500/50 font-mono text-sm select-none overflow-y-hidden"
            style={{ width: `${Math.max(3, maxLineNumberLength + 1) * 0.6}rem` }}
          >
            {lineNumbers.map((num, i) => (
              <div
                key={i}
                className={`h-5 leading-5 text-right pr-2 ${
                  highlightedLine === i
                    ? 'bg-green-500/30 text-green-400 font-bold'
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

  const stats = diffResult ? {
    total: diffResult.differences.length,
    equal: diffResult.differences.filter(d => d.type === 'equal').length,
    inserted: diffResult.differences.filter(d => d.type === 'insert').length,
    deleted: diffResult.differences.filter(d => d.type === 'delete').length,
    replaced: diffResult.differences.filter(d => d.type === 'replace').length
  } : null;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <Card variant="hacker" className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-8 h-8 text-green-500" />
          <h2 className="text-3xl font-bold text-green-500 smooch-sans font-effect-anaglyph">
            Text Compare
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {renderTextareaWithLineNumbers(
            text1,
            (e) => setText1(e.target.value),
            'Paste your first text here...',
            'Text 1',
            textarea1Ref,
            lineNumbers1Ref,
            highlightedLine1,
            true
          )}
          {renderTextareaWithLineNumbers(
            text2,
            (e) => setText2(e.target.value),
            'Paste your second text here...',
            'Text 2',
            textarea2Ref,
            lineNumbers2Ref,
            highlightedLine2,
            false
          )}
        </div>

        <Card variant="outlined" className="p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Settings className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold text-green-500 font-mono">Compare Options</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.toLowerCase}
                onChange={(e) => setOptions({ ...options, toLowerCase: e.target.checked })}
                className="w-4 h-4 text-green-500 bg-black border-green-500 rounded focus:ring-green-500"
              />
              <span className="text-sm text-green-500/70 font-mono">To lowercase</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.sortLines}
                onChange={(e) => setOptions({ ...options, sortLines: e.target.checked })}
                className="w-4 h-4 text-green-500 bg-black border-green-500 rounded focus:ring-green-500"
              />
              <span className="text-sm text-green-500/70 font-mono">Sort lines</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.replaceLineBreaks}
                onChange={(e) => setOptions({ ...options, replaceLineBreaks: e.target.checked })}
                className="w-4 h-4 text-green-500 bg-black border-green-500 rounded focus:ring-green-500"
              />
              <span className="text-sm text-green-500/70 font-mono">Replace line breaks</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.removeExcessWhitespace}
                onChange={(e) => setOptions({ ...options, removeExcessWhitespace: e.target.checked })}
                className="w-4 h-4 text-green-500 bg-black border-green-500 rounded focus:ring-green-500"
              />
              <span className="text-sm text-green-500/70 font-mono">Remove excess whitespace</span>
            </label>
          </div>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button onClick={handleCompare} variant="primary" size="md" className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Compare!
          </Button>
          <Button onClick={handleSwitch} variant="outline" size="md" className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5" />
            Switch texts
          </Button>
          <Button onClick={handleClear} variant="outline" size="md" className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5" />
            Clear all
          </Button>
        </div>
      </Card>

      {diffResult && (
        <div ref={resultRef}>
          {stats && (
            <Card variant="hacker" className="p-4 mb-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500 font-mono">{stats.total}</div>
                  <div className="text-xs text-green-500/70 font-mono">Total Lines</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500/70 font-mono">{stats.equal}</div>
                  <div className="text-xs text-green-500/70 font-mono">Equal</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400 font-mono">{stats.inserted}</div>
                  <div className="text-xs text-green-500/70 font-mono">Inserted</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500 font-mono">{stats.deleted}</div>
                  <div className="text-xs text-green-500/70 font-mono">Deleted</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-500 font-mono">{stats.replaced}</div>
                  <div className="text-xs text-green-500/70 font-mono">Replaced</div>
                </div>
              </div>
            </Card>
          )}

          <Card variant="hacker" className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-green-500 font-mono">Differences</h3>
              {selectedDiffIndex !== null && (
                <div className="text-sm text-green-500/70 font-mono">
                  Click any line to navigate • Line {selectedDiffIndex + 1} selected
                </div>
              )}
            </div>
            <div className="max-h-[600px] overflow-y-auto border-2 border-green-500/30 rounded-lg">
              {diffResult.differences.map((diff, index) => renderDiffLine(diff, index))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

