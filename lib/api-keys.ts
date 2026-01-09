// NOTE: In production, this should be stored in a database
// For now, we'll use environment variables or a simple in-memory store
// TODO: Implement proper key generation and storage system

const VALID_API_KEYS = new Set<string>();

// NOTE: Load valid keys from environment or initialize with a default key for development
if (process.env.API_KEYS) {
  const keys = process.env.API_KEYS.split(",").map((k) => k.trim());
  keys.forEach((key) => VALID_API_KEYS.add(key));
} else {
  // HACK: Default development key - remove in production
  VALID_API_KEYS.add("dev-key-12345");
}

export function isValidApiKey(key: string | null | undefined): boolean {
  if (!key) return false;
  return VALID_API_KEYS.has(key);
}

export function addApiKey(key: string): void {
  VALID_API_KEYS.add(key);
}

export function removeApiKey(key: string): void {
  VALID_API_KEYS.delete(key);
}

export function getAllApiKeys(): string[] {
  return Array.from(VALID_API_KEYS);
}
