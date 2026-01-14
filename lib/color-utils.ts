/**
 * Converts a hex color code to RGBA format
 * @param hex - Hex color code (with or without #, supports 3 and 6 digit formats)
 * @param alpha - Alpha value between 0 and 1
 * @returns RGBA color string in format "rgba(r, g, b, alpha)"
 * @throws Error if hex format is invalid
 */
export function hexToRgba(hex: string, alpha: number): string {
  if (alpha < 0 || alpha > 1) {
    throw new Error("Alpha value must be between 0 and 1");
  }

  let cleanHex = hex.replace("#", "");

  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  if (cleanHex.length !== 6) {
    throw new Error("Invalid hex color format. Expected 3 or 6 digit hex code.");
  }

  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    throw new Error("Invalid hex color format. Contains non-hexadecimal characters.");
  }

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Extracts RGB values from hex color for easier manipulation
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleanHex = hex.replace("#", "");

  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  if (cleanHex.length !== 6) {
    throw new Error("Invalid hex color format. Expected 3 or 6 digit hex code.");
  }

  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    throw new Error("Invalid hex color format. Contains non-hexadecimal characters.");
  }

  return { r, g, b };
}

/**
 * Creates a consistent rgba string from hex color
 */
export function createRgbaString(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, `;
}
