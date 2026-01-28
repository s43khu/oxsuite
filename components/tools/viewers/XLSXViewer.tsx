"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { useTheme } from "@/components/ui/ThemeProvider";
import { hexToRgba, blendColors } from "@/lib/color-utils";

interface SheetData {
  name: string;
  data: unknown[][];
}

interface XLSXViewerProps {
  file: File;
  onClear: () => void;
}

export default function XLSXViewer({ file }: XLSXViewerProps) {
  const { theme } = useTheme();
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!file) return;

    setError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const wb = XLSX.read(data, { type: "binary" });

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

  if (error) {
    return (
      <div className="w-full p-4">
        <pre
          className="font-mono text-sm whitespace-pre-wrap"
          style={{ color: theme.colors.accent }}
        >
          {error}
        </pre>
      </div>
    );
  }

  if (sheets.length === 0) {
    return (
      <div className="w-full p-4">
        <pre className="font-mono text-sm" style={{ color: theme.colors.foreground }}>
          Loading...
        </pre>
      </div>
    );
  }

  const currentSheet = sheets[activeSheetIndex];

  const maxCols = currentSheet.data.reduce((max, row) => Math.max(max, row.length), 0);

  const getColumnLetter = (index: number): string => {
    let result = "";
    let num = index;
    while (num >= 0) {
      result = String.fromCharCode(65 + (num % 26)) + result;
      num = Math.floor(num / 26) - 1;
    }
    return result;
  };

  return (
    <div className="w-full">
      {sheets.length > 1 && (
        <div className="mb-2 p-2 border-b" style={{ borderColor: theme.colors.border }}>
          <div className="flex flex-wrap gap-1">
            {sheets.map((sheet, index) => (
              <button
                key={sheet.name}
                onClick={() => setActiveSheetIndex(index)}
                className="px-2 py-1 text-xs font-mono border"
                style={{
                  borderColor: theme.colors.border,
                  backgroundColor:
                    activeSheetIndex === index
                      ? hexToRgba(theme.colors.primary, 0.2)
                      : "transparent",
                  color: theme.colors.foreground,
                }}
                onMouseEnter={(e) => {
                  if (activeSheetIndex !== index) {
                    e.currentTarget.style.backgroundColor = hexToRgba(theme.colors.primary, 0.1);
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeSheetIndex !== index) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                {sheet.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        className="border"
        style={{
          borderColor: theme.colors.border,
          overflow: "auto",
          maxHeight: "70vh",
          maxWidth: "100%",
        }}
      >
        <table className="border-collapse" style={{ minWidth: "100%" }}>
          <thead>
            <tr>
              <th
                className="border px-2 py-1 text-xs font-mono font-semibold"
                style={{
                  position: "sticky",
                  left: -1,
                  zIndex: 10,
                  borderColor: theme.colors.border,
                  backgroundColor: blendColors(theme.colors.primary, theme.colors.background, 0.15),
                  color: theme.colors.foreground,
                }}
              >
                {/* Corner cell */}
              </th>
              {Array.from({ length: maxCols }).map((_, colIndex) => (
                <th
                  key={colIndex}
                  className="border px-2 py-1 text-xs font-mono font-semibold text-center"
                  style={{
                    borderColor: theme.colors.border,
                    backgroundColor: hexToRgba(theme.colors.primary, 0.15),
                    color: theme.colors.foreground,
                  }}
                >
                  {getColumnLetter(colIndex)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentSheet.data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td
                  className="border px-2 py-1 text-xs font-mono font-semibold text-center"
                  style={{
                    position: "sticky",
                    left: -1,
                    zIndex: 5,
                    borderColor: theme.colors.border,
                    backgroundColor: blendColors(
                      theme.colors.primary,
                      theme.colors.background,
                      0.15
                    ),
                    color: theme.colors.foreground,
                  }}
                >
                  {rowIndex + 1}
                </td>
                {Array.from({ length: maxCols }).map((_, colIndex) => (
                  <td
                    key={colIndex}
                    className="border px-2 py-1 text-xs font-mono whitespace-nowrap"
                    style={{
                      userSelect: "text",
                      borderColor: theme.colors.border,
                      color: theme.colors.foreground,
                    }}
                  >
                    {String(row[colIndex] || "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
