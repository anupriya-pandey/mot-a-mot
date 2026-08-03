import type { SentenceLanguage } from '../types/analysis';
import { loadHistory } from './historyStorage';

const STORAGE_KEY = 'mot-a-mot-ratings-cache-v1';

export interface CachedRatings {
  grammar: number;
  naturalness: number;
}

function normalizeKey(ratedSentence: string, sentenceLanguage: SentenceLanguage): string {
  return `${sentenceLanguage}:${ratedSentence.trim().toLowerCase().normalize('NFC')}`;
}

function loadCache(): Record<string, CachedRatings> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, CachedRatings>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveCache(cache: Record<string, CachedRatings>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
}

function findRatingsInHistory(
  ratedSentence: string,
  sentenceLanguage: SentenceLanguage,
): CachedRatings | null {
  const key = normalizeKey(ratedSentence, sentenceLanguage);

  for (const entry of loadHistory()) {
    if (entry.sentenceLanguage !== sentenceLanguage) continue;

    const entryKey = normalizeKey(entry.sentence, entry.sentenceLanguage);
    const sourceKey = normalizeKey(entry.sourceSentence, 'french');

    if (entryKey === key || (sentenceLanguage === 'french' && sourceKey === key && entry.sentence === entry.sourceSentence)) {
      const ratings = entry.result?.ratings;
      if (ratings && typeof ratings.grammar === 'number' && typeof ratings.naturalness === 'number') {
        return {
          grammar: Math.round(ratings.grammar),
          naturalness: Math.round(ratings.naturalness),
        };
      }
    }
  }

  return null;
}

export function getCachedRatings(
  ratedSentence: string,
  sentenceLanguage: SentenceLanguage,
): CachedRatings | null {
  const key = normalizeKey(ratedSentence, sentenceLanguage);
  const cached = loadCache()[key];
  if (cached && typeof cached.grammar === 'number' && typeof cached.naturalness === 'number') {
    return cached;
  }

  const fromHistory = findRatingsInHistory(ratedSentence, sentenceLanguage);
  if (fromHistory) {
    setCachedRatings(ratedSentence, sentenceLanguage, fromHistory);
    return fromHistory;
  }

  return null;
}

export function setCachedRatings(
  ratedSentence: string,
  sentenceLanguage: SentenceLanguage,
  ratings: CachedRatings,
): void {
  const key = normalizeKey(ratedSentence, sentenceLanguage);
  const cache = loadCache();
  cache[key] = {
    grammar: Math.round(ratings.grammar),
    naturalness: Math.round(ratings.naturalness),
  };
  saveCache(cache);
}

/** Reuse cached scores for the same rated sentence, or store new scores for next time. */
export function applyConsistentRatings(
  ratedSentence: string,
  sentenceLanguage: SentenceLanguage,
  ratings: CachedRatings,
): CachedRatings {
  if (sentenceLanguage === 'english') {
    return { grammar: 0, naturalness: 0 };
  }

  const cached = getCachedRatings(ratedSentence, sentenceLanguage);
  if (cached) {
    return cached;
  }

  const normalized = {
    grammar: Math.round(ratings.grammar),
    naturalness: Math.round(ratings.naturalness),
  };
  setCachedRatings(ratedSentence, sentenceLanguage, normalized);
  return normalized;
}
