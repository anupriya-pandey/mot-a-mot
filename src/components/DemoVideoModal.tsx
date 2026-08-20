import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, X } from 'lucide-react';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';
import {
  DEMO_SCRIPTS,
  DEMO_TABS,
  HOME_DEMO_SUBTITLE,
  HOME_DEMO_TITLE,
  type DemoTabId,
} from '../constants/homeMicrocopy';

interface DemoVideoModalProps {
  onClose: () => void;
}

function speakText(text: string): SpeechSynthesisUtterance | null {
  if (!('speechSynthesis' in window)) return null;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function DemoVideoModal({ onClose }: DemoVideoModalProps) {
  const [selectedTab, setSelectedTab] = useState<DemoTabId | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  const script = selectedTab ? DEMO_SCRIPTS[selectedTab] : null;
  const currentStep = script?.steps[stepIndex];

  useEffect(() => {
    if (!playing || !currentStep) return;
    speakText(currentStep.narration);
  }, [playing, currentStep, stepIndex]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  const handleClose = () => {
    window.speechSynthesis?.cancel();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-m sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-modal-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-card bg-surface p-l shadow-card">
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
                onClick={() => {
                  setSelectedTab(tab.id);
                  setStepIndex(0);
                  setPlaying(false);
                }}
                className="rounded-card border border-border bg-background p-m text-left transition-colors hover:border-primary hover:bg-primary-light"
              >
                <span className="font-medium text-text-primary">{tab.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <>
            <p className="mb-s text-sm font-medium text-primary">{script?.title}</p>
            <div className="rounded-card border border-border bg-background p-l">
              <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                Step {stepIndex + 1} of {script?.steps.length}
              </p>
              <p className="mt-s text-base text-text-primary">{currentStep?.caption}</p>
              <p className="mt-m text-sm italic text-text-secondary">{currentStep?.narration}</p>
            </div>

            <div className="mt-m flex flex-wrap items-center gap-s">
              <SecondaryButton
                onClick={() => {
                  setPlaying(false);
                  window.speechSynthesis?.cancel();
                  setStepIndex((index) => Math.max(0, index - 1));
                }}
                disabled={stepIndex === 0}
              >
                <span className="inline-flex items-center gap-xs">
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </span>
              </SecondaryButton>
              <PrimaryButton
                onClick={() => setPlaying((value) => !value)}
                className="!w-auto flex-1"
              >
                <span className="inline-flex items-center justify-center gap-xs">
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {playing ? 'Pause narration' : 'Play narration'}
                </span>
              </PrimaryButton>
              <SecondaryButton
                onClick={() => {
                  setPlaying(false);
                  window.speechSynthesis?.cancel();
                  setStepIndex((index) =>
                    Math.min((script?.steps.length ?? 1) - 1, index + 1),
                  );
                }}
                disabled={stepIndex >= (script?.steps.length ?? 1) - 1}
              >
                <span className="inline-flex items-center gap-xs">
                  Next
                  <ChevronRight className="h-4 w-4" />
                </span>
              </SecondaryButton>
            </div>

            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                window.speechSynthesis?.cancel();
                setSelectedTab(null);
                setStepIndex(0);
              }}
              className="mt-m text-sm font-medium text-primary hover:text-primary-hover"
            >
              Choose a different demo
            </button>
          </>
        )}
      </div>
    </div>
  );
}
