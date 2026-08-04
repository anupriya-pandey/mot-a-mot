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

/** Unique toolbox target words from questions answered correctly. */
export function getReinforcedWords(result: PracticeQuestionResult): string[] {
  if (!result.correct) return [];
  if (isProductionExercise(result.prompt.type)) {
    return result.wordsUsed.length > 0 ? result.wordsUsed : result.prompt.targetWords;
  }
  return result.prompt.targetWords;
}

export function computeSessionSummary(
  questionResults: PracticeQuestionResult[],
  resolveCategory?: (lemma: string) => string | undefined,
): {
  toolboxWordsReinforced: number;
  categoriesPracticed: number;
  correctCount: number;
} {
  const reinforced = new Set<string>();
  const categories = new Set<string>();
  let correctCount = 0;

  for (const result of questionResults) {
    if (result.correct) correctCount += 1;

    let categoryFromWords = false;
    for (const word of result.prompt.targetWords ?? []) {
      const category = resolveCategory?.(word);
      if (category) {
        categories.add(category);
        categoryFromWords = true;
      }
    }

    if (!categoryFromWords && result.prompt.focusCategory) {
      categories.add(result.prompt.focusCategory);
    }

    for (const word of getReinforcedWords(result)) {
      reinforced.add(normalizeWord(word));
    }
  }

  return {
    toolboxWordsReinforced: reinforced.size,
    categoriesPracticed: categories.size,
    correctCount,
  };
}

export function isProductionExercise(type: string): boolean {
  return type === 'translation' || type === 'question_answer' || type === 'build_sentence';
}

export function isQuickExercise(type: string): boolean {
  return !isProductionExercise(type);
}

export function gradePracticeAnswer(userAnswer: string, prompt: PracticePrompt): boolean {
  if (prompt.type === 'match_following') {
    return gradeMatchFollowing(userAnswer, prompt);
  }
  return answersMatch(userAnswer, prompt.correctAnswer);
}

function gradeMatchFollowing(userAnswer: string, prompt: PracticePrompt): boolean {
  try {
    const user = JSON.parse(userAnswer) as Record<string, string>;
    const correct = JSON.parse(prompt.correctAnswer) as Record<string, string>;
    if (!prompt.matchRows?.length) return false;
    return prompt.matchRows.every((row) => user[row.id] === correct[row.id]);
  } catch {
    return false;
  }
}

export function normalizePracticeAnswer(answer: string): string {
  return answer.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function answersMatch(userAnswer: string, correctAnswer: string): boolean {
  const normalizedUser = normalizePracticeAnswer(userAnswer);
  const normalizedCorrect = normalizePracticeAnswer(correctAnswer);

  if (normalizedUser === normalizedCorrect) return true;

  if (normalizedUser === correctAnswer.trim().toLowerCase()) return true;

  return false;
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

export function getCorrectAnswerDisplay(prompt: PracticePrompt): string {
  if (prompt.type === 'match_following') {
    try {
      const map = JSON.parse(prompt.correctAnswer) as Record<string, string>;
      return (
        prompt.matchRows
          ?.map((row) => {
            const optionId = map[row.id];
            const meaning = prompt.options?.find((option) => option.id === optionId)?.text;
            return `${row.french} → ${meaning ?? optionId}`;
          })
          .join(' · ') ?? prompt.correctAnswer
      );
    } catch {
      return prompt.correctAnswer;
    }
  }

  const match = prompt.options?.find((option) => option.id === prompt.correctAnswer);
  return match?.text ?? prompt.correctAnswer;
}
