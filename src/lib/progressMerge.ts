import type { SearchHistoryEntry } from '../types/history';
import type { VocabularyEntry } from '../types/toolbox';
import type { CompletedPracticeQuestion } from './practiceHistoryStorage';
import type { CachedRatings } from './ratingsCache';
import { mergeToolboxSnapshots } from './toolboxStorage';

const HISTORY_MAX = 50;
const PRACTICE_HISTORY_MAX = 500;

export interface ProgressPayload {
  toolbox: VocabularyEntry[];
  search_history: SearchHistoryEntry[];
  practice_history: CompletedPracticeQuestion[];
  ratings_cache: Record<string, CachedRatings>;
}

function mergeHistory(
  local: SearchHistoryEntry[],
  remote: SearchHistoryEntry[],
): SearchHistoryEntry[] {
  const byId = new Map<string, SearchHistoryEntry>();

  for (const entry of [...remote, ...local]) {
    const existing = byId.get(entry.id);
    if (!existing || new Date(entry.createdAt).getTime() > new Date(existing.createdAt).getTime()) {
      byId.set(entry.id, entry);
    }
  }

  return [...byId.values()]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, HISTORY_MAX);
}

function mergePracticeHistory(
  local: CompletedPracticeQuestion[],
  remote: CompletedPracticeQuestion[],
): CompletedPracticeQuestion[] {
  const byId = new Map<string, CompletedPracticeQuestion>();

  for (const entry of [...remote, ...local]) {
    const existing = byId.get(entry.id);
    if (
      !existing ||
      new Date(entry.completedAt).getTime() > new Date(existing.completedAt).getTime()
    ) {
      byId.set(entry.id, entry);
    }
  }

  return [...byId.values()]
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, PRACTICE_HISTORY_MAX);
}

function mergeRatingsCache(
  local: Record<string, CachedRatings>,
  remote: Record<string, CachedRatings>,
): Record<string, CachedRatings> {
  return { ...remote, ...local };
}

export function mergeProgress(local: ProgressPayload, remote: ProgressPayload): ProgressPayload {
  return {
    toolbox: mergeToolboxSnapshots(local.toolbox, remote.toolbox),
    search_history: mergeHistory(local.search_history, remote.search_history),
    practice_history: mergePracticeHistory(local.practice_history, remote.practice_history),
    ratings_cache: mergeRatingsCache(local.ratings_cache, remote.ratings_cache),
  };
}

export function hasMeaningfulProgress(progress: ProgressPayload): boolean {
  return (
    progress.toolbox.length > 0 ||
    progress.search_history.length > 0 ||
    progress.practice_history.length > 0 ||
    Object.keys(progress.ratings_cache).length > 0
  );
}
