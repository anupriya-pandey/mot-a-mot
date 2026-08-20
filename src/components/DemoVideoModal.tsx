import { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, X } from 'lucide-react';
import { SecondaryButton } from './SecondaryButton';
import { DemoMockScreen } from './demo/DemoMockScreen';
import { DEMO_FLOWS, type DemoFlowStep } from '../constants/demoFlow';
import {
  DEMO_TABS,
  HOME_DEMO_SUBTITLE,
  HOME_DEMO_TITLE,
  type DemoTabId,
} from '../constants/homeMicrocopy';
import { preloadDemoNarration, speakDemoNarration, stopDemoNarration } from '../lib/demoNarration';
import {
  animateDemoFocus,
  DEMO_SCROLL_MS,
  estimateStepTimelineMs,
  getDemoScreenKey,
  type DemoOverlayMetrics,
  waitForDemoStepReady,
} from '../lib/demoPlayback';

interface DemoVideoModalProps {
  onClose: () => void;
}

const STEP_CLICK_MS = 320;
const STEP_TAIL_MS = 36;

function DemoCursor({
  overlay,
  showClick,
  live,
}: {
  overlay: DemoOverlayMetrics;
  showClick: boolean;
  live: boolean;
}) {
  const transitionMs = live ? 0 : DEMO_SCROLL_MS;

  return (
    <>
      <div
        className="pointer-events-none absolute rounded border-2 border-primary bg-primary/10"
        style={{
          left: overlay.highlight.left,
          top: overlay.highlight.top,
          width: overlay.highlight.width,
          height: overlay.highlight.height,
          transitionProperty: live ? 'none' : 'left, top, width, height',
          transitionDuration: `${transitionMs}ms`,
          transitionTimingFunction: 'ease-in-out',
        }}
      />

      <div
        className="pointer-events-none absolute z-20"
        style={{
          left: overlay.cursor.left,
          top: overlay.cursor.top,
          transform: 'translate(-4px, -2px)',
          transitionProperty: live ? 'none' : 'left, top',
          transitionDuration: `${transitionMs}ms`,
          transitionTimingFunction: 'ease-in-out',
        }}
      >
        {showClick && (
          <span className="absolute left-0 top-0 h-5 w-5 animate-ping rounded-full bg-primary/40" />
        )}
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className="drop-shadow-md"
        >
          <path
            d="M4 3L4 18L9 13L13 21L15 20L11 12L18 12L4 3Z"
            fill="#111827"
            stroke="#ffffff"
            strokeWidth="1.2"
          />
        </svg>
      </div>
    </>
  );
}

