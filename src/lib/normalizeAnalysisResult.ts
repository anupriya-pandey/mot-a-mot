import {
  WRITING_STYLES,
  type WritingStyle,
} from '../constants/writingStyles';
import type {
  AnalysisResult,
  CorrectionChange,
  StyleSuggestion,
  VocabularyItem,
  WritingByStyle,
} from '../types/analysis';

type LegacyAnalysisResult = AnalysisResult & {
  vocabulary?: VocabularyItem[];
  suggestions?: {
    informal?: { sentence: string; english?: string };
    formal?: { sentence: string };
    byLevel?: Record<string, StyleSuggestion & { limitation?: string }>;
    speaking?: { sentence: string; english?: string };
    writing?: WritingByStyle;
  };
  explanations?: AnalysisResult['explanations'] & {
    informal?: string;
    formal?: string;
    byLevel?: Record<string, string>;
    speaking?: string;
    writing?: Record<WritingStyle, string>;
  };
};

const LEGACY_LEVEL_TO_STYLE: Record<string, WritingStyle> = {
  A1: 'simple',
  A2: 'simple',
  B1: 'natural',
  B2: 'natural',
  C1: 'refined',
  C2: 'refined',
};

function isCompleteWriting(writing: Partial<WritingByStyle> | undefined): writing is WritingByStyle {
  return Boolean(writing && WRITING_STYLES.every((style) => writing[style]?.sentence?.trim()));
}

function migrateLegacyByLevel(
  byLevel: Record<string, StyleSuggestion & { limitation?: string }>,
): WritingByStyle {
  const pick = (style: WritingStyle) => {
    const entry = Object.entries(LEGACY_LEVEL_TO_STYLE).find(([, mapped]) => mapped === style);
    const level = entry?.[0] ?? 'A1';
    const source = byLevel[level];
    return {
      sentence: source?.sentence?.trim() ?? '',
      english: source?.english,
      explanation: source?.limitation?.trim() || 'Saved from an earlier version with DELF levels.',
      sameAsPrevious: false,
      coversFullMeaning: source?.coversFullMeaning !== false,
      note: source?.limitation,
    } satisfies StyleSuggestion;
  };

  const writing = Object.fromEntries(WRITING_STYLES.map((style) => [style, pick(style)])) as WritingByStyle;

  if (writing.natural && writing.simple) {
    writing.natural.sameAsPrevious =
      writing.natural.sentence.trim().toLowerCase() === writing.simple.sentence.trim().toLowerCase();
  }
  if (writing.refined && writing.natural) {
    writing.refined.sameAsPrevious =
      writing.refined.sentence.trim().toLowerCase() === writing.natural.sentence.trim().toLowerCase();
  }

  return writing;
}

function migrateLegacyChanges(changes: CorrectionChange[] | undefined): CorrectionChange[] {
  return (changes ?? []).map((change) => {
    if (change.byStyle && WRITING_STYLES.every((style) => style in change.byStyle)) {
      return {
        ...change,
        speakingFrench: change.speakingFrench || change.informalFrench || '',
      };
    }

    const legacyByLevel = change.byLevel;
    if (!legacyByLevel) {
      return change;
    }

    const byStyle = Object.fromEntries(
      WRITING_STYLES.map((style) => {
        const levelEntry = Object.entries(LEGACY_LEVEL_TO_STYLE).find(([, mapped]) => mapped === style);
        const level = levelEntry?.[0] ?? 'A1';
        return [style, legacyByLevel[level] ?? ''];
      }),
    ) as Record<WritingStyle, string>;

    return {
      youWrote: change.youWrote,
      speakingFrench: change.speakingFrench || change.informalFrench || '',
      speakingExplanation: change.speakingExplanation || change.informalExplanation,
      byStyle,
      explanationsByStyle: change.explanationsByStyle,
    };
  });
}

function buildLegacyWriting(formalSentence: string): WritingByStyle {
  const base: StyleSuggestion = {
    sentence: formalSentence,
    explanation: 'Saved from an earlier version. Check a new sentence for speaking + writing styles.',
    sameAsPrevious: false,
  };

  return {
    simple: base,
    natural: { ...base, sameAsPrevious: true },
    refined: { ...base, sameAsPrevious: true },
  };
}

export function normalizeAnalysisResult(result: LegacyAnalysisResult): AnalysisResult {
  const speaking =
    result.suggestions?.speaking ??
    (result.suggestions?.informal
      ? {
          sentence: result.suggestions.informal.sentence,
          english: result.suggestions.informal.english,
        }
      : undefined);

  const writing = isCompleteWriting(result.suggestions?.writing)
    ? result.suggestions.writing
    : result.suggestions?.byLevel
      ? migrateLegacyByLevel(result.suggestions.byLevel)
      : result.suggestions?.formal?.sentence
        ? buildLegacyWriting(result.suggestions.formal.sentence)
        : undefined;

  const speakingExplanation =
    result.explanations?.speaking ??
    result.explanations?.informal ??
    result.explanations?.formal ??
    '';

  const writingExplanations = result.explanations?.writing
    ? result.explanations.writing
    : result.explanations?.byLevel
      ? (Object.fromEntries(
          WRITING_STYLES.map((style) => {
            const levelEntry = Object.entries(LEGACY_LEVEL_TO_STYLE).find(([, mapped]) => mapped === style);
            const level = levelEntry?.[0] ?? 'A1';
            return [style, result.explanations?.byLevel?.[level] ?? ''];
          }),
        ) as Record<WritingStyle, string>)
      : writing
        ? (Object.fromEntries(WRITING_STYLES.map((style) => [style, writing[style].explanation])) as Record<
            WritingStyle,
            string
          >)
        : undefined;

  if (!speaking?.sentence?.trim() || !writing || !writingExplanations) {
    throw new Error('Analysis result is missing suggestions.');
  }

  return {
    ...result,
    suggestions: { speaking, writing },
    changes: migrateLegacyChanges(result.changes),
    explanations: {
      speaking: speakingExplanation,
      writing: writingExplanations,
    },
    userVocabulary: result.userVocabulary ?? result.vocabulary ?? [],
    suggestedAdditions: result.suggestedAdditions ?? [],
  };
}
