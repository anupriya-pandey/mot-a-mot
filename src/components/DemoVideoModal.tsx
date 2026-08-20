import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, X } from 'lucide-react';
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
  const runIdRef = useRef(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const flow = selectedTab ? DEMO_FLOWS[selectedTab] : null;
  const currentStep = flow?.steps[stepIndex];
  const overlay = useDemoOverlay(stageRef, scrollRef, currentStep);

  const handleClose = useCallback(() => {
    runIdRef.current += 1;
    stopDemoNarration();
    onClose();
  }, [onClose]);

  const runStep = useCallback(async (tab: DemoTabId, index: number, runId: number) => {
    const step = DEMO_FLOWS[tab].steps[index];
    if (!step) return;

    setStepIndex(index);
    setShowClick(false);

    await new Promise((resolve) => window.setTimeout(resolve, 650));
    if (runIdRef.current !== runId) return;

    if (step.click) {
      setShowClick(true);
      await new Promise((resolve) => window.setTimeout(resolve, 350));
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

    setPlaying(false);
  }, []);

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
      stopDemoNarration();
      setStepIndex(index);
      setShowClick(false);

      if (continuePlaying) {
        const runId = runIdRef.current;
        setPlaying(true);
        void runStep(selectedTab, index, runId);
      } else {
        setPlaying(false);
      }
    },
    [flow, runStep, selectedTab],
  );

  useEffect(() => {
    return () => {
      runIdRef.current += 1;
      stopDemoNarration();
    };
  }, []);

  const handleSelectTab = (tab: DemoTabId) => {
    setSelectedTab(tab);
    startPlayback(tab, 0);
  };

  const handleTogglePlay = () => {
    if (!selectedTab) return;

    if (playing) {
      runIdRef.current += 1;
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

  const handlePrevious = () => {
    if (!flow || stepIndex === 0) return;
    goToStep(stepIndex - 1, playing);
  };

  const handleNext = () => {
    if (!flow || stepIndex >= flow.steps.length - 1) return;
    goToStep(stepIndex + 1, playing);
  };

  const progress =
    flow && flow.steps.length > 0 ? ((stepIndex + 1) / flow.steps.length) * 100 : 0;

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
                  stopDemoNarration();
                  setPlaying(false);
                  setSelectedTab(null);
                  setStepIndex(0);
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
                <div className="mb-s h-1 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm font-medium text-white">{currentStep?.caption}</p>
                <p className="mt-xs text-xs text-white/70">
                  {currentStep ? formatNarrationForDisplay(currentStep.narration) : ''}
                </p>
              </div>
            </div>

            <div className="mt-m flex flex-wrap items-center gap-s">
              <SecondaryButton
                onClick={handlePrevious}
                className="!w-auto"
                disabled={stepIndex === 0}
              >
                <span className="inline-flex items-center gap-xs">
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </span>
              </SecondaryButton>
              <SecondaryButton onClick={handleTogglePlay} className="!w-auto">
                <span className="inline-flex items-center gap-xs">
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {playing ? 'Pause' : 'Play'}
                </span>
              </SecondaryButton>
              <SecondaryButton
                onClick={handleNext}
                className="!w-auto"
                disabled={!flow || stepIndex >= flow.steps.length - 1}
              >
                <span className="inline-flex items-center gap-xs">
                  Next
                  <ChevronRight className="h-4 w-4" />
                </span>
              </SecondaryButton>
              <SecondaryButton onClick={handleRestart} className="!w-auto">
                <span className="inline-flex items-center gap-xs">
                  <RotateCcw className="h-4 w-4" />
                  Restart
                </span>
              </SecondaryButton>
              <p className="text-xs text-text-secondary">
                Step {stepIndex + 1} of {flow?.steps.length ?? 0}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
