import type { PracticePrompt } from '../types/practice';

/** Stable id for deduplicating practice questions across sessions. */
export function buildQuestionFingerprint(
  type: string,
  focusCategory: string | undefined,
  targetWords: string[],
  title: string,
): string {
  const words = [...targetWords].map((word) => word.trim().toLowerCase()).sort().join('|');
  const category = (focusCategory ?? 'mixed').trim().toLowerCase();
  const label = title.trim().toLowerCase();
  return `${type}::${category}::${words}::${label}`;
}

export function ensurePromptId(prompt: PracticePrompt): PracticePrompt {
  if (prompt.id?.trim()) return prompt;

  return {
    ...prompt,
    id: buildQuestionFingerprint(
      prompt.type,
      prompt.focusCategory,
      prompt.targetWords,
      prompt.title,
    ),
  };
}
