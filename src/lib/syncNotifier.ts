let scheduleFn: (() => void) | null = null;

export function registerSyncScheduler(fn: () => void): void {
  scheduleFn = fn;
}

export function notifyUserDataChanged(): void {
  scheduleFn?.();
}
