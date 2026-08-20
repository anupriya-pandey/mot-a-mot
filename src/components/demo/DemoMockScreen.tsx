import type { DemoTabId } from '../../constants/homeMicrocopy';

interface DemoMockScreenProps {
  tab: DemoTabId;
  stepId: string;
}

function TabBar({ active }: { active: DemoTabId | 'home' }) {
  const tabs = [
    { id: 'home', label: 'Home' },
    { id: 'check', label: 'Check' },
    { id: 'toolbox', label: 'Toolbox' },
    { id: 'practice', label: 'Practice' },
    { id: 'history', label: 'History' },
  ] as const;

  return (
    <div className="flex border-b border-border bg-surface px-2 py-1.5 text-[10px]">
      {tabs.map((tab) => (
        <span
          key={tab.id}
          className={`flex-1 rounded px-1 py-1 text-center ${
            tab.id === active ? 'bg-primary-light font-semibold text-primary' : 'text-text-secondary'
          }`}
        >
          {tab.label}
        </span>
      ))}
    </div>
  );
}

function CheckMock({ stepId }: { stepId: string }) {
  const showResults = ['check-suggestions', 'check-changes', 'check-copy'].includes(stepId);

  if (showResults) {
    return (
      <div className="flex h-full flex-col bg-background p-3 text-[10px]">
        <TabBar active="check" />
        <div className="mt-3 space-y-2 overflow-y-auto">
          <div
            data-demo-target="check-suggestions"
            className="rounded border border-border bg-surface p-2"
          >
            <p className="font-semibold text-text-primary">Everyday French</p>
            <p className="mt-1 text-text-secondary">Je ne peux pas venir aujourd&apos;hui.</p>
            <p className="mt-1 text-[9px] text-text-secondary">Foundation · Expanding · Fluent</p>
          </div>
          <div
            data-demo-target="check-changes"
            className="rounded border border-border bg-surface p-2"
          >
            <p className="font-semibold text-text-primary">What changed</p>
            <div className="mt-1 grid grid-cols-3 gap-1 text-[9px] text-text-secondary">
              <span>You wrote</span>
              <span>Better</span>
              <span>Why</span>
              <span>je peux pas</span>
              <span>je ne peux pas</span>
              <span>ne before pas</span>
            </div>
          </div>
          <div className="flex justify-end">
            <span
              data-demo-target="check-copy"
              className="rounded bg-primary px-2 py-1 text-[9px] font-medium text-white"
            >
              Copy
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background p-3 text-[10px]">
      <TabBar active="check" />
      <div className="mt-4 text-center">
        <p className="text-sm font-semibold text-text-primary">Mot-à-Mot</p>
      </div>
      <p className="mt-4 text-xs font-semibold text-text-primary">What do you want to say in French?</p>
      <div
        data-demo-target="check-input"
        className="relative mt-2 rounded border border-primary bg-surface p-2 pr-8 text-text-primary"
      >
        Je ne peux pas venir aujourd&apos;hui.
        <span
          data-demo-target="check-voice"
          className="absolute right-1 top-1 rounded-full bg-primary-light px-1.5 py-0.5 text-[8px] text-primary"
        >
          Mic
        </span>
      </div>
      <div
        data-demo-target="check-submit"
        className="mt-3 rounded bg-primary py-2 text-center text-[10px] font-medium text-white"
      >
        Check My French
      </div>
    </div>
  );
}

function ToolboxMock({ stepId }: { stepId: string }) {
  const categorySteps = new Set([
    'toolbox-card-forms',
    'toolbox-export-category',
    'toolbox-delete',
  ]);

  if (categorySteps.has(stepId)) {
    return (
      <div className="flex h-full flex-col bg-background p-3 text-[10px]">
        <TabBar active="toolbox" />
        <p className="mt-3 text-xs font-semibold text-text-primary">Nouns</p>
        <div
          data-demo-target="toolbox-export-category"
          className="mt-2 rounded border border-border bg-surface px-2 py-1.5 text-[9px] text-text-secondary"
        >
          Export Nouns · PDF / Excel
        </div>
        <div
          data-demo-target="toolbox-card-forms"
          className="relative mt-2 rounded border border-border bg-surface p-2"
        >
          <p className="font-semibold text-text-primary">acteur / actrice</p>
          <p className="text-text-secondary">actor</p>
          <div className="mt-1 grid grid-cols-2 gap-1 text-[9px]">
            <span className="rounded bg-background px-1 py-0.5">acteur</span>
            <span className="rounded bg-background px-1 py-0.5">actrice</span>
          </div>
          <span
            data-demo-target="toolbox-delete"
            className="absolute right-1 top-1 rounded bg-background px-1 py-0.5 text-[8px] text-error"
          >
            Bin
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background p-3 text-[10px]">
      <TabBar active="toolbox" />
      <p className="mt-3 text-xs font-semibold text-text-primary">French Toolbox</p>
      <div
        data-demo-target="toolbox-search"
        className="mt-2 rounded border border-border bg-surface px-2 py-1.5 text-[9px] text-text-secondary"
      >
        Search entries…
      </div>
      <div
        data-demo-target="toolbox-import"
        className="mt-2 rounded border border-border bg-surface px-2 py-1.5 text-center text-[9px] font-medium text-text-primary"
      >
        Import to Toolbox
      </div>
      <div
        data-demo-target="toolbox-export-all"
        className="mt-2 rounded border border-border bg-surface px-2 py-1.5 text-center text-[9px] text-text-secondary"
      >
        Export all vocabulary
      </div>
      <div data-demo-target="toolbox-categories" className="mt-2 grid grid-cols-2 gap-2">
        {['Nouns', 'Verbs', 'Adjectives', 'Adverbs'].map((label) => (
          <div
            key={label}
            data-demo-target={label === 'Nouns' ? 'toolbox-category-nouns' : undefined}
            className={`rounded border bg-surface p-2 ${
              label === 'Nouns' && stepId === 'toolbox-category-nouns' ? 'border-primary' : 'border-border'
            }`}
          >
            <p className="font-medium text-text-primary">{label}</p>
            <p className="text-[9px] text-text-secondary">12 entries</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PracticeMock({ stepId }: { stepId: string }) {
  const sessionSteps = new Set(['practice-question', 'practice-submit', 'practice-feedback']);

  if (sessionSteps.has(stepId)) {
    return (
      <div className="flex h-full flex-col bg-background p-3 text-[10px]">
        <TabBar active="practice" />
        <p className="mt-3 text-xs font-semibold text-text-primary">Fill in the blank</p>
        <div
          data-demo-target="practice-question"
          className="mt-2 rounded border border-border bg-surface p-2 text-text-primary"
        >
          Je ___ aller au marché demain.
        </div>
        <div className="mt-2 rounded border border-primary bg-surface p-2 text-text-primary">vais</div>
        <div
          data-demo-target="practice-submit"
          className="mt-2 rounded bg-primary py-1.5 text-center text-[9px] font-medium text-white"
        >
          Submit answer
        </div>
        {stepId === 'practice-feedback' && (
          <div
            data-demo-target="practice-feedback"
            className="mt-2 rounded border border-success/30 bg-success/10 p-2 text-success"
          >
            Correct! Meaning · Grammar · Vocabulary · Naturalness
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background p-3 text-[10px]">
      <TabBar active="practice" />
      <p className="mt-3 text-xs font-semibold text-text-primary">Practice Lab</p>
      <div
        data-demo-target="practice-readiness"
        className="mt-2 rounded border border-border bg-surface p-2"
      >
        <p className="text-[9px] text-text-secondary">Practice Readiness</p>
        <p className="text-lg font-semibold text-text-primary">72%</p>
      </div>
      <div
        data-demo-target="practice-stages"
        className="mt-2 rounded border border-border bg-surface p-2"
      >
        <p className="font-medium text-text-primary">Quick drills</p>
        <p className="text-[9px] text-text-secondary">5 min · your toolbox words</p>
      </div>
      <div
        data-demo-target="practice-setup"
        className="mt-2 rounded border border-border bg-surface p-2"
      >
        <p className="font-medium text-text-primary">Focus your session</p>
        <p className="text-[9px] text-text-secondary">All categories · Nouns · Verbs</p>
      </div>
    </div>
  );
}

function HistoryMock({ stepId }: { stepId: string }) {
  const detailSteps = new Set(['history-detail', 'history-scores', 'history-sync']);

  if (detailSteps.has(stepId)) {
    return (
      <div className="flex h-full flex-col bg-background p-3 text-[10px]">
        <TabBar active="history" />
        <div className="mt-3 space-y-2">
          <div
            data-demo-target="history-detail"
            className="rounded border border-border bg-surface p-2"
          >
            <p className="font-medium text-text-primary">What changed</p>
            <p className="text-[9px] text-text-secondary">ne before pas in negation</p>
          </div>
          <div
            data-demo-target="history-scores"
            className="rounded border border-primary bg-surface p-2"
          >
            <p className="font-medium text-text-primary">Your Sentence Scores</p>
            <p className="text-[9px] text-text-secondary">Grammar 78 · Naturalness 82</p>
          </div>
          <div
            data-demo-target="history-sync"
            className="rounded border border-border bg-surface px-2 py-1 text-[9px] text-text-secondary"
          >
            Cloud backup · progress saved
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background p-3 text-[10px]">
      <TabBar active="history" />
      <p className="mt-3 text-xs font-semibold text-text-primary">History</p>
      <div data-demo-target="history-list" className="mt-2 space-y-2">
        <div
          data-demo-target="history-entry"
          className="rounded border border-border bg-surface p-2"
        >
          <p className="font-medium text-text-primary">Je ne peux pas venir aujourd&apos;hui.</p>
          <p className="text-[9px] text-text-secondary">Aug 20 · Grammar 78</p>
        </div>
        <div className="rounded border border-border bg-surface p-2">
          <p className="font-medium text-text-primary">J&apos;aimerais réserver une table.</p>
          <p className="text-[9px] text-text-secondary">Aug 18 · Grammar 85</p>
        </div>
      </div>
    </div>
  );
}

export function DemoMockScreen({ tab, stepId }: DemoMockScreenProps) {
  switch (tab) {
    case 'check':
      return <CheckMock stepId={stepId} />;
    case 'toolbox':
      return <ToolboxMock stepId={stepId} />;
    case 'practice':
      return <PracticeMock stepId={stepId} />;
    case 'history':
      return <HistoryMock stepId={stepId} />;
    default:
      return null;
  }
}
