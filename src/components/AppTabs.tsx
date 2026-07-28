import { History, PenLine } from 'lucide-react';
import type { AppTab } from '../types/history';

interface AppTabsProps {
  active: AppTab;
  onChange: (tab: AppTab) => void;
}

export function AppTabs({ active, onChange }: AppTabsProps) {
  return (
    <nav
      className="mx-auto mb-l flex w-full max-w-content gap-s px-m pt-m"
      aria-label="Main navigation"
    >
      <button
        type="button"
        onClick={() => onChange('check')}
        className={[
          'flex flex-1 items-center justify-center gap-s rounded-button px-m py-3 text-sm font-medium transition-colors',
          active === 'check'
            ? 'bg-primary text-white'
            : 'border border-border bg-surface text-text-secondary hover:bg-primary-light hover:text-primary',
        ].join(' ')}
        aria-current={active === 'check' ? 'page' : undefined}
      >
        <PenLine className="h-4 w-4" aria-hidden />
        Check
      </button>
      <button
        type="button"
        onClick={() => onChange('history')}
        className={[
          'flex flex-1 items-center justify-center gap-s rounded-button px-m py-3 text-sm font-medium transition-colors',
          active === 'history'
            ? 'bg-primary text-white'
            : 'border border-border bg-surface text-text-secondary hover:bg-primary-light hover:text-primary',
        ].join(' ')}
        aria-current={active === 'history' ? 'page' : undefined}
      >
        <History className="h-4 w-4" aria-hidden />
        History
      </button>
    </nav>
  );
}