function DemoTimeline({
  steps,
  stepIndex,
  stepElapsedMs,
  onSeek,
}: {
  steps: DemoFlowStep[];
  stepIndex: number;
  stepElapsedMs: number;
  onSeek: (index: number) => void;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const [hoverStep, setHoverStep] = useState<number | null>(null);
  const [hoverPercent, setHoverPercent] = useState(0);

  const totalTimelineMs = steps.reduce((sum, step) => sum + estimateStepTimelineMs(step), 0);
  const completedMs = steps.slice(0, stepIndex).reduce((sum, step) => sum + estimateStepTimelineMs(step), 0);
  const currentStepMs = steps[stepIndex] ? estimateStepTimelineMs(steps[stepIndex]) : 0;
  const progressPercent =
    totalTimelineMs > 0
      ? ((completedMs + Math.min(stepElapsedMs, currentStepMs)) / totalTimelineMs) * 100
      : 0;

  const seekFromClientX = (clientX: number) => {
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect || totalTimelineMs <= 0) return;

    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const targetMs = ratio * totalTimelineMs;

    let accumulated = 0;
    for (let index = 0; index < steps.length; index += 1) {
      const stepMs = estimateStepTimelineMs(steps[index]);
      if (targetMs <= accumulated + stepMs) {
        onSeek(index);
        return;
      }
      accumulated += stepMs;
    }

    onSeek(steps.length - 1);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect || totalTimelineMs <= 0) return;

    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    setHoverPercent(ratio * 100);
    const targetMs = ratio * totalTimelineMs;

    let accumulated = 0;
    for (let index = 0; index < steps.length; index += 1) {
      accumulated += estimateStepTimelineMs(steps[index]);
      if (targetMs <= accumulated) {
        setHoverStep(index);
        return;
      }
    }

    setHoverStep(steps.length - 1);
  };

  let segmentOffset = 0;

  return (
    <div className="mb-s">
      <div
        ref={barRef}
        role="slider"
        aria-label="Demo timeline"
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-valuenow={stepIndex + 1}
        aria-valuetext={`Step ${stepIndex + 1} of ${steps.length}`}
        tabIndex={0}
        className="group relative h-3 cursor-pointer rounded-full bg-white/20 transition-[height] hover:h-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        onClick={(event) => seekFromClientX(event.clientX)}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => {
          setHoverStep(null);
          setHoverPercent(0);
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') {
            event.preventDefault();
            onSeek(Math.min(stepIndex + 1, steps.length - 1));
          }
          if (event.key === 'ArrowLeft') {
            event.preventDefault();
            onSeek(Math.max(stepIndex - 1, 0));
          }
        }}
      >
        <div className="absolute inset-0 overflow-hidden rounded-full">
          {steps.map((step) => {
            const widthPercent = (estimateStepTimelineMs(step) / totalTimelineMs) * 100;
            const segment = (
              <div
                key={step.id}
                className="absolute top-0 h-full border-r border-black/20 last:border-r-0"
                style={{ left: `${segmentOffset}%`, width: `${widthPercent}%` }}
              />
            );
            segmentOffset += widthPercent;
            return segment;
          })}
        </div>

        <div
          className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-150 ease-linear"
          style={{ width: `${progressPercent}%` }}
        />

        {hoverStep !== null && steps[hoverStep] && (
          <div
            className="pointer-events-none absolute bottom-full z-10 mb-2 max-w-[220px] -translate-x-1/2 rounded bg-black/90 px-2 py-1 text-[11px] text-white shadow-lg"
            style={{ left: `${hoverPercent}%` }}
          >
            {steps[hoverStep].caption}
          </div>
        )}
      </div>
    </div>
  );
}

function getStepTarget(
  stage: HTMLDivElement | null,
  step: DemoFlowStep,
): HTMLElement | null {
  const target = stage?.querySelector(`[data-demo-target="${step.target}"]`);
  return target instanceof HTMLElement ? target : null;
}

