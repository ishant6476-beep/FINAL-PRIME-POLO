/**
 * Safe localStorage helpers - prevents crashes from corrupted storage
 */

export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    /* storage unavailable (private mode, quota exceeded, etc.) */
    return null;
  }
}

export function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable - silently fail, app continues working */
  }
}

export function safeParseJSON<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return (parsed as T) ?? fallback;
  } catch {
    /* malformed JSON */
    return fallback;
  }
}

export function safeGetJSON<T>(key: string, fallback: T): T {
  const value = safeGetItem(key);
  return safeParseJSON(value, fallback);
}

export function safeSetJSON(key: string, value: unknown): void {
  try {
    const serialized = JSON.stringify(value);
    safeSetItem(key, serialized);
  } catch {
    /* serialization failed - silently fail */
  }
}
