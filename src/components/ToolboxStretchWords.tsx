import { Plus, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  TOOLBOX_GROW_BODY,
  TOOLBOX_GROW_EMPTY,
  TOOLBOX_GROW_TAGLINE,
  TOOLBOX_GROW_TITLE,
} from '../constants/microcopy';
import { computePracticeReadiness } from '../lib/practiceReadiness';
import {
  loadDismissedRecommendations,
  saveDismissedRecommendations,
} from '../lib/toolboxRecommendationStorage';
import {
  RECOMMENDATION_SLOT_COUNT,
  getNextToolboxRecommendation,
  rankToolboxRecommendations,
  recommendationKey,
} from '../lib/toolboxRecommendations';
import type { VocabularyItem } from '../types/analysis';
import type { CategoryCounts, VocabularyEntry } from '../types/toolbox';
import { PronunciationButton } from './PronunciationButton';

interface ToolboxStretchWordsProps {
  entries: VocabularyEntry[];
  counts: CategoryCounts;
  totalCount: number;
  isInToolbox: (lemma: string, partOfSpeech: string) => boolean;
  onAdd: (item: VocabularyItem) => void;
  /** Fixed list for demo playback — skips persisted dismiss state. */
  demoItems?: VocabularyItem[];
}

function refillVisible(
  current: VocabularyItem[],
  entries: VocabularyEntry[],
  counts: CategoryCounts,
  totalCount: number,
  readinessScore: number,
  dismissed: Set<string>,
): VocabularyItem[] {
  const excluded = new Set<string>([
    ...dismissed,
    ...current.map((item) => recommendationKey(item)),
  ]);

  const kept = current.filter((item) => {
    const key = recommendationKey(item);
    return !dismissed.has(key) && !entries.some((entry) => recommendationKey(entry) === key);
  });

  const next = [...kept];
  while (next.length < RECOMMENDATION_SLOT_COUNT) {
    const candidate = getNextToolboxRecommendation(
      entries,
      counts,
      totalCount,
      readinessScore,
      dismissed,
      new Set([...excluded, ...next.map((item) => recommendationKey(item))]),
    );
    if (!candidate) break;
    next.push(candidate);
    excluded.add(recommendationKey(candidate));
  }

  return next.slice(0, RECOMMENDATION_SLOT_COUNT);
}

export function ToolboxStretchWords({
  entries,
  counts,
  totalCount,
  isInToolbox,
  onAdd,
  demoItems,
}: ToolboxStretchWordsProps) {
  const readiness = useMemo(
    () => computePracticeReadiness(totalCount, counts),
    [totalCount, counts],
  );

  const [dismissed, setDismissed] = useState<Set<string>>(() =>
    demoItems ? new Set() : loadDismissedRecommendations(),
  );

  const [visible, setVisible] = useState<VocabularyItem[]>(() => {
    if (demoItems) return demoItems.slice(0, RECOMMENDATION_SLOT_COUNT);
    return rankToolboxRecommendations(
      entries,
      counts,
      totalCount,
      readiness.score,
      dismissed,
    );
  });

  useEffect(() => {
    if (demoItems) {
      setVisible(demoItems.slice(0, RECOMMENDATION_SLOT_COUNT));
      return;
    }

    setVisible((current) =>
      refillVisible(current, entries, counts, totalCount, readiness.score, dismissed),
    );
  }, [counts, demoItems, dismissed, entries, readiness.score, totalCount]);

  const displayed = visible.filter(
    (item) => !isInToolbox(item.lemma, item.partOfSpeech) && !dismissed.has(recommendationKey(item)),
  );

  const replaceSlot = useCallback(
    (removedKey: string, nextDismissed: Set<string>) => {
      if (demoItems) {
        setVisible((current) => {
          const withoutRemoved = current.filter((item) => recommendationKey(item) !== removedKey);
          const usedKeys = new Set(withoutRemoved.map((item) => recommendationKey(item)));
          const replacement = demoItems.find((item) => !usedKeys.has(recommendationKey(item)));
          if (!replacement) return withoutRemoved;
          return [...withoutRemoved, replacement].slice(0, RECOMMENDATION_SLOT_COUNT);
        });
        return;
      }

      setVisible((current) => {
        const withoutRemoved = current.filter((item) => recommendationKey(item) !== removedKey);
        const excluded = new Set([
          ...nextDismissed,
          ...withoutRemoved.map((item) => recommendationKey(item)),
        ]);
        const candidate = getNextToolboxRecommendation(
          entries,
          counts,
          totalCount,
          readiness.score,
          nextDismissed,
          excluded,
        );
        if (!candidate) return withoutRemoved;
        return [...withoutRemoved, candidate].slice(0, RECOMMENDATION_SLOT_COUNT);
      });
    },
    [counts, demoItems, entries, readiness.score, totalCount],
  );

  const handleAdd = (item: VocabularyItem) => {
    onAdd(item);
    replaceSlot(recommendationKey(item), dismissed);
  };

  const handleDismiss = (item: VocabularyItem) => {
    const key = recommendationKey(item);
    const nextDismissed = new Set(dismissed).add(key);
    setDismissed(nextDismissed);
    if (!demoItems) {
      saveDismissedRecommendations(nextDismissed);
    }
    replaceSlot(key, nextDismissed);
  };

  if (displayed.length === 0) {
    return (
      <section
        className="mt-l rounded-card bg-surface p-l shadow-card"
        aria-labelledby="toolbox-grow"
        data-demo-target="toolbox-recommendations"
      >
        <h2 id="toolbox-grow" className="text-lg font-semibold text-text-primary">
          {TOOLBOX_GROW_TITLE}
        </h2>
        <p className="mt-xs text-sm text-text-secondary">{TOOLBOX_GROW_EMPTY}</p>
      </section>
    );
  }

  return (
    <section
      className="mt-l rounded-card bg-surface p-l shadow-card"
      aria-labelledby="toolbox-grow"
      data-demo-target="toolbox-recommendations"
    >
      <h2 id="toolbox-grow" className="text-lg font-semibold text-text-primary">
        {TOOLBOX_GROW_TITLE}
      </h2>
      <p className="mt-xs text-sm text-text-primary">{TOOLBOX_GROW_TAGLINE}</p>
      <p className="mt-xs text-sm text-text-secondary">{TOOLBOX_GROW_BODY}</p>
      <ul className="mt-m space-y-s">
        {displayed.map((item, index) => {
          const key = recommendationKey(item);
          const isDemoHighlight = Boolean(demoItems) && index === 0;

          return (
            <li
              key={key}
              className="flex items-center gap-m rounded-button border border-border bg-background px-m py-s"
              data-demo-target={isDemoHighlight ? 'toolbox-recommendation-row' : undefined}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-s">
                  <p className="font-medium text-text-primary">{item.lemma}</p>
                  <PronunciationButton text={item.lemma} size="compact" ariaLabel={`Hear ${item.lemma}`} />
                </div>
                <p className="text-sm text-text-secondary">
                  {item.meaning}
                  <span className="text-text-secondary/70"> · {item.partOfSpeech}</span>
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-xs">
                <button
                  type="button"
                  onClick={() => handleDismiss(item)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-text-secondary transition-colors hover:bg-background hover:text-text-primary"
                  aria-label={`Skip ${item.lemma}`}
                  data-demo-target={isDemoHighlight ? 'toolbox-recommendation-skip' : undefined}
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleAdd(item)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-hover"
                  aria-label={`Add ${item.lemma} to toolbox`}
                  data-demo-target={isDemoHighlight ? 'toolbox-recommendation-add' : undefined}
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
