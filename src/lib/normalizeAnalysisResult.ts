import { CEFR_LEVELS, type CefrLevel } from '../constants/cefrLevels';
import type {
  AnalysisResult,
  CorrectionChange,
  FormalByLevel,
  LevelSuggestion,
  VocabularyItem,
} from '../types/analysis';

type LegacyAnalysisResult = AnalysisResult & {
  vocabulary?: VocabularyItem[];
  suggestions?: AnalysisResult['suggestions'] & {
    formal?: { sentence: string };
  };
  explanations?: AnalysisResult['explanations'] & {
    formal?: string;
  };
};

function buildLegacyByLevel(formalSentence: string): FormalByLevel {
  const legacyNote =
    'This result was saved before level breakdown was available. Check a new sentence to see A1–C2 versions.';

  return Object.fromEntries(
    CEFR_LEVELS.map((level) => [
      level,
      { sentence: formalSentence, limitation: legacyNote } satisfies LevelSuggestion,
    ]),
  ) as FormalByLevel;
}

function isCompleteByLevel(byLevel: Partial<FormalByLevel> | undefined): byLevel is FormalByLevel {
  return Boolean(byLevel && CEFR_LEVELS.every((level) => byLevel[level]?.sentence?.trim()));
}

function hasCompleteExplanationsByLevel(
  explanationsByLevel: Partial<Record<CefrLevel, string>> | undefined,
): explanationsByLevel is Record<CefrLevel, string> {
  return Boolean(
    explanationsByLevel &&
      CEFR_LEVELS.every((level) => typeof explanationsByLevel[level] === 'string'),
  );
}

function emptyExplanationsByLevel(): Record<CefrLevel, string> {
  return Object.fromEntries(CEFR_LEVELS.map((level) => [level, ''])) as Record<CefrLevel, string>;
}

function buildLegacyExplanationsByLevel(formalExplanation: string): Record<CefrLevel, string> {
  return Object.fromEntries(CEFR_LEVELS.map((level) => [level, formalExplanation])) as Record<
    CefrLevel,
    string
  >;
}

function normalizeChanges(changes: AnalysisResult['changes'] | undefined): CorrectionChange[] {
  return (changes ?? [])
    .map((change) => {
      if (change.byLevel && CEFR_LEVELS.every((level) => change.byLevel[level]?.trim())) {
        return change;
      }

      const legacyFormal = change.formalFrench?.trim();
      if (!change.youWrote?.trim() || !change.informalFrench?.trim() || !legacyFormal) {
        return null;
      }

      return {
        youWrote: change.youWrote.trim(),
        informalFrench: change.informalFrench.trim(),
        byLevel: Object.fromEntries(CEFR_LEVELS.map((level) => [level, legacyFormal])) as Record<
          CefrLevel,
          string
        >,
      };
    })
    .filter((change): change is CorrectionChange => change !== null);
}

export function normalizeAnalysisResult(result: LegacyAnalysisResult): AnalysisResult {
  const legacyFormal = result.suggestions?.formal?.sentence;
  const legacyFormalExplanation = result.explanations?.formal;

  const byLevel = isCompleteByLevel(result.suggestions?.byLevel)
    ? result.suggestions.byLevel
    : legacyFormal
      ? buildLegacyByLevel(legacyFormal)
      : undefined;

  const explanationsByLevel = hasCompleteExplanationsByLevel(result.explanations?.byLevel)
    ? result.explanations.byLevel
    : legacyFormalExplanation
      ? buildLegacyExplanationsByLevel(legacyFormalExplanation)
      : isCompleteByLevel(byLevel)
        ? emptyExplanationsByLevel()
        : undefined;

  if (!byLevel || !explanationsByLevel) {
    throw new Error('Analysis result is missing formal suggestions.');
  }

  return {
    ...result,
    suggestions: {
      informal: result.suggestions.informal,
      byLevel,
    },
    changes: normalizeChanges(result.changes),
    explanations: {
      informal: result.explanations.informal,
      byLevel: explanationsByLevel,
    },
    userVocabulary: result.userVocabulary ?? result.vocabulary ?? [],
    suggestedAdditions: result.suggestedAdditions ?? [],
  };
}
