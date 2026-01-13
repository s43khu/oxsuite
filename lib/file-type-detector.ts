export type FileType = "xlsx" | "xls" | "csv" | "json" | "txt" | "pdf" | "unknown";

export interface FileTypeInfo {
  type: FileType;
  mimeType: string;
  description: string;
}

const FILE_TYPE_MAP: Record<string, FileTypeInfo> = {
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    type: "xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    description: "Excel Spreadsheet (XLSX)",
  },
  "application/vnd.ms-excel": {
    type: "xls",
    mimeType: "application/vnd.ms-excel",
    description: "Excel Spreadsheet (XLS)",
  },
  "text/csv": {
    type: "csv",
    mimeType: "text/csv",
    description: "Comma Separated Values",
  },
  "application/json": {
    type: "json",
    mimeType: "application/json",
    description: "JSON Data",
  },
  "text/plain": {
    type: "txt",
    mimeType: "text/plain",
    description: "Plain Text",
  },
  "application/pdf": {
    type: "pdf",
    mimeType: "application/pdf",
    description: "PDF Document",
  },
};

const EXTENSION_TO_TYPE: Record<string, FileType> = {
  ".xlsx": "xlsx",
  ".xls": "xls",
  ".csv": "csv",
  ".json": "json",
  ".txt": "txt",
  ".pdf": "pdf",
};

const TYPE_TO_INFO: Record<FileType, Omit<FileTypeInfo, "type">> = {
  xlsx: {
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    description: "Excel Spreadsheet (XLSX)",
  },
  xls: {
    mimeType: "application/vnd.ms-excel",
    description: "Excel Spreadsheet (XLS)",
  },
  csv: {
    mimeType: "text/csv",
    description: "Comma Separated Values",
  },
  json: {
    mimeType: "application/json",
    description: "JSON Data",
  },
  txt: {
    mimeType: "text/plain",
    description: "Plain Text",
  },
  pdf: {
    mimeType: "application/pdf",
    description: "PDF Document",
  },
  unknown: {
    mimeType: "application/octet-stream",
    description: "Unknown File Type",
  },
};

export function detectFileType(file: File): FileTypeInfo {
  const mimeType = file.type;
  const fileName = file.name.toLowerCase();
  const extension = fileName.substring(fileName.lastIndexOf("."));

  if (mimeType && FILE_TYPE_MAP[mimeType]) {
    return FILE_TYPE_MAP[mimeType];
  }

  if (extension && EXTENSION_TO_TYPE[extension]) {
    const type = EXTENSION_TO_TYPE[extension];
    const info = TYPE_TO_INFO[type];
    return {
      type,
      mimeType: info.mimeType,
      description: info.description,
    };
  }

  return {
    type: "unknown",
    mimeType: mimeType || "application/octet-stream",
    description: "Unknown File Type",
  };
}

export function isSupportedFileType(fileType: FileType): boolean {
  return fileType !== "unknown";
}
