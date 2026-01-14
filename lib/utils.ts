/**
 * Utility function to merge CSS classes
 * Handles conditional classes and filters out falsy values
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
