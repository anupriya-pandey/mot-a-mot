const KEY_PREFIX = 'mot-progress:';
const DEVICE_ID_PATTERN = /^[a-z0-9-]{8,64}$/i;

function getKvConfig() {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ''), token };
}

export function isProgressStorageConfigured() {
  return Boolean(getKvConfig());
}

export function isValidDeviceId(deviceId) {
  return typeof deviceId === 'string' && DEVICE_ID_PATTERN.test(deviceId.trim());
}

async function kvGet(key) {
  const config = getKvConfig();
  if (!config) return null;

  const response = await fetch(`${config.url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${config.token}` },
  });

  if (!response.ok) {
    throw new Error('Could not read saved progress.');
  }

  const data = await response.json();
  if (data.result == null) return null;

  if (typeof data.result === 'string') {
    try {
      return JSON.parse(data.result);
    } catch {
      return null;
    }
  }

  return data.result;
}

async function kvSet(key, value) {
  const config = getKvConfig();
  if (!config) return false;

  const response = await fetch(`${config.url}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.token}` },
    body: JSON.stringify(value),
  });

  if (!response.ok) {
    throw new Error('Could not save progress.');
  }

  return true;
}

function storageKey(deviceId) {
  return `${KEY_PREFIX}${deviceId.trim()}`;
}

export async function getSavedProgress(deviceId) {
  if (!isValidDeviceId(deviceId)) {
    return { status: 400, body: { message: 'Invalid device id.' } };
  }

  if (!isProgressStorageConfigured()) {
    return {
      status: 503,
      body: {
        configured: false,
        message: 'Cloud saving is not set up on this deployment yet.',
      },
    };
  }

  const saved = await kvGet(storageKey(deviceId));
  return {
    status: 200,
    body: {
      configured: true,
      progress: saved ?? null,
    },
  };
}

export async function saveProgress(deviceId, progress) {
  if (!isValidDeviceId(deviceId)) {
    return { status: 400, body: { message: 'Invalid device id.' } };
  }

  if (!progress || typeof progress !== 'object') {
    return { status: 400, body: { message: 'Invalid progress payload.' } };
  }

  if (!isProgressStorageConfigured()) {
    return {
      status: 503,
      body: {
        configured: false,
        message: 'Cloud saving is not set up on this deployment yet.',
      },
    };
  }

  await kvSet(storageKey(deviceId), {
    ...progress,
    updated_at: new Date().toISOString(),
  });

  return {
    status: 200,
    body: { configured: true, saved: true },
  };
}

export function getProgressStorageStatus() {
  return {
    configured: isProgressStorageConfigured(),
  };
}
