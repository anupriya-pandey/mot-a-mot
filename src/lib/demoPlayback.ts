import type { RefObject } from 'react';
import type { DemoFlowStep } from '../constants/demoFlow';

const VIEW_POLL_MS = 40;
const VIEW_PAINT_MS = 150;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function waitForAnimationFrames(count = 2): Promise<void> {
  return new Promise((resolve) => {
    let remaining = count;
    const tick = () => {
      remaining -= 1;
      if (remaining <= 0) {
        resolve();
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

export async function waitForDemoStepReady(
  stageRef: RefObject<HTMLDivElement | null>,
  step: DemoFlowStep,
  timeoutMs = 2400,
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

      const rect = target.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        await waitForAnimationFrames(2);
        await delay(VIEW_PAINT_MS);
        return true;
      }
    }

    await delay(VIEW_POLL_MS);
  }

  return false;
}

export function estimateViewReadyMs(): number {
  return VIEW_PAINT_MS + VIEW_POLL_MS * 2;
}
