const DEVICE_ID_KEY = 'mot-a-mot-device-id-v1';

function generateDeviceId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function getDeviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing?.trim()) return existing.trim();

    const created = generateDeviceId();
    localStorage.setItem(DEVICE_ID_KEY, created);
    return created;
  } catch {
    return generateDeviceId();
  }
}

export const getOrCreateDeviceId = getDeviceId;
