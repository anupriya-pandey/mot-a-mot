import type { PracticeExerciseGrading, PracticePrompt, PracticeQuestionFeedback } from '../types/practice';
import { detectWordsUsed } from './practiceHelpers';

/** Convert a 0–1 component score to a 5-star display count. */
export function componentToStarCount(value: number): number {
  return Math.max(0, Math.min(5, Math.round(value * 5)));
}

export function formatStarRating(value: number): string {
  const filled = componentToStarCount(value);
  return `${'★'.repeat(filled)}${'☆'.repeat(5 - filled)}`;
}

export function scoreHeadline(overall: number): string {
  if (overall >= 0.95) return 'Great job!';
  if (overall >= 0.8) return 'Nice work!';
  if (overall >= 0.6) return 'Good effort!';
  return 'Keep practicing!';
}

export function buildQuestionResultFromFeedback(
  prompt: PracticePrompt,
  feedback: PracticeQuestionFeedback,
): {
  prompt: PracticePrompt;
  userAnswer: string;
  correct: boolean;
  score: number;
  grading?: PracticeExerciseGrading;
  wordsUsed: string[];
} {
  if (feedback.grading) {
    const score = feedback.grading.overall;
    const wordsUsed = detectWordsUsed(feedback.userAnswer, prompt.targetWords);
    return {
      prompt,
      userAnswer: feedback.userAnswer,
      correct: score >= 0.95,
      score,
      grading: feedback.grading,
      wordsUsed,
    };
  }

  const correct = Boolean(feedback.correct);
  return {
    prompt,
    userAnswer: feedback.userAnswer,
    correct,
    score: correct ? 1 : 0,
    wordsUsed: correct ? prompt.targetWords : [],
  };
}
