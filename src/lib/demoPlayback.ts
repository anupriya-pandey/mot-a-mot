import type { RefObject } from 'react';
import type { DemoFlowStep } from '../constants/demoFlow';
import type { DemoTabId } from '../constants/homeMicrocopy';

export const DEMO_SCROLL_MS = 720;

const VIEW_POLL_MS = 24;

export interface DemoOverlayMetrics {
  highlight: { left: number; top: number; width: number; height: number };
  cursor: { left: number; top: number };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function waitForAnimationFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

export function getDemoScreenKey(tab: DemoTabId, step: DemoFlowStep): string {
  switch (tab) {
    case 'check':
      if (step.view === 'check-results') return 'check-results';
      if (step.view === 'check-loading') return 'check-loading';
      return 'check-landing';
    case 'toolbox':
      if (step.view === 'toolbox-import-success') return 'toolbox-import-success';
      if (step.view.startsWith('toolbox-import')) return 'toolbox-import';
      if (step.view === 'toolbox-vocabulary') return 'toolbox-vocabulary';
      return 'toolbox-main';
    case 'practice':
      if (step.view.startsWith('practice-question') || step.view.startsWith('practice-feedback')) {
        return 'practice-question';
      }
      if (step.view === 'practice-setup') return 'practice-setup';
      if (step.view === 'practice-intro') return 'practice-intro';
      return 'practice-ready';
    case 'history':
      if (step.view === 'history-results') return 'history-results';
      return 'history-list';
    default:
      return step.view;
  }
}

export function measureDemoTarget(stage: HTMLElement, target: HTMLElement): DemoOverlayMetrics {
  const stageRect = stage.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();

  return {
    highlight: {
      left: targetRect.left - stageRect.left - 2,
      top: targetRect.top - stageRect.top - 2,
      width: targetRect.width + 4,
      height: targetRect.height + 4,
    },
    cursor: {
      left: targetRect.left - stageRect.left + targetRect.width * 0.72,
      top: targetRect.top - stageRect.top + targetRect.height * 0.58,
    },
  };
}

function getScrollTopToCenter(container: HTMLElement, target: HTMLElement): number {
  const containerRect = container.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const offset = targetRect.top - containerRect.top - containerRect.height / 2 + targetRect.height / 2;
  return Math.max(0, container.scrollTop + offset);
}

export async function animateDemoFocus(
  stage: HTMLElement,
  scrollContainer: HTMLElement | null,
  target: HTMLElement,
  options: {
    smooth: boolean;
    durationMs: number;
    onFrame: (metrics: DemoOverlayMetrics) => void;
  },
): Promise<void> {
  if (!scrollContainer || !options.smooth) {
    target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' });
    await waitForAnimationFrame();
    options.onFrame(measureDemoTarget(stage, target));
    return;
  }

  const startTop = scrollContainer.scrollTop;
  const endTop = getScrollTopToCenter(scrollContainer, target);
  const distance = Math.abs(endTop - startTop);

  if (distance < 4) {
    options.onFrame(measureDemoTarget(stage, target));
    return;
  }

  const start = performance.now();

  await new Promise<void>((resolve) => {
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / options.durationMs);
      scrollContainer.scrollTop = startTop + (endTop - startTop) * easeInOutCubic(progress);
      options.onFrame(measureDemoTarget(stage, target));

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        resolve();
      }
    };

    requestAnimationFrame(tick);
  });
}

async function waitForDemoScaleReady(
  stageRef: RefObject<HTMLDivElement | null>,
  timeoutMs = 900,
): Promise<boolean> {
  const startedAt = performance.now();

  while (performance.now() - startedAt < timeoutMs) {
    const stage = stageRef.current;
    if (stage?.querySelector('[data-demo-scale-ready="true"]')) {
      return true;
    }
    await delay(VIEW_POLL_MS);
  }

  return false;
}

export async function waitForDemoStepReady(
  stageRef: RefObject<HTMLDivElement | null>,
  step: DemoFlowStep,
  timeoutMs = 900,
): Promise<boolean> {
  await waitForDemoScaleReady(stageRef, timeoutMs);

  const startedAt = performance.now();

  while (performance.now() - startedAt < timeoutMs) {
    const stage = stageRef.current;
    if (!stage) {
      await delay(VIEW_POLL_MS);
      continue;
    }

    const target = stage.querySelector(`[data-demo-target="${step.target}"]`);
    if (target instanceof HTMLElement) {
      const rect = target.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return true;
      }
    }

    await delay(VIEW_POLL_MS);
  }

  return false;
}

export function estimateStepTimelineMs(step: DemoFlowStep): number {
  const words = step.narration.split(/\s+/).filter(Boolean).length;
  const narrationMs = Math.max(1400, words * 265);
  const clickMs = step.click ? 320 : 0;
  return DEMO_SCROLL_MS + clickMs + narrationMs + 40;
}
