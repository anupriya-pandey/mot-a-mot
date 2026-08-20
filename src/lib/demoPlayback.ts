import type { RefObject } from 'react';
import type { DemoFlowStep } from '../constants/demoFlow';

const VIEW_POLL_MS = 32;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function waitForAnimationFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

export async function waitForDemoStepReady(
  stageRef: RefObject<HTMLDivElement | null>,
  step: DemoFlowStep,
  timeoutMs = 1200,
): Promise<boolean> {
  const startedAt = performance.now();

  while (performance.now() - startedAt < timeoutMs) {
    const stage = stageRef.current;
    if (!stage) {
      await delay(VIEW_POLL_MS);
      continue;
    }

    const target = stage.querySelector(`[data-demo-target="${step.target}"]`);
    if (target instanceof HTMLElement) {
      target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' });
      await waitForAnimationFrame();

      const rect = target.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return true;
      }
    }

    await delay(VIEW_POLL_MS);
  }

  return false;
}

export function estimateViewReadyMs(viewChanged: boolean): number {
  return viewChanged ? 320 : 120;
}
