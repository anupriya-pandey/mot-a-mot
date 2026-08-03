import type { CategoryCounts, PartOfSpeech } from '../types/toolbox';

interface FrenchToolboxDashboardProps {
  counts: CategoryCounts;
  totalCount: number;
  onSelectCategory: (category: PartOfSpeech) => void;
  description: string;
  methodPractice: string;
  methodImport: string;
  emptyMessage: string;
}

export function FrenchToolboxDashboard({
  counts,
  totalCount,
  onSelectCategory,
  description,
  methodPractice,
  methodImport,
  emptyMessage,
}: FrenchToolboxDashboardProps) {
  const categoriesWithEntries = (Object.entries(counts) as [PartOfSpeech, number][]).filter(
    ([, count]) => count > 0,
  );

  return (
    <section aria-labelledby="toolbox-categories">
      <div className="mb-m flex items-center justify-between gap-m">
        <h2 id="toolbox-categories" className="text-lg font-semibold text-text-primary">
          Categories
        </h2>
        {totalCount > 0 && (
          <p className="text-sm text-text-secondary">
            {totalCount} {totalCount === 1 ? 'entry' : 'entries'}
          </p>
        )}
      </div>

      <div className="mb-m rounded-card bg-surface p-m shadow-card">
        <p className="text-sm leading-relaxed text-text-secondary">{description}</p>
        <ul className="mt-m space-y-s text-sm leading-relaxed text-text-secondary">
          <li className="flex gap-s">
            <span className="shrink-0 text-primary" aria-hidden>
              ✦
            </span>
            <span>{methodPractice}</span>
          </li>
          <li className="flex gap-s">
            <span className="shrink-0 text-primary" aria-hidden>
              ✦
            </span>
            <span>{methodImport}</span>
          </li>
        </ul>
      </div>

      {totalCount === 0 ? (
        <p className="rounded-card bg-surface p-m text-sm text-text-secondary shadow-card">
          {emptyMessage}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-s sm:grid-cols-2">
          {categoriesWithEntries.map(([category, count]) => (
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
