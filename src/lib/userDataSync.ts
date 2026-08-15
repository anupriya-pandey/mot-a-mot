import { fetchRemoteProgress, saveRemoteProgress } from '../api/syncProgress';
import type { ProgressPayload } from './progressMerge';
import { hasMeaningfulProgress, mergeProgress } from './progressMerge';
import { registerSyncScheduler } from './syncNotifier';
import { DATA_SYNCED_EVENT, STORAGE_KEYS } from './storageKeys';
import { safeGetItem, safeSetJson, safeSetJsonWithTrim } from './safeStorage';

const SYNC_DEBOUNCE_MS = 2000;

let syncTimer: number | null = null;
let activeDeviceId: string | null = null;
let cloudSyncEnabled = false;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = safeGetItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readLocalProgress(): ProgressPayload {
  return {
    toolbox: readJson(STORAGE_KEYS.toolbox, []),
    search_history: readJson(STORAGE_KEYS.history, []),
    practice_history: readJson(STORAGE_KEYS.practiceHistory, []),
    ratings_cache: readJson(STORAGE_KEYS.ratingsCache, {}),
  };
}

function applyLocalProgress(progress: ProgressPayload): void {
  safeSetJson(STORAGE_KEYS.toolbox, progress.toolbox);
  safeSetJsonWithTrim(STORAGE_KEYS.history, progress.search_history, 1);
  safeSetJsonWithTrim(STORAGE_KEYS.practiceHistory, progress.practice_history, 0);
  safeSetJson(STORAGE_KEYS.ratingsCache, progress.ratings_cache);
}

function dispatchDataSynced(): void {
  window.dispatchEvent(new CustomEvent(DATA_SYNCED_EVENT));
}

export function setActiveSyncDevice(deviceId: string | null, cloudEnabled = false): void {
  activeDeviceId = deviceId;
  cloudSyncEnabled = cloudEnabled;
  if (syncTimer) {
    window.clearTimeout(syncTimer);
    syncTimer = null;
  }
}

export async function syncProgressOnLoad(deviceId: string): Promise<void> {
  setActiveSyncDevice(deviceId, false);

  const local = readLocalProgress();
  let remoteResult;

  try {
    remoteResult = await fetchRemoteProgress();
  } catch {
    dispatchDataSynced();
    return;
  }

  if (!remoteResult.configured) {
    dispatchDataSynced();
    return;
  }

  cloudSyncEnabled = true;

  if (!remoteResult.progress) {
    if (hasMeaningfulProgress(local)) {
      try {
        await saveRemoteProgress(local);
      } catch {
        // Local data still works offline.
      }
    }
    dispatchDataSynced();
    return;
  }

  const merged = mergeProgress(local, remoteResult.progress);
  applyLocalProgress(merged);

  try {
    await saveRemoteProgress(merged);
  } catch {
    // Merged local copy is still available.
  }

  dispatchDataSynced();
}

export async function pushProgressNow(): Promise<void> {
  if (!activeDeviceId || !cloudSyncEnabled) return;
  await saveRemoteProgress(readLocalProgress());
}

export function scheduleProgressSync(): void {
  if (!activeDeviceId || !cloudSyncEnabled) return;

  if (syncTimer) {
    window.clearTimeout(syncTimer);
  }

  syncTimer = window.setTimeout(() => {
    syncTimer = null;
    if (!activeDeviceId || !cloudSyncEnabled) return;
    void pushProgressNow().catch(() => {
      // Retry on the next save.
    });
  }, SYNC_DEBOUNCE_MS);
}

registerSyncScheduler(scheduleProgressSync);

export function notifyUserDataChanged(): void {
  scheduleProgressSync();
}
