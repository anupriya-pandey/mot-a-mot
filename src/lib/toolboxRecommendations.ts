import {
  TOOLBOX_RECOMMENDATION_POOL,
  type RecommendationTier,
  type ToolboxRecommendationCandidate,
} from '../constants/toolboxRecommendationPool';
import { READINESS_CATEGORY_CHECKLIST } from './practiceReadiness';
import { normalizePartOfSpeech } from './toolboxStorage';
import type { VocabularyItem } from '../types/analysis';
import type { CategoryCounts, PartOfSpeech, VocabularyEntry } from '../types/toolbox';

export const RECOMMENDATION_SLOT_COUNT = 10;

export function recommendationKey(item: Pick<VocabularyItem, 'lemma' | 'partOfSpeech'>): string {
  const pos = normalizePartOfSpeech(item.partOfSpeech) ?? item.partOfSpeech.trim();
  return `${item.lemma.trim().toLowerCase()}|${pos}`;
}

function normalizeLemma(lemma: string): string {
  return lemma.trim().toLowerCase();
}

/** True when the lemma is already saved — matches lemma, surfaces, and POS-normalized keys. */
export function isRecommendationInToolbox(
  item: Pick<VocabularyItem, 'lemma' | 'partOfSpeech'>,
  entries: VocabularyEntry[],
): boolean {
  const targetLemma = normalizeLemma(item.lemma);
  const targetKey = recommendationKey(item);

  return entries.some((entry) => {
    if (recommendationKey(entry) === targetKey) return true;
    if (normalizeLemma(entry.lemma) === targetLemma) return true;
    return entry.surfaces.some((surface) => normalizeLemma(surface) === targetLemma);
  });
}

function buildToolboxBlockKeys(entries: VocabularyEntry[]): Set<string> {
  const blocked = new Set<string>();
  for (const entry of entries) {
    blocked.add(recommendationKey(entry));
    blocked.add(normalizeLemma(entry.lemma));
    for (const surface of entry.surfaces) {
      blocked.add(normalizeLemma(surface));
    }
  }
  return blocked;
}

export function inferRecommendationTier(totalCount: number, readinessScore: number): RecommendationTier {
  if (totalCount < 8 || readinessScore < 25) return 1;
  if (totalCount < 25 || readinessScore < 70) return 2;
  return 3;
}

function toVocabularyItem(candidate: ToolboxRecommendationCandidate): VocabularyItem {
  return {
    lemma: candidate.lemma,
    surface: candidate.surface,
    meaning: candidate.meaning,
    partOfSpeech: candidate.partOfSpeech,
    example: candidate.example,
  };
}

function averageCategoryCount(counts: CategoryCounts): number {
  const values = Object.values(counts).filter((count) => count > 0);
  if (values.length === 0) return 0;
  return values.reduce((sum, count) => sum + count, 0) / values.length;
}

function scoreCandidate(
  candidate: ToolboxRecommendationCandidate,
  counts: CategoryCounts,
  tier: RecommendationTier,
  missingCategories: PartOfSpeech[],
  avgCount: number,
): number {
  let score = 0;
  const category = candidate.partOfSpeech;

  if (missingCategories.includes(category)) score += 120;
  if ((counts[category] ?? 0) === 0) score += 80;

  const categoryCount = counts[category] ?? 0;
  if (avgCount > 0 && categoryCount < avgCount) {
    score += Math.round((avgCount - categoryCount) * 8);
  }

  if (candidate.tier === tier) score += 40;
  else if (candidate.tier === tier - 1) score += 20;
  else if (candidate.tier === tier + 1) score += 10;
  else score -= 30;

  if (READINESS_CATEGORY_CHECKLIST.includes(category)) score += 12;

  return score;
}

function isBlocked(
  candidate: ToolboxRecommendationCandidate,
  blockedKeys: Set<string>,
): boolean {
  const key = recommendationKey(candidate);
  if (blockedKeys.has(key)) return true;
  return blockedKeys.has(normalizeLemma(candidate.lemma));
}

interface RankOptions {
  blockDismissed?: boolean;
  tierOffset?: number;
}

