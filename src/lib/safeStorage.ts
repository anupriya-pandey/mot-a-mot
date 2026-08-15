export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeSetJson(key: string, value: unknown): boolean {
  try {
    return safeSetItem(key, JSON.stringify(value));
  } catch {
    return false;
  }
}

export function safeSetJsonWithTrim<T>(
  key: string,
  value: T[],
  minItems = 1,
): boolean {
  let next = [...value];

  while (next.length >= minItems) {
    if (safeSetJson(key, next)) {
      return true;
    }
    if (next.length === minItems) break;
    next = next.slice(0, Math.max(minItems, Math.floor(next.length * 0.7)));
  }

  return safeSetJson(key, next.slice(0, minItems));
}
