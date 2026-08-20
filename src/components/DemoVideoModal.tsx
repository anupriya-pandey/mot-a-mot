import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
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
import {
  formatNarrationForDisplay,
  speakDemoNarration,
  stopDemoNarration,
} from '../lib/demoNarration';

interface DemoVideoModalProps {
  onClose: () => void;
}

interface DemoOverlay {
  highlight: { left: number; top: number; width: number; height: number };
  cursor: { left: number; top: number };
}

const STEP_INTRO_MS = 650;
const STEP_CLICK_MS = 350;

function getStepTimelineMs(step: DemoFlowStep): number {
  return STEP_INTRO_MS + (step.click ? STEP_CLICK_MS : 0) + step.durationMs;
}

function DemoCursor({
  overlay,
  showClick,
}: {
  overlay: DemoOverlay;
  showClick: boolean;
}) {
  return (
    <>
      <div
        className="pointer-events-none absolute rounded border-2 border-primary bg-primary/10 transition-all duration-700 ease-out"
        style={{
          left: overlay.highlight.left,
          top: overlay.highlight.top,
          width: overlay.highlight.width,
          height: overlay.highlight.height,
        }}
      />

      <div
        className="pointer-events-none absolute z-20 transition-all duration-700 ease-out"
        style={{
          left: overlay.cursor.left,
          top: overlay.cursor.top,
          transform: 'translate(-4px, -2px)',
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

  const totalTimelineMs = steps.reduce((sum, step) => sum + getStepTimelineMs(step), 0);
  const completedMs = steps.slice(0, stepIndex).reduce((sum, step) => sum + getStepTimelineMs(step), 0);
  const currentStepMs = steps[stepIndex] ? getStepTimelineMs(steps[stepIndex]) : 0;
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
      const stepMs = getStepTimelineMs(steps[index]);
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
      accumulated += getStepTimelineMs(steps[index]);
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
            const widthPercent = (getStepTimelineMs(step) / totalTimelineMs) * 100;
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
            Step {hoverStep + 1}: {steps[hoverStep].caption}
          </div>
        )}
      </div>

      <div className="mt-xs flex justify-between text-[10px] text-white/50">
        <span>Step {stepIndex + 1}</span>
        <span>{steps.length} steps</span>
      </div>
    </div>
  );
}

function useDemoOverlay(
  stageRef: React.RefObject<HTMLDivElement | null>,
  scrollRef: React.RefObject<HTMLDivElement | null>,
  step?: DemoFlowStep,
) {
  const [overlay, setOverlay] = useState<DemoOverlay | null>(null);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || !step?.target) {
      setOverlay(null);
      return;
    }

    let cancelled = false;

    const measure = () => {
      if (cancelled) return;

      const currentStage = stageRef.current;
      if (!currentStage) return;

      const target = currentStage.querySelector(`[data-demo-target="${step.target}"]`);
      if (!(target instanceof HTMLElement)) {
        setOverlay(null);
        return;
      }

      target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' });

      requestAnimationFrame(() => {
        if (cancelled) return;

        const stageRect = currentStage.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();

        setOverlay({
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
        });
      });
    };

    measure();

    const handleResize = () => measure();
    window.addEventListener('resize', handleResize);

    return () => {
      cancelled = true;
      window.removeEventListener('resize', handleResize);
    };
  }, [stageRef, scrollRef, step?.target, step?.id, step?.view]);

  return overlay;
}

export function DemoVideoModal({ onClose }: DemoVideoModalProps) {
  const [selectedTab, setSelectedTab] = useState<DemoTabId | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showClick, setShowClick] = useState(false);
  const [stepElapsedMs, setStepElapsedMs] = useState(0);
  const runIdRef = useRef(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const progressTimerRef = useRef<number | null>(null);

  const flow = selectedTab ? DEMO_FLOWS[selectedTab] : null;
  const currentStep = flow?.steps[stepIndex];
  const overlay = useDemoOverlay(stageRef, scrollRef, currentStep);

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
      const totalMs = getStepTimelineMs(step);
      const startedAt = performance.now();

      progressTimerRef.current = window.setInterval(() => {
        const elapsed = performance.now() - startedAt;
        setStepElapsedMs(Math.min(elapsed, totalMs));
      }, 40);
    },
    [clearProgressTimer],
  );

  const handleClose = useCallback(() => {
    runIdRef.current += 1;
    clearProgressTimer();
    stopDemoNarration();
    onClose();
  }, [clearProgressTimer, onClose]);

  const runStep = useCallback(
    async (tab: DemoTabId, index: number, runId: number) => {
      const step = DEMO_FLOWS[tab].steps[index];
      if (!step) return;

      setStepIndex(index);
      setShowClick(false);
      startProgressTimer(step);

      await new Promise((resolve) => window.setTimeout(resolve, STEP_INTRO_MS));
      if (runIdRef.current !== runId) return;

      if (step.click) {
        setShowClick(true);
        await new Promise((resolve) => window.setTimeout(resolve, STEP_CLICK_MS));
        if (runIdRef.current !== runId) return;
        setShowClick(false);
      }

      const narrationPromise = speakDemoNarration(step.narration);
      const dwellPromise = new Promise((resolve) => window.setTimeout(resolve, step.durationMs));
      await Promise.all([narrationPromise, dwellPromise]);

      if (runIdRef.current !== runId) return;

      const nextIndex = index + 1;
      if (nextIndex < DEMO_FLOWS[tab].steps.length) {
        await runStep(tab, nextIndex, runId);
        return;
      }

      clearProgressTimer();
      setPlaying(false);
    },
    [clearProgressTimer, startProgressTimer],
  );

  const startPlayback = useCallback(
    (tab: DemoTabId, fromIndex = 0) => {
      runIdRef.current += 1;
      const runId = runIdRef.current;
      stopDemoNarration();
      setStepIndex(fromIndex);
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
    return () => {
      runIdRef.current += 1;
      clearProgressTimer();
      stopDemoNarration();
    };
  }, [clearProgressTimer]);

  const handleSelectTab = (tab: DemoTabId) => {
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
                  <DemoCursor overlay={overlay} showClick={showClick} />
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
                <p className="text-sm font-medium text-white">{currentStep?.caption}</p>
                <p className="mt-xs text-xs text-white/70">
                  {currentStep ? formatNarrationForDisplay(currentStep.narration) : ''}
                </p>
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
              <p className="text-xs text-text-secondary">
                Click the timeline to jump to any step
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
