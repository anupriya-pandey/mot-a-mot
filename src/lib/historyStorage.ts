import type { AnalysisResult, SentenceLanguage } from '../types/analysis';
import type { SearchHistoryEntry } from '../types/history';
import { STORAGE_KEYS } from './storageKeys';
import { notifyUserDataChanged } from './syncNotifier';
import { safeGetItem, safeSetJsonWithTrim } from './safeStorage';

const STORAGE_KEY = STORAGE_KEYS.history;
const MAX_ENTRIES = 50;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function loadHistory(): SearchHistoryEntry[] {
  try {
    const raw = safeGetItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SearchHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: SearchHistoryEntry[]): void {
  safeSetJsonWithTrim(STORAGE_KEY, entries.slice(0, MAX_ENTRIES), 1);
  notifyUserDataChanged();
}

export function addHistoryEntry(
  sentence: string,
  sourceSentence: string,
  result: AnalysisResult,
  sentenceLanguage: SentenceLanguage = 'french',
): SearchHistoryEntry {
  const entry: SearchHistoryEntry = {
    id: generateId(),
    sentence: sentence.trim(),
    sourceSentence: sourceSentence.trim(),
    sentenceLanguage,
    result,
    createdAt: new Date().toISOString(),
  };

  const existing = loadHistory();
  saveHistory([entry, ...existing]);
  return entry;
}

export function updateHistoryEntry(
  id: string,
  sentence: string,
  sourceSentence: string,
  result: AnalysisResult,
  sentenceLanguage: SentenceLanguage = 'french',
): SearchHistoryEntry | null {
  const existing = loadHistory();
  const index = existing.findIndex((entry) => entry.id === id);

  if (index === -1) return null;

  const updated: SearchHistoryEntry = {
    ...existing[index],
    sentence: sentence.trim(),
    sourceSentence: sourceSentence.trim(),
    sentenceLanguage,
    result,
    createdAt: new Date().toISOString(),
  };

  existing[index] = updated;
  saveHistory(existing);
  return updated;
}

export function getHistoryEntry(id: string): SearchHistoryEntry | null {
  return loadHistory().find((entry) => entry.id === id) ?? null;
}

export function getHistoryCount(): number {
  return loadHistory().length;
}
