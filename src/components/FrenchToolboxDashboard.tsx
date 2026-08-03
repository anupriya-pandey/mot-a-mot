import {
  TOOLBOX_DESCRIPTION,
  TOOLBOX_EMPTY,
  TOOLBOX_METHOD_IMPORT,
  TOOLBOX_METHOD_PRACTICE,
} from '../constants/microcopy';
import type { CategoryCounts, PartOfSpeech } from '../types/toolbox';
import { SecondaryButton } from './SecondaryButton';

interface FrenchToolboxDashboardProps {
  counts: CategoryCounts;
  totalCount: number;
  onSelectCategory: (category: PartOfSpeech) => void;
  onImport: () => void;
}

export function FrenchToolboxDashboard({
  counts,
  totalCount,
  onSelectCategory,
  onImport,
}: FrenchToolboxDashboardProps) {
  return (
    <section className="mt-xxl" aria-labelledby="toolbox-title">
      <div className="mb-m flex items-center justify-between gap-m">
        <h2 id="toolbox-title" className="text-xl font-semibold text-text-primary">
          🧰 My French Toolbox
        </h2>
        {totalCount > 0 && (
          <p className="text-sm text-text-secondary">
            {totalCount} {totalCount === 1 ? 'entry' : 'entries'}
          </p>
        )}
      </div>

      <div className="mb-m rounded-card bg-surface p-m shadow-card">
        <p className="text-sm leading-relaxed text-text-secondary">{TOOLBOX_DESCRIPTION}</p>
        <ul className="mt-m space-y-s text-sm leading-relaxed text-text-secondary">
          <li className="flex gap-s">
            <span className="shrink-0 text-primary" aria-hidden>
              ✦
            </span>
            <span>{TOOLBOX_METHOD_PRACTICE}</span>
          </li>
          <li className="flex gap-s">
            <span className="shrink-0 text-primary" aria-hidden>
              ✦
            </span>
            <span>{TOOLBOX_METHOD_IMPORT}</span>
          </li>
        </ul>
      </div>

      <SecondaryButton onClick={onImport} className="mb-m">
        Import to Toolbox
      </SecondaryButton>

      {totalCount === 0 ? (
        <p className="rounded-card bg-surface p-m text-sm text-text-secondary shadow-card">
          {TOOLBOX_EMPTY}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-s sm:grid-cols-2">
          {(Object.entries(counts) as [PartOfSpeech, number][]).map(([category, count]) => (
            <button
              key={category}
              type="button"
              onClick={() => onSelectCategory(category)}
              className="rounded-card bg-surface p-m text-left shadow-card transition-colors hover:bg-primary-light"
            >
              <span className="font-medium text-text-primary">{category}</span>
              <span className="ml-s text-text-secondary">({count})</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
