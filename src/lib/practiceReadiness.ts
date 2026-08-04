import type { CategoryCounts, PartOfSpeech } from '../types/toolbox';

/** Targets used by the readiness algorithm — adjust here without changing UX copy. */
export const READINESS_TARGETS = {
  entries: 25,
  categories: 5,
  verbs: 5,
  history: 10,
} as const;

export const READINESS_WEIGHTS = {
  entries: 0.4,
  categories: 0.3,
  verbs: 0.2,
  history: 0.1,
} as const;

/** Categories shown on the locked progress checklist. */
export const READINESS_CATEGORY_CHECKLIST: PartOfSpeech[] = [
  'Verbs',
  'Nouns',
  'Adjectives',
  'Pronouns',
  'Prepositions',
  'Adverbs',
];

export interface ReadinessFactor {
  score: number;
  current: number;
  target: number;
  label: string;
}

export interface PracticeReadiness {
  score: number;
  label: string;
  unlocked: boolean;
  factors: {
    entries: ReadinessFactor;
    categories: ReadinessFactor;
    verbs: ReadinessFactor;
    history: ReadinessFactor;
  };
  representedCategories: PartOfSpeech[];
  missingCategories: PartOfSpeech[];
}

function factorScore(current: number, target: number): number {
  if (target <= 0) return 100;
  return Math.min(100, Math.round((current / target) * 100));
}

function readinessLabel(score: number, unlocked: boolean): string {
  if (unlocked) return 'Ready to practice';
  if (score >= 85) return 'Almost ready';
  if (score >= 60) return 'Getting there';
  if (score >= 30) return 'Building your toolbox';
  return 'Just getting started';
}

function countRepresentedCategories(counts: CategoryCounts): PartOfSpeech[] {
  return READINESS_CATEGORY_CHECKLIST.filter((category) => (counts[category] ?? 0) > 0);
}

export function computePracticeReadiness(
  totalEntries: number,
  counts: CategoryCounts,
  historyCount: number,
): PracticeReadiness {
  const representedCategories = countRepresentedCategories(counts);
  const coreCategoryCount = representedCategories.length;

  const entriesFactor: ReadinessFactor = {
    label: 'Entries',
    current: totalEntries,
    target: READINESS_TARGETS.entries,
    score: factorScore(totalEntries, READINESS_TARGETS.entries),
  };

  const categoriesFactor: ReadinessFactor = {
    label: 'Category diversity',
    current: coreCategoryCount,
    target: READINESS_TARGETS.categories,
    score: factorScore(coreCategoryCount, READINESS_TARGETS.categories),
  };

  const verbsFactor: ReadinessFactor = {
    label: 'Verb coverage',
    current: counts.Verbs ?? 0,
    target: READINESS_TARGETS.verbs,
    score: factorScore(counts.Verbs ?? 0, READINESS_TARGETS.verbs),
  };

  const historyFactor: ReadinessFactor = {
    label: 'Sentence history',
    current: historyCount,
    target: READINESS_TARGETS.history,
    score: factorScore(historyCount, READINESS_TARGETS.history),
  };

  const score = Math.round(
    entriesFactor.score * READINESS_WEIGHTS.entries +
      categoriesFactor.score * READINESS_WEIGHTS.categories +
      verbsFactor.score * READINESS_WEIGHTS.verbs +
      historyFactor.score * READINESS_WEIGHTS.history,
  );

  const unlocked = score >= 100;

  const missingCategories = READINESS_CATEGORY_CHECKLIST.filter(
    (category) => !representedCategories.includes(category),
  );

  return {
    score,
    label: readinessLabel(score, unlocked),
    unlocked,
    factors: {
      entries: entriesFactor,
      categories: categoriesFactor,
      verbs: verbsFactor,
      history: historyFactor,
    },
    representedCategories,
    missingCategories,
  };
}

export function isStageUnlocked(
  stageId: string,
  totalEntries: number,
  readiness: PracticeReadiness,
): boolean {
  if (!readiness.unlocked || readiness.score < 100) return false;

  const stage = {
    quick: 15,
    sentence: 40,
    reading: 75,
    conversation: 150,
  }[stageId];

  if (stage === undefined) return false;
  return totalEntries >= stage;
}