export function DemoVideoModal({ onClose }: DemoVideoModalProps) {
  const [selectedTab, setSelectedTab] = useState<DemoTabId | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showClick, setShowClick] = useState(false);
  const [overlay, setOverlay] = useState<DemoOverlayMetrics | null>(null);
  const [overlayLive, setOverlayLive] = useState(false);
  const [stepElapsedMs, setStepElapsedMs] = useState(0);
  const runIdRef = useRef(0);
  const previousScreenKeyRef = useRef<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const progressTimerRef = useRef<number | null>(null);
  const currentStepRef = useRef<DemoFlowStep | null>(null);

  const flow = selectedTab ? DEMO_FLOWS[selectedTab] : null;
  const currentStep = flow?.steps[stepIndex];
  currentStepRef.current = currentStep ?? null;

  const clearProgressTimer = useCallback(() => {
    if (progressTimerRef.current !== null) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  const startProgressTimer = useCallback(
    (step: DemoFlowStep) => {
      clearProgressTimer();
      setStepElapsedMs(0);
      const totalMs = estimateStepTimelineMs(step);
      const startedAt = performance.now();

      progressTimerRef.current = window.setInterval(() => {
        const elapsed = performance.now() - startedAt;
        setStepElapsedMs(Math.min(elapsed, totalMs));
      }, 40);
    },
    [clearProgressTimer],
  );

  const focusStepTarget = useCallback(async (step: DemoFlowStep, sameScreen: boolean) => {
    const stage = stageRef.current;
    const scrollContainer = scrollRef.current;
    const target = getStepTarget(stage, step);

    if (!stage || !target) {
      setOverlay(null);
      return;
    }

    await animateDemoFocus(stage, scrollContainer, target, {
      smooth: sameScreen,
      durationMs: DEMO_SCROLL_MS,
      onFrame: setOverlay,
    });
  }, []);

  const handleClose = useCallback(() => {
    runIdRef.current += 1;
    clearProgressTimer();
    stopDemoNarration();
    onClose();
  }, [clearProgressTimer, onClose]);

  const runStepRef = useRef<
    (tab: DemoTabId, index: number, runId: number) => Promise<void>
  >(async () => {});

  const finishStep = useCallback(
    async (tab: DemoTabId, index: number, runId: number) => {
      await new Promise((resolve) => window.setTimeout(resolve, STEP_TAIL_MS));
      if (runIdRef.current !== runId) return;

      const nextIndex = index + 1;
      if (nextIndex < DEMO_FLOWS[tab].steps.length) {
        await runStepRef.current(tab, nextIndex, runId);
        return;
      }

      clearProgressTimer();
      previousScreenKeyRef.current = null;
      setPlaying(false);
    },
    [clearProgressTimer],
  );

  const runStep = useCallback(
    async (tab: DemoTabId, index: number, runId: number) => {
      const step = DEMO_FLOWS[tab].steps[index];
      if (!step) return;

      const screenKey = getDemoScreenKey(tab, step);
      const sameScreen = previousScreenKeyRef.current === screenKey;
      previousScreenKeyRef.current = screenKey;

      stopDemoNarration();
      setStepIndex(index);
      setShowClick(false);
      startProgressTimer(step);

      const narrPromise = speakDemoNarration(step.narration);

      await new Promise((resolve) => requestAnimationFrame(resolve));
      if (runIdRef.current !== runId) return;

      if (!sameScreen) {
        setOverlay(null);
        await waitForDemoStepReady(stageRef, step);
        if (runIdRef.current !== runId) return;
        await focusStepTarget(step, false);
      } else {
        setOverlayLive(true);
        await focusStepTarget(step, true);
        setOverlayLive(false);
      }

      if (runIdRef.current !== runId) return;

      if (step.click) {
        setShowClick(true);
        await new Promise((resolve) => window.setTimeout(resolve, STEP_CLICK_MS));
        if (runIdRef.current !== runId) return;
        setShowClick(false);
      }

      await narrPromise;
      if (runIdRef.current !== runId) return;

      await finishStep(tab, index, runId);
    },
    [finishStep, focusStepTarget, startProgressTimer],
  );

  runStepRef.current = runStep;

  const startPlayback = useCallback(
    (tab: DemoTabId, fromIndex = 0) => {
      runIdRef.current += 1;
      const runId = runIdRef.current;
      stopDemoNarration();
      setStepIndex(fromIndex);
      previousScreenKeyRef.current = null;
      setPlaying(true);
      void runStep(tab, fromIndex, runId);
    },
    [runStep],
  );

  const goToStep = useCallback(
    (index: number, continuePlaying: boolean) => {
      if (!selectedTab || !flow) return;

      runIdRef.current += 1;
      clearProgressTimer();
      stopDemoNarration();
      setStepIndex(index);
      setShowClick(false);
      setStepElapsedMs(0);
      previousScreenKeyRef.current = null;

      if (continuePlaying) {
        const runId = runIdRef.current;
        setPlaying(true);
        void runStep(selectedTab, index, runId);
      } else {
        setPlaying(false);
      }
    },
    [clearProgressTimer, flow, runStep, selectedTab],
  );

  useEffect(() => {
    void preloadDemoNarration();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const stage = stageRef.current;
      const step = currentStepRef.current;
      if (!stage || !step) return;

      const target = getStepTarget(stage, step);
      if (!target) return;

      void animateDemoFocus(stage, scrollRef.current, target, {
        smooth: false,
        durationMs: 0,
        onFrame: setOverlay,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    return () => {
      runIdRef.current += 1;
      clearProgressTimer();
      stopDemoNarration();
    };
  }, [clearProgressTimer]);

  const handleSelectTab = (tab: DemoTabId) => {
    void preloadDemoNarration();
    setSelectedTab(tab);
    startPlayback(tab, 0);
  };

  const handleTogglePlay = () => {
    if (!selectedTab) return;

    if (playing) {
      runIdRef.current += 1;
      clearProgressTimer();
      stopDemoNarration();
      setPlaying(false);
      return;
    }

    startPlayback(selectedTab, stepIndex);
  };

  const handleRestart = () => {
    if (!selectedTab) return;
    startPlayback(selectedTab, 0);
  };

  const handleTimelineSeek = (index: number) => {
    goToStep(index, playing);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-m sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-modal-title"
    >
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-card bg-surface p-l shadow-card">
        <div className="mb-m flex items-start justify-between gap-m">
          <div>
            <h2 id="demo-modal-title" className="text-xl font-semibold text-text-primary">
              {HOME_DEMO_TITLE}
            </h2>
            <p className="mt-xs text-sm text-text-secondary">{HOME_DEMO_SUBTITLE}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-2 text-text-secondary hover:bg-background"
            aria-label="Close demo"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!selectedTab ? (
          <div className="grid grid-cols-2 gap-s">
            {DEMO_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelectTab(tab.id)}
                className="rounded-card border border-border bg-background p-m text-left transition-colors hover:border-primary hover:bg-primary-light"
              >
                <span className="font-medium text-text-primary">{tab.label}</span>
                <p className="mt-xs text-xs text-text-secondary">Auto-play walkthrough</p>
              </button>
            ))}
          </div>
        ) : (
          <>
            <div className="mb-s flex items-center justify-between gap-s">
              <p className="text-sm font-medium text-primary">{flow?.title}</p>
              <button
                type="button"
                onClick={() => {
                  runIdRef.current += 1;
                  clearProgressTimer();
                  stopDemoNarration();
                  setPlaying(false);
                  setSelectedTab(null);
                  setStepIndex(0);
                  setStepElapsedMs(0);
                  setOverlay(null);
                  previousScreenKeyRef.current = null;
                }}
                className="text-xs font-medium text-primary hover:text-primary-hover"
              >
                Choose another tab
              </button>
            </div>

            <div className="overflow-hidden rounded-card border border-border bg-[#111827] shadow-card">
              <div ref={stageRef} className="relative aspect-video w-full overflow-hidden">
                {currentStep && selectedTab && (
                  <DemoMockScreen
                    tab={selectedTab}
                    step={currentStep}
                    scrollRef={scrollRef}
                    lockScroll={Boolean(currentStep.target)}
                  />
                )}
                {overlay && currentStep && (
                  <DemoCursor overlay={overlay} showClick={showClick} live={overlayLive} />
                )}
              </div>

              <div className="border-t border-white/10 bg-black/80 px-m py-s">
                {flow && (
                  <DemoTimeline
                    steps={flow.steps}
                    stepIndex={stepIndex}
                    stepElapsedMs={stepElapsedMs}
                    onSeek={handleTimelineSeek}
                  />
                )}
                {currentStep?.caption && (
                  <p className="text-sm font-medium text-white">{currentStep.caption}</p>
                )}
              </div>
            </div>

            <div className="mt-m flex flex-wrap items-center gap-s">
              <SecondaryButton onClick={handleTogglePlay} className="!w-auto">
                <span className="inline-flex items-center gap-xs">
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {playing ? 'Pause' : 'Play'}
                </span>
              </SecondaryButton>
              <SecondaryButton onClick={handleRestart} className="!w-auto">
                <span className="inline-flex items-center gap-xs">
                  <RotateCcw className="h-4 w-4" />
                  Restart
                </span>
              </SecondaryButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
