import { Briefcase, FlaskConical, History, PenLine } from 'lucide-react';
import type { AppTab } from '../types/history';

interface AppTabsProps {
  active: AppTab;
  onChange: (tab: AppTab) => void;
}

const TABS: { id: AppTab; label: string; icon: typeof PenLine }[] = [
  { id: 'check', label: 'Check', icon: PenLine },
  { id: 'toolbox', label: 'Toolbox', icon: Briefcase },
  { id: 'practice', label: 'Practice', icon: FlaskConical },
  { id: 'history', label: 'History', icon: History },
];

export function AppTabs({ active, onChange }: AppTabsProps) {
  return (
    <nav
      className="mx-auto mb-l flex w-full max-w-content gap-xs px-m pt-m sm:gap-s"
      aria-label="Main navigation"
    >
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={[
            'flex flex-1 items-center justify-center gap-xs rounded-button px-s py-3 text-sm font-medium transition-colors sm:gap-s sm:px-m',
            active === id
              ? 'bg-primary text-white'
              : 'border border-border bg-surface text-text-secondary hover:bg-primary-light hover:text-primary',
          ].join(' ')}
          aria-current={active === id ? 'page' : undefined}
        >
          <Icon className="h-4 w-4 shrink-0" aria-hidden />
          {label}
        </button>
      ))}
    </nav>
  );
}
