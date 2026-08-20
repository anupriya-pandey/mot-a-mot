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
  const showResults = stepId === 'check-results' || stepId === 'check-copy';

  if (showResults) {
    return (
      <div className="flex h-full flex-col bg-background p-3 text-[10px]">
        <TabBar active="check" />
        <div className="mt-3 space-y-2">
          <div className="rounded border border-border bg-surface p-2">
            <p className="font-semibold text-text-primary">Everyday French</p>
            <p className="mt-1 text-text-secondary">Je ne peux pas venir aujourd&apos;hui.</p>
          </div>
          <div className="rounded border border-border bg-surface p-2">
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
            <span className="rounded bg-primary px-2 py-1 text-[9px] font-medium text-white">Copy</span>
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
        <p className="text-[9px] text-text-secondary">Write confidently. Learn naturally.</p>
      </div>
      <p className="mt-4 text-xs font-semibold text-text-primary">What do you want to say in French?</p>
      <div className="mt-2 rounded border border-primary bg-surface p-2 text-text-primary">
        {stepId === 'check-focus-input' ? 'Je ne peux pas venir auj|' : 'Je ne peux pas venir aujourd\u2019hui.'}
      </div>
      <div className="mt-3 rounded bg-primary py-2 text-center text-[10px] font-medium text-white">
        Check My French
      </div>
    </div>
  );
}

function ToolboxMock({ stepId }: { stepId: string }) {
  const inCategory = stepId === 'toolbox-forms' || stepId === 'toolbox-export';

  if (inCategory) {
    return (
      <div className="flex h-full flex-col bg-background p-3 text-[10px]">
        <TabBar active="toolbox" />
        <p className="mt-3 text-xs font-semibold text-text-primary">Nouns</p>
        <div className="mt-2 rounded border border-border bg-surface p-2">
          <p className="font-semibold text-text-primary">acteur / actrice</p>
          <p className="text-text-secondary">actor</p>
          <div className="mt-1 grid grid-cols-2 gap-1 text-[9px]">
            <span className="rounded bg-background px-1 py-0.5">acteur</span>
            <span className="rounded bg-background px-1 py-0.5">actrice</span>
          </div>
        </div>
        <div className="mt-2 rounded border border-border bg-surface p-2">
          <p className="font-semibold text-text-primary">patte</p>
          <p className="text-text-secondary">paw</p>
        </div>
        {stepId === 'toolbox-export' && (
          <div className="mt-2 rounded border border-primary bg-primary-light px-2 py-1 text-[9px] text-primary">
            Export Nouns · PDF / Excel
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background p-3 text-[10px]">
      <TabBar active="toolbox" />
      <p className="mt-3 text-xs font-semibold text-text-primary">French Toolbox</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {['Nouns', 'Verbs', 'Adjectives', 'Adverbs'].map((label) => (
          <div
            key={label}
            className={`rounded border bg-surface p-2 ${
              label === 'Nouns' && stepId === 'toolbox-open-nouns' ? 'border-primary' : 'border-border'
            }`}
          >
            <p className="font-medium text-text-primary">{label}</p>
            <p className="text-[9px] text-text-secondary">12 entries</p>
          </div>
        ))}
      </div>
      <div className="mt-2 rounded border border-border bg-surface px-2 py-1 text-[9px] text-text-secondary">
        Export all vocabulary
      </div>
    </div>
  );
}

function PracticeMock({ stepId }: { stepId: string }) {
  if (stepId === 'practice-answer' || stepId === 'practice-feedback') {
    return (
      <div className="flex h-full flex-col bg-background p-3 text-[10px]">
        <TabBar active="practice" />
        <p className="mt-3 text-xs font-semibold text-text-primary">Fill in the blank</p>
        <p className="mt-2 rounded border border-border bg-surface p-2 text-text-primary">
          Je ___ aller au marché demain.
        </p>
        <div className="mt-2 rounded border border-primary bg-surface p-2 text-text-primary">vais</div>
        {stepId === 'practice-feedback' && (
          <div className="mt-2 rounded border border-success/30 bg-success/10 p-2 text-success">
            Correct! Grammar · Naturalness · Meaning
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background p-3 text-[10px]">
      <TabBar active="practice" />
      <p className="mt-3 text-xs font-semibold text-text-primary">Practice Lab</p>
      <div className="mt-2 rounded border border-border bg-surface p-2">
        <p className="text-[9px] text-text-secondary">Practice Readiness</p>
        <p className="text-lg font-semibold text-text-primary">72%</p>
      </div>
      <div
        className={`mt-2 rounded border bg-surface p-2 ${
          stepId === 'practice-pick-stage' ? 'border-primary' : 'border-border'
        }`}
      >
        <p className="font-medium text-text-primary">Quick drills</p>
        <p className="text-[9px] text-text-secondary">5 min · your toolbox words</p>
      </div>
    </div>
  );
}

function HistoryMock({ stepId }: { stepId: string }) {
  const showDetail = stepId === 'history-detail' || stepId === 'history-sync';

  if (showDetail) {
    return (
      <div className="flex h-full flex-col bg-background p-3 text-[10px]">
        <TabBar active="history" />
        <div className="mt-3 space-y-2">
          <div className="rounded border border-primary bg-surface p-2">
            <p className="font-medium text-text-primary">Je ne peux pas venir aujourd&apos;hui.</p>
            <p className="text-[9px] text-text-secondary">Grammar 78 · Naturalness 82</p>
          </div>
          <div className="rounded border border-border bg-surface p-2">
            <p className="font-medium text-text-primary">What changed</p>
            <p className="text-[9px] text-text-secondary">ne before pas in negation</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background p-3 text-[10px]">
      <TabBar active="history" />
      <p className="mt-3 text-xs font-semibold text-text-primary">History</p>
      <div
        className={`mt-2 rounded border bg-surface p-2 ${
          stepId === 'history-open' ? 'border-primary' : 'border-border'
        }`}
      >
        <p className="font-medium text-text-primary">Je ne peux pas venir aujourd&apos;hui.</p>
        <p className="text-[9px] text-text-secondary">Aug 20 · Grammar 78</p>
      </div>
      <div className="mt-2 rounded border border-border bg-surface p-2">
        <p className="font-medium text-text-primary">J&apos;aimerais réserver une table.</p>
        <p className="text-[9px] text-text-secondary">Aug 18 · Grammar 85</p>
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
