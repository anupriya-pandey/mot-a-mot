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

/** Known equivalent answers for fill-in-the-blank grading. */
const EQUIVALENT_FILL_ANSWER_GROUPS = [
  ['parce que', "parce qu'", 'car'],
  ['cependant', 'pourtant'],
  ['donc', 'alors'],
];

function expandEquivalentAnswers(answers: string[]): string[] {
  const normalized = new Set(answers.map(normalizePracticeAnswer));

  for (const group of EQUIVALENT_FILL_ANSWER_GROUPS) {
    const normalizedGroup = group.map(normalizePracticeAnswer);
    if (normalizedGroup.some((value) => normalized.has(value))) {
      normalizedGroup.forEach((value) => normalized.add(value));
    }
  }

  return [...normalized];
}

export function getAcceptedFillAnswers(prompt: PracticePrompt): string[] {
  const answers = [prompt.correctAnswer, ...(prompt.acceptableAnswers ?? []), ...(prompt.targetWords ?? [])];
  return expandEquivalentAnswers(answers.filter(Boolean));
}

export function gradePracticeAnswer(userAnswer: string, prompt: PracticePrompt): boolean {
  if (prompt.type === 'match_following') {
    return gradeMatchFollowing(userAnswer, prompt);
  }
  if (prompt.type === 'fill_blank') {
    return getAcceptedFillAnswers(prompt).some((answer) => answersMatch(userAnswer, answer));
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

export function sanitizeFrenchDisplayText(text: string): string {
  return text
    .trim()
    .split(/\n+/)[0]
    .trim()
    .replace(/\([^)]*\b(?:wait|check|toolbox|hint|note|error|agreement|form)\b[^)]*\)/gi, '')
    .replace(/\s*\([A-Za-z][^)]*\)/g, (match) => (/[àâäéèêëïîôùûüçœæ]/i.test(match) ? match : ''))
    .replace(/\s+/g, ' ')
    .trim();
}

const GENERIC_PRACTICE_HINT =
  'Think about meaning and grammar — hints describe the idea, not the exact French word.';

export function isGenericPracticeHintText(hint: string): boolean {
  return (
    hint === GENERIC_PRACTICE_HINT ||
    /hints describe the idea/i.test(hint) ||
    hint.length < 12
  );
}

export function sanitizeFillBlankSentence(text: string): string {
  let value = sanitizeFrenchDisplayText(text);

  const leakIndex = value.search(
    /\s+(?:___\s+is the|Hint\s*:|Explanation\s*:|The verb is|The correct form|first person singular)/i,
  );
  if (leakIndex > 0) {
    value = value.slice(0, leakIndex).trim();
  }

  value = value.replace(
    /\s*\([^)]*(?:form|tense|person|indicative|conjugat|present|singular|plural|je form|tu form|verb)[^)]*\)/gi,
    '',
  );

  const blankSentence = value.match(/[^.!?]*___[^.!?]*[.!?]?/);
  if (blankSentence) {
    value = blankSentence[0].trim();
  }

  return value.replace(/\s+/g, ' ').trim();
}

export function getDisplayHints(hints: string[] | undefined): string[] {
  return (hints ?? []).filter((hint) => !isGenericPracticeHintText(hint));
}

function parseChangeFix(text: string): { from: string; to: string } | null {
  const match = text.match(/change\s+'([^']+)'\s+to\s+'([^']+)'/i);
  return match ? { from: match[1], to: match[2] } : null;
}

export function answersMatch(userAnswer: string, correctAnswer: string): boolean {
  const normalizedUser = normalizePracticeAnswer(userAnswer);
  const normalizedCorrect = normalizePracticeAnswer(correctAnswer);

  if (normalizedUser === normalizedCorrect) return true;

  if (normalizedUser === correctAnswer.trim().toLowerCase()) return true;

  const elisionUser = normalizedUser.replace(/parce qu'$/, 'parce que');
  const elisionCorrect = normalizedCorrect.replace(/parce qu'$/, 'parce que');
  if (elisionUser === elisionCorrect) return true;

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

  if (prompt.type === 'find_error' && prompt.flawedSentence) {
    const sentence = sanitizeFrenchDisplayText(prompt.flawedSentence);
    const match = prompt.options?.find((option) => option.id === prompt.correctAnswer);
    const fix = match?.text ? parseChangeFix(match.text) : null;
    if (fix) {
      return sentence.replace(new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), fix.to);
    }
  }

  if (prompt.type === 'fill_blank') {
    const uniqueAnswers = [...new Set(getAcceptedFillAnswers(prompt))];
    if (uniqueAnswers.length > 1) {
      return uniqueAnswers.join(' or ');
    }
  }

  const match = prompt.options?.find((option) => option.id === prompt.correctAnswer);
  return match?.text ?? prompt.correctAnswer;
}
