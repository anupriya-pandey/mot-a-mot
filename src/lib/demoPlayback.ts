import type { RefObject } from 'react';
import type { DemoFlowStep } from '../constants/demoFlow';
import type { DemoTabId } from '../constants/homeMicrocopy';

const VIEW_POLL_MS = 32;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function waitForAnimationFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
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

async function waitForDemoScaleReady(
  stageRef: RefObject<HTMLDivElement | null>,
  timeoutMs = 1200,
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
  timeoutMs = 1200,
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
      target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' });
      await waitForAnimationFrame();
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

export function estimateScreenChangeMs(): number {
  return 140;
}