function rankToolboxRecommendationsInternal(
  entries: VocabularyEntry[],
  counts: CategoryCounts,
  totalCount: number,
  readinessScore: number,
  dismissed: Set<string>,
  excludedKeys: Set<string> = new Set(),
  limit = RECOMMENDATION_SLOT_COUNT,
  { blockDismissed = true, tierOffset = 1 }: RankOptions = {},
): VocabularyItem[] {
  const tier = inferRecommendationTier(totalCount, readinessScore);
  const toolboxKeys = buildToolboxBlockKeys(entries);
  const blocked = new Set([
    ...toolboxKeys,
    ...(blockDismissed ? dismissed : []),
    ...excludedKeys,
  ]);

  const missingCategories = READINESS_CATEGORY_CHECKLIST.filter(
    (category) => (counts[category] ?? 0) === 0,
  );
  const avgCount = averageCategoryCount(counts);

  const eligible = TOOLBOX_RECOMMENDATION_POOL.filter(
    (candidate) => !isBlocked(candidate, blocked) && candidate.tier <= tier + tierOffset,
  );

  const scored = eligible
    .map((candidate) => ({
      candidate,
      score: scoreCandidate(candidate, counts, tier, missingCategories, avgCount),
    }))
    .sort((a, b) => b.score - a.score || a.candidate.lemma.localeCompare(b.candidate.lemma, 'fr'));

  const picked: ToolboxRecommendationCandidate[] = [];
  const usedKeys = new Set<string>();

  for (const missing of missingCategories) {
    if (picked.length >= limit) break;
    const match = scored.find(
      ({ candidate }) =>
        candidate.partOfSpeech === missing && !usedKeys.has(recommendationKey(candidate)),
    );
    if (match) {
      picked.push(match.candidate);
      usedKeys.add(recommendationKey(match.candidate));
    }
  }

  for (const { candidate } of scored) {
    if (picked.length >= limit) break;
    const key = recommendationKey(candidate);
    if (usedKeys.has(key)) continue;
    picked.push(candidate);
    usedKeys.add(key);
  }

  return picked.slice(0, limit).map(toVocabularyItem);
}

export function rankToolboxRecommendations(
  entries: VocabularyEntry[],
  counts: CategoryCounts,
  totalCount: number,
  readinessScore: number,
  dismissed: Set<string>,
  excludedKeys: Set<string> = new Set(),
  limit = RECOMMENDATION_SLOT_COUNT,
): VocabularyItem[] {
  return rankToolboxRecommendationsInternal(
    entries,
    counts,
    totalCount,
    readinessScore,
    dismissed,
    excludedKeys,
    limit,
    { blockDismissed: true, tierOffset: 1 },
  );
}

/** Fill up to `limit` recommendations, recycling dismissed words only when needed. */
export function fillToolboxRecommendations(
  entries: VocabularyEntry[],
  counts: CategoryCounts,
  totalCount: number,
  readinessScore: number,
  dismissed: Set<string>,
  excludedKeys: Set<string> = new Set(),
  limit = RECOMMENDATION_SLOT_COUNT,
): VocabularyItem[] {
  const result: VocabularyItem[] = [];
  const usedKeys = new Set<string>();

  const mergeBatch = (batch: VocabularyItem[]) => {
    for (const item of batch) {
      const key = recommendationKey(item);
      if (usedKeys.has(key) || isRecommendationInToolbox(item, entries)) continue;
      usedKeys.add(key);
      result.push(item);
      if (result.length >= limit) break;
    }
  };

  const nextExcluded = () =>
    new Set([...excludedKeys, ...result.map((item) => recommendationKey(item))]);

  mergeBatch(
    rankToolboxRecommendationsInternal(
      entries,
      counts,
      totalCount,
      readinessScore,
      dismissed,
      nextExcluded(),
      limit,
      { blockDismissed: true, tierOffset: 1 },
    ),
  );

  if (result.length < limit) {
    mergeBatch(
      rankToolboxRecommendationsInternal(
        entries,
        counts,
        totalCount,
        readinessScore,
        dismissed,
        nextExcluded(),
        limit - result.length,
        { blockDismissed: false, tierOffset: 1 },
      ),
    );
  }

  if (result.length < limit) {
    mergeBatch(
      rankToolboxRecommendationsInternal(
        entries,
        counts,
        totalCount,
        readinessScore,
        dismissed,
        nextExcluded(),
        limit - result.length,
        { blockDismissed: false, tierOffset: 2 },
      ),
    );
  }

  return result.slice(0, limit);
}

export function getNextToolboxRecommendation(
  entries: VocabularyEntry[],
  counts: CategoryCounts,
  totalCount: number,
  readinessScore: number,
  dismissed: Set<string>,
  excludedKeys: Set<string>,
): VocabularyItem | null {
  return (
    fillToolboxRecommendations(
      entries,
      counts,
      totalCount,
      readinessScore,
      dismissed,
      excludedKeys,
      1,
    )[0] ?? null
  );
}
