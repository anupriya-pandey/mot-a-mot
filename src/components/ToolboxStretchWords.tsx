import { Plus, RefreshCw, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  TOOLBOX_GROW_BODY,
  TOOLBOX_GROW_EMPTY,
  TOOLBOX_GROW_REFRESH,
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
  fillToolboxRecommendations,
  isRecommendationInToolbox,
  pruneDismissedRecommendations,
  recommendationKey,
} from '../lib/toolboxRecommendations';
import type { VocabularyItem } from '../types/analysis';
import type { CategoryCounts, VocabularyEntry } from '../types/toolbox';
import { PronunciationButton } from './PronunciationButton';

interface ToolboxStretchWordsProps {
  entries: VocabularyEntry[];
  counts: CategoryCounts;
  totalCount: number;
  onAdd: (item: VocabularyItem) => void;
  /** Fixed list for demo playback — skips persisted dismiss state. */
  demoItems?: VocabularyItem[];
}

export function ToolboxStretchWords({
  entries,
  counts,
  totalCount,
  onAdd,
  demoItems,
}: ToolboxStretchWordsProps) {
  const readiness = useMemo(
    () => computePracticeReadiness(totalCount, counts),
    [totalCount, counts],
  );

  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    if (demoItems) return new Set();
    return pruneDismissedRecommendations(loadDismissedRecommendations(), entries);
  });
  const [refreshExcluded, setRefreshExcluded] = useState<Set<string>>(() => new Set());

  const buildVisibleList = useCallback(
    (refreshBlock: Set<string>, slotBlocked: Set<string> = new Set()) => {
      if (demoItems) {
        return demoItems
          .filter((item) => !isRecommendationInToolbox(item, entries))
          .slice(0, RECOMMENDATION_SLOT_COUNT);
      }

      return fillToolboxRecommendations(
        entries,
        counts,
        totalCount,
        readiness.score,
        dismissed,
        new Set([...refreshBlock, ...slotBlocked]),
        RECOMMENDATION_SLOT_COUNT,
      );
    },
    [counts, demoItems, dismissed, entries, readiness.score, totalCount],
  );

  const [visible, setVisible] = useState<VocabularyItem[]>(() =>
    buildVisibleList(refreshExcluded),
  );

  useEffect(() => {
    if (!demoItems) {
      setDismissed((current) => {
        const pruned = pruneDismissedRecommendations(current, entries);
        if (pruned.size !== current.size) {
          saveDismissedRecommendations(pruned);
        }
        return pruned;
      });
    }
  }, [demoItems, entries]);

  useEffect(() => {
    setVisible(buildVisibleList(refreshExcluded));
  }, [buildVisibleList, refreshExcluded]);

  const handleRefresh = useCallback(() => {
    if (demoItems) {
      setVisible(buildVisibleList(new Set()));
      return;
    }

    const nextRefreshExcluded = new Set(visible.map((item) => recommendationKey(item)));
    let nextVisible = buildVisibleList(nextRefreshExcluded);

    if (nextVisible.length < RECOMMENDATION_SLOT_COUNT) {
      nextVisible = buildVisibleList(new Set());
    }

    setRefreshExcluded(nextRefreshExcluded);
    setVisible(nextVisible);
  }, [buildVisibleList, demoItems, visible]);

  const handleAdd = (item: VocabularyItem) => {
    const key = recommendationKey(item);
    onAdd(item);
    setVisible(buildVisibleList(refreshExcluded, new Set([key])));
  };

  const handleDismiss = (item: VocabularyItem) => {
    const key = recommendationKey(item);
    const nextDismissed = new Set(dismissed).add(key);
    setDismissed(nextDismissed);
    if (!demoItems) {
      saveDismissedRecommendations(nextDismissed);
    }
    setVisible(buildVisibleList(refreshExcluded, new Set([key])));
  };

  if (visible.length === 0) {
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
      <div className="flex flex-wrap items-start justify-between gap-s">
        <div>
          <h2 id="toolbox-grow" className="text-lg font-semibold text-text-primary">
            {TOOLBOX_GROW_TITLE}
          </h2>
          <p className="mt-xs text-sm text-text-primary">{TOOLBOX_GROW_TAGLINE}</p>
          <p className="mt-xs text-sm text-text-secondary">{TOOLBOX_GROW_BODY}</p>
        </div>
        {!demoItems && (
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-xs rounded-button border border-border px-m py-xs text-sm font-medium text-text-secondary transition-colors hover:bg-background hover:text-text-primary"
            aria-label={TOOLBOX_GROW_REFRESH}
            data-demo-target="toolbox-recommendation-refresh"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            {TOOLBOX_GROW_REFRESH}
          </button>
        )}
      </div>
      <ul className="mt-m space-y-s">
        {visible.map((item, index) => {
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
