import { STORAGE_KEYS } from './storageKeys';
import { safeGetItem, safeSetJson } from './safeStorage';

const DISMISSED_KEY = STORAGE_KEYS.toolboxDismissedRecommendations;

export function loadDismissedRecommendations(): Set<string> {
  const stored = safeGetItem(DISMISSED_KEY);
  if (!stored) return new Set();

  try {
    const parsed = JSON.parse(stored) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((value): value is string => typeof value === 'string'));
  } catch {
    return new Set();
  }
}

export function saveDismissedRecommendations(keys: Set<string>): void {
  safeSetJson(DISMISSED_KEY, [...keys]);
}
