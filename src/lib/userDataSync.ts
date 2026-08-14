import type { SearchHistoryEntry } from '../types/history';
import type { VocabularyEntry } from '../types/toolbox';
import type { CompletedPracticeQuestion } from './practiceHistoryStorage';
import type { CachedRatings } from './ratingsCache';
import { DATA_SYNCED_EVENT, STORAGE_KEYS } from './storageKeys';
import { getSupabaseClient } from './supabase';
import { mergeToolboxSnapshots } from './toolboxStorage';

import { registerSyncScheduler } from './syncNotifier';

const SYNC_DEBOUNCE_MS = 2000;
const HISTORY_MAX = 50;
const PRACTICE_HISTORY_MAX = 500;

export interface UserProgressRow {
  user_id: string;
  toolbox: VocabularyEntry[];
  search_history: SearchHistoryEntry[];
  practice_history: CompletedPracticeQuestion[];
  ratings_cache: Record<string, CachedRatings>;
  updated_at: string;
}

let syncTimer: number | null = null;
let activeUserId: string | null = null;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function hasMeaningfulLocalData(): boolean {
  const toolbox = readJson<VocabularyEntry[]>(STORAGE_KEYS.toolbox, []);
  const history = readJson<SearchHistoryEntry[]>(STORAGE_KEYS.history, []);
  const practice = readJson<CompletedPracticeQuestion[]>(STORAGE_KEYS.practiceHistory, []);
  const ratings = readJson<Record<string, CachedRatings>>(STORAGE_KEYS.ratingsCache, {});

  return (
    toolbox.length > 0 ||
    history.length > 0 ||
    practice.length > 0 ||
    Object.keys(ratings).length > 0
  );
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

function readLocalProgress(): Omit<UserProgressRow, 'user_id' | 'updated_at'> {
  return {
    toolbox: readJson<VocabularyEntry[]>(STORAGE_KEYS.toolbox, []),
    search_history: readJson<SearchHistoryEntry[]>(STORAGE_KEYS.history, []),
    practice_history: readJson<CompletedPracticeQuestion[]>(STORAGE_KEYS.practiceHistory, []),
    ratings_cache: readJson<Record<string, CachedRatings>>(STORAGE_KEYS.ratingsCache, {}),
  };
}

function applyLocalProgress(progress: Omit<UserProgressRow, 'user_id' | 'updated_at'>): void {
  writeJson(STORAGE_KEYS.toolbox, progress.toolbox);
  writeJson(STORAGE_KEYS.history, progress.search_history);
  writeJson(STORAGE_KEYS.practiceHistory, progress.practice_history);
  writeJson(STORAGE_KEYS.ratingsCache, progress.ratings_cache);
}

function mergeProgress(
  local: Omit<UserProgressRow, 'user_id' | 'updated_at'>,
  remote: Omit<UserProgressRow, 'user_id' | 'updated_at'>,
): Omit<UserProgressRow, 'user_id' | 'updated_at'> {
  return {
    toolbox: mergeToolboxSnapshots(local.toolbox, remote.toolbox),
    search_history: mergeHistory(local.search_history, remote.search_history),
    practice_history: mergePracticeHistory(local.practice_history, remote.practice_history),
    ratings_cache: mergeRatingsCache(local.ratings_cache, remote.ratings_cache),
  };
}

function dispatchDataSynced(): void {
  window.dispatchEvent(new CustomEvent(DATA_SYNCED_EVENT));
}

export function setActiveSyncUser(userId: string | null): void {
  activeUserId = userId;
  if (syncTimer) {
    window.clearTimeout(syncTimer);
    syncTimer = null;
  }
}

export async function syncUserDataOnLogin(userId: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  setActiveSyncUser(userId);

  const local = readLocalProgress();
  const { data, error } = await supabase
    .from('user_progress')
    .select('toolbox, search_history, practice_history, ratings_cache')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    if (hasMeaningfulLocalData()) {
      const { error: insertError } = await supabase.from('user_progress').insert({
        user_id: userId,
        ...local,
      });
      if (insertError) throw new Error(insertError.message);
    }
    dispatchDataSynced();
    return;
  }

  const remote = {
    toolbox: (data.toolbox as VocabularyEntry[]) ?? [],
    search_history: (data.search_history as SearchHistoryEntry[]) ?? [],
    practice_history: (data.practice_history as CompletedPracticeQuestion[]) ?? [],
    ratings_cache: (data.ratings_cache as Record<string, CachedRatings>) ?? {},
  };

  const merged = mergeProgress(local, remote);
  applyLocalProgress(merged);

  const { error: upsertError } = await supabase.from('user_progress').upsert({
    user_id: userId,
    ...merged,
    updated_at: new Date().toISOString(),
  });

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  dispatchDataSynced();
}

export async function pushUserDataNow(userId: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const local = readLocalProgress();
  const { error } = await supabase.from('user_progress').upsert({
    user_id: userId,
    ...local,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(error.message);
  }
}

export function scheduleUserDataSync(): void {
  if (!activeUserId) return;

  if (syncTimer) {
    window.clearTimeout(syncTimer);
  }

  syncTimer = window.setTimeout(() => {
    syncTimer = null;
    if (!activeUserId) return;
    void pushUserDataNow(activeUserId).catch(() => {
      // Sync failures should not break local usage; next change retries.
    });
  }, SYNC_DEBOUNCE_MS);
}

registerSyncScheduler(scheduleUserDataSync);

export function notifyUserDataChanged(): void {
  scheduleUserDataSync();
}
