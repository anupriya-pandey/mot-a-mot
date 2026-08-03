import type { AnalysisResult, VocabularyItem } from '../types/analysis';
import type { PracticePrompt, PracticeQuestionResult, PracticeReflection } from '../types/practice';

function normalizeWord(word: string): string {
  return word.trim().toLowerCase();
}

export function detectWordsUsed(sentence: string, targetWords: string[]): string[] {
  const lowerSentence = sentence.toLowerCase();
  return targetWords.filter((word) => lowerSentence.includes(normalizeWord(word)));
}

export function buildPracticeReflection(
  prompt: PracticePrompt,
  userSentence: string,
  analysis: AnalysisResult,
  isInToolbox: (lemma: string, partOfSpeech: string) => boolean,
): PracticeReflection {
  const wordsUsed = detectWordsUsed(userSentence, prompt.targetWords);
  const firstNew = (analysis.suggestedAdditions ?? []).find(
    (item) => !isInToolbox(item.lemma, item.partOfSpeech),
  );

  return {
    wordsUsed,
    newExpression: firstNew
      ? {
          lemma: firstNew.lemma,
          meaning: firstNew.meaning,
          partOfSpeech: firstNew.partOfSpeech,
        }
      : undefined,
  };
}

export function computeSessionSummary(
  questionResults: PracticeQuestionResult[],
  isInToolbox: (lemma: string, partOfSpeech: string) => boolean,
): {
  newWordsDiscovered: number;
  wordsStrengthened: number;
} {
  const strengthened = new Set<string>();
  const discovered = new Set<string>();

  for (const result of questionResults) {
    for (const word of result.wordsUsed) {
      strengthened.add(normalizeWord(word));
    }

    for (const item of result.analysis.suggestedAdditions ?? []) {
      const key = `${normalizeWord(item.lemma)}|${item.partOfSpeech.toLowerCase()}`;
      if (!isInToolbox(item.lemma, item.partOfSpeech)) {
        discovered.add(key);
      }
    }
  }

  return {
    newWordsDiscovered: discovered.size,
    wordsStrengthened: strengthened.size,
  };
}

export function pickNewExpressionForAdd(
  analysis: AnalysisResult,
  isInToolbox: (lemma: string, partOfSpeech: string) => boolean,
): VocabularyItem | null {
  return (
    (analysis.suggestedAdditions ?? []).find(
      (item) => !isInToolbox(item.lemma, item.partOfSpeech),
    ) ?? null
  );
}
