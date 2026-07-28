import { TOOLBOX_EMPTY } from '../constants/microcopy';
import type { CategoryCounts, PartOfSpeech } from '../types/toolbox';

interface FrenchToolboxDashboardProps {
  counts: CategoryCounts;
  totalCount: number;
  onSelectCategory: (category: PartOfSpeech) => void;
}

export function FrenchToolboxDashboard({
  counts,
  totalCount,
  onSelectCategory,
}: FrenchToolboxDashboardProps) {
  return (
    <section className="mt-xxl" aria-labelledby="toolbox-title">
      <h2 id="toolbox-title" className="mb-m text-xl font-semibold text-text-primary">
        🧰 My French Toolbox
      </h2>

      {totalCount === 0 ? (
        <p className="rounded-card bg-surface p-l text-sm text-text-secondary shadow-card whitespace-pre-line">
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
