import type { AnalysisResult } from './analysis';
import type { PartOfSpeech } from './toolbox';

export type PracticeStageId = 'quick' | 'sentence' | 'reading' | 'conversation';

export type PracticeExerciseType =
  | 'fill_blank'
  | 'match_meaning'
  | 'match_following'
  | 'find_error'
  | 'multiple_choice'
  | 'translation'
  | 'question_answer'
  | 'build_sentence';

export type PracticeFocusFilter = PartOfSpeech | 'all';

export interface PracticeOption {
  id: string;
  text: string;
}

export interface PracticeMatchRow {
  id: string;
  french: string;
}

export interface PracticePrompt {
  id: string;
  index: number;
  stage: PracticeStageId;
  type: PracticeExerciseType;
  title: string;
  instruction: string;
  /** Internal — used for scoring; not shown as hints to the learner */
  targetWords: string[];
  /** English hints that guide without revealing the answer */
  hints: string[];
  focusCategory?: PartOfSpeech;
  formFocus?: string;
  options?: PracticeOption[];
  matchRows?: PracticeMatchRow[];
  correctAnswer: string;
  explanation?: string;
  sentenceWithBlank?: string;
  flawedSentence?: string;
  englishPrompt?: string;
}

export interface PracticeSessionPlan {
  stage: PracticeStageId;
  focusCategory: PracticeFocusFilter;
  estimatedMinutes: string;
  prompts: PracticePrompt[];
}

export interface PracticeQuestionResult {
  prompt: PracticePrompt;
  userAnswer: string;
  correct: boolean;
  analysis?: AnalysisResult;
  wordsUsed: string[];
}

export interface PracticeSessionSummary {
  stage: PracticeStageId;
  completedCount: number;
  totalCount: number;
  correctCount: number;
  newWordsDiscovered: number;
  wordsStrengthened: number;
  questionResults: PracticeQuestionResult[];
}

export interface PracticeReflection {
  wordsUsed: string[];
  newExpression?: {
    lemma: string;
    meaning: string;
    partOfSpeech: string;
  };
}

export interface CreatePracticeSessionRequest {
  stage: PracticeStageId;
  focusCategory: PracticeFocusFilter;
  completedQuestionIds: string[];
}
