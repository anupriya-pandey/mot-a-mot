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

interface DemoVideoModalProps {
  onClose: () => void;
}

function speakText(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

function DemoCursor({
  step,
  showClick,
}: {
  step: DemoFlowStep;
  showClick: boolean;
}) {
  return (
    <>
      {step.highlight && (
        <div
          className="pointer-events-none absolute rounded border-2 border-primary/70 bg-primary/10 transition-all duration-700 ease-out"
          style={{
            left: `${step.highlight.x}%`,
            top: `${step.highlight.y}%`,
            width: `${step.highlight.width}%`,
            height: `${step.highlight.height}%`,
          }}
        />
      )}

      <div
        className="pointer-events-none absolute z-20 transition-all duration-700 ease-out"
        style={{
          left: `${step.cursor.x}%`,
          top: `${step.cursor.y}%`,
          transform: 'translate(-20%, -10%)',
        }}
      >
        {showClick && (
          <span className="absolute left-1 top-1 h-6 w-6 animate-ping rounded-full bg-primary/40" />
        )}
        <svg
          width="24"
          height="24"
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

export function DemoVideoModal({ onClose }: DemoVideoModalProps) {
  const [selectedTab, setSelectedTab] = useState<DemoTabId | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showClick, setShowClick] = useState(false);
  const runIdRef = useRef(0);

  const flow = selectedTab ? DEMO_FLOWS[selectedTab] : null;
  const currentStep = flow?.steps[stepIndex];

  const handleClose = useCallback(() => {
    runIdRef.current += 1;
    window.speechSynthesis?.cancel();
    onClose();
  }, [onClose]);

  const runStep = useCallback(async (tab: DemoTabId, index: number, runId: number) => {
    const step = DEMO_FLOWS[tab].steps[index];
    if (!step) return;

    setStepIndex(index);
    setShowClick(false);

    await new Promise((resolve) => window.setTimeout(resolve, 450));
    if (runIdRef.current !== runId) return;

    if (step.click) {
      setShowClick(true);
      await new Promise((resolve) => window.setTimeout(resolve, 350));
      if (runIdRef.current !== runId) return;
      setShowClick(false);
    }

    const narrationPromise = speakText(step.narration);
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
    (tab: DemoTabId) => {
      runIdRef.current += 1;
      const runId = runIdRef.current;
      window.speechSynthesis?.cancel();
      setStepIndex(0);
      setPlaying(true);
      void runStep(tab, 0, runId);
    },
    [runStep],
  );

  useEffect(() => {
    return () => {
      runIdRef.current += 1;
      window.speechSynthesis?.cancel();
    };
  }, []);

  const handleSelectTab = (tab: DemoTabId) => {
    setSelectedTab(tab);
    startPlayback(tab);
  };

  const handleTogglePlay = () => {
    if (!selectedTab) return;

    if (playing) {
      runIdRef.current += 1;
      window.speechSynthesis?.cancel();
      setPlaying(false);
      return;
    }

    startPlayback(selectedTab);
  };

  const handleRestart = () => {
    if (!selectedTab) return;
    startPlayback(selectedTab);
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
                  window.speechSynthesis?.cancel();
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
              <div className="relative aspect-video w-full">
                <DemoMockScreen tab={selectedTab} stepId={currentStep?.id ?? ''} />
                {currentStep && <DemoCursor step={currentStep} showClick={showClick} />}
              </div>

              <div className="border-t border-white/10 bg-black/80 px-m py-s">
                <div className="mb-s h-1 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm font-medium text-white">{currentStep?.caption}</p>
                <p className="mt-xs text-xs text-white/70">{currentStep?.narration}</p>
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
                Step {stepIndex + 1} of {flow?.steps.length ?? 0}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
