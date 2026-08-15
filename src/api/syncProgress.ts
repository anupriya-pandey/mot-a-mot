import type { ProgressPayload } from '../lib/progressMerge';
import { getOrCreateDeviceId } from '../lib/deviceId';

function deviceHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-Mot-Device-Id': getOrCreateDeviceId(),
  };
}

export async function fetchRemoteProgress(): Promise<{
  configured: boolean;
  progress: ProgressPayload | null;
}> {
  const response = await fetch('/api/progress', {
    headers: deviceHeaders(),
  });

  if (response.status === 503) {
    return { configured: false, progress: null };
  }

  if (!response.ok) {
    throw new Error('Could not load saved progress.');
  }

  const data = (await response.json()) as {
    configured?: boolean;
    progress?: ProgressPayload | null;
  };

  return {
    configured: data.configured ?? true,
    progress: data.progress ?? null,
  };
}

export async function saveRemoteProgress(progress: ProgressPayload): Promise<boolean> {
  const response = await fetch('/api/progress', {
    method: 'PUT',
    headers: deviceHeaders(),
    body: JSON.stringify(progress),
  });

  if (response.status === 503) {
    return false;
  }

  if (!response.ok) {
    throw new Error('Could not save progress.');
  }

  return true;
}

export async function fetchProgressStorageStatus(): Promise<boolean> {
  const response = await fetch('/api/progress?status=1');
  if (!response.ok) return false;
  const data = (await response.json()) as { configured?: boolean };
  return Boolean(data.configured);
}
