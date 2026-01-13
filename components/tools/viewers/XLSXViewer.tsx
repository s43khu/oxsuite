"use client";

import { useState, useRef, useEffect } from "react";
import { gsap } from "gsap";
import * as XLSX from "xlsx";
import { FileSpreadsheet, Download, Sheet, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useTheme } from "@/components/ui/ThemeProvider";
import { hexToRgba } from "@/lib/color-utils";

interface SheetData {
  name: string;
  data: unknown[][];
}

interface XLSXViewerProps {
  file: File;
  onClear: () => void;
}

export default function XLSXViewer({ file, onClear }: XLSXViewerProps) {
  const { theme } = useTheme();
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [error, setError] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!file) return;

    setError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const wb = XLSX.read(data, { type: "binary" });
        setWorkbook(wb);

        const sheetData: SheetData[] = wb.SheetNames.map((sheetName) => {
          const worksheet = wb.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: "",
          }) as unknown[][];
          return {
            name: sheetName,
            data: jsonData,
          };
        });

        setSheets(sheetData);
        setActiveSheetIndex(0);

        if (containerRef.current) {
          gsap.fromTo(
            containerRef.current,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
          );
        }
      } catch (err) {
        setError("Failed to read Excel file. Please ensure it's a valid file.");
        console.error("Error reading file:", err);
      }
    };

    reader.onerror = () => {
      setError("Error reading file. Please try again.");
    };

    reader.readAsBinaryString(file);
  }, [file]);

  const handleDownload = () => {
    if (!workbook) return;
    XLSX.writeFile(workbook, file.name || "export.xlsx");
  };

  const handleClear = () => {
    setWorkbook(null);
    setSheets([]);
    setError("");
    setActiveSheetIndex(0);
    onClear();
  };

  const currentSheet = sheets[activeSheetIndex];
  const maxRows = currentSheet?.data.length || 0;
  const maxCols = currentSheet?.data[0]?.length || 0;

  return (
    <div className="w-full space-y-6">
      <Card variant="hacker" className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-6 h-6" style={{ color: theme.colors.primary }} />
            <div>
              <h3
                className="text-lg font-semibold smooch-sans font-effect-anaglyph"
                style={{ color: theme.colors.primary }}
              >
                Excel File Viewer
              </h3>
              <p
                className="text-sm font-mono"
                style={{ color: theme.colors.foreground, opacity: 0.7 }}
              >
                {file.name}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {workbook && (
              <Button
                variant="outline"
                onClick={handleDownload}
                className="flex items-center gap-2"
                size="sm"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleClear}
              className="flex items-center gap-2"
              size="sm"
            >
              <X className="w-4 h-4" />
              Clear
            </Button>
          </div>
        </div>
      </Card>

      {error && (
        <Card variant="hacker" className="p-4">
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded">
            <p className="text-sm text-red-500 font-mono">{error}</p>
          </div>
        </Card>
      )}

      {sheets.length > 0 && (
        <div ref={containerRef} className="space-y-6">
          {sheets.length > 1 && (
            <Card variant="hacker" className="p-4">
              <div className="flex flex-wrap gap-2">
                {sheets.map((sheet, index) => (
                  <Button
                    key={sheet.name}
                    variant={activeSheetIndex === index ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setActiveSheetIndex(index)}
                    className="flex items-center gap-2"
                  >
                    <Sheet className="w-4 h-4" />
                    {sheet.name}
                  </Button>
                ))}
              </div>
            </Card>
          )}

          {currentSheet && (
            <Card variant="hacker" className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2
                  className="text-xl font-semibold smooch-sans font-effect-anaglyph"
                  style={{ color: theme.colors.primary }}
                >
                  Sheet: {currentSheet.name}
                </h2>
                <p
                  className="text-sm font-mono"
                  style={{ color: theme.colors.foreground, opacity: 0.7 }}
                >
                  {maxRows} rows × {maxCols} columns
                </p>
              </div>

              <div
                className="overflow-x-auto border rounded"
                style={{ borderColor: hexToRgba(theme.colors.primary, 0.3) }}
              >
                <div className="min-w-full">
                  <table className="w-full border-collapse">
                    <thead>
                      {currentSheet.data[0] && (
                        <tr style={{ backgroundColor: hexToRgba(theme.colors.primary, 0.1) }}>
                          {currentSheet.data[0].map((header, colIndex) => (
                            <th
                              key={colIndex}
                              className="px-4 py-3 text-left text-sm font-semibold border-b font-mono"
                              style={{
                                color: theme.colors.primary,
                                borderColor: hexToRgba(theme.colors.primary, 0.3),
                              }}
                            >
                              {String(header || `Column ${colIndex + 1}`)}
                            </th>
                          ))}
                        </tr>
                      )}
                    </thead>
                    <tbody>
                      {currentSheet.data.slice(1).map((row, rowIndex) => (
                        <tr
                          key={rowIndex}
                          className="border-b transition-colors"
                          style={{
                            borderColor: hexToRgba(theme.colors.primary, 0.1),
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = hexToRgba(
                              theme.colors.primary,
                              0.05
                            );
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                          }}
                        >
                          {row.map((cell, colIndex) => (
                            <td
                              key={colIndex}
                              className="px-4 py-2 text-sm font-mono"
                              style={{ color: theme.colors.foreground, opacity: 0.8 }}
                            >
                              {String(cell || "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {currentSheet.data.length === 0 && (
                <div className="text-center py-12">
                  <p className="font-mono" style={{ color: theme.colors.foreground, opacity: 0.7 }}>
                    No data in this sheet
                  </p>
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
