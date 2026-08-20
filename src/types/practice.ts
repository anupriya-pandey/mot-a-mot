import type { AnalysisResult } from './analysis';
import type { PartOfSpeech } from './toolbox';

export type PracticeStageId = 'quick' | 'sentence' | 'reading' | 'conversation';

export type PracticeExerciseType =
  | 'fill_blank'
  | 'match_meaning'
  | 'match_following'
  | 'find_error'
  | 'find_errors_multi'
  | 'multiple_choice'
  | 'noun_gender'
  | 'mcq_conjugation'
  | 'mcq_verb_meaning'
  | 'mcq_pronoun'
  | 'mcq_determiner'
  | 'mcq_meaning'
  | 'mcq_grammar'
  | 'mcq_expression'
  | 'adjective_transform'
  | 'translation'
  | 'question_answer'
  | 'build_sentence';

export const PRACTICE_SESSION_LENGTHS = [5, 10, 15, 20, 25, 30] as const;
export type PracticeSessionLength = (typeof PRACTICE_SESSION_LENGTHS)[number];

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
  /** Other valid written answers for fill-in-the-blank (e.g. car and parce que) */
  acceptableAnswers?: string[];
  explanation?: string;
  sentenceWithBlank?: string;
  flawedSentence?: string;
  /** Multi-line passage for find-all-errors questions */
  flawedPassage?: string;
  /** All-or-nothing multi-select (comma-separated option ids in correctAnswer) */
  multiSelect?: boolean;
  englishPrompt?: string;
  /** French word or sentence the learner must respond to — required for match/mc/fill types */
  frenchPrompt?: string;
}

export interface PracticeSessionPlan {
  stage: PracticeStageId;
  focusCategory: PracticeFocusFilter;
  estimatedMinutes: string;
  prompts: PracticePrompt[];
  requestedCount?: number;
  generatedCount?: number;
  sessionNotice?: string;
}

export interface PracticeExerciseGrading {
  meaning: number;
  grammar: number;
  vocabulary: number;
  naturalness: number;
  overall: number;
  confidence: number;
  feedback: string;
  suggestedAnswer: string;
  headline: string;
  acceptedAlternatives: string[];
}

export interface PracticeQuestionResult {
  prompt: PracticePrompt;
  userAnswer: string;
  /** @deprecated Prefer score — true when score is 1 (quick) or overall ≥ 0.95 (writing) */
  correct: boolean;
  /** 0–1 per exercise; writing uses structured AI grading */
  score: number;
  grading?: PracticeExerciseGrading;
  analysis?: AnalysisResult;
  wordsUsed: string[];
}

export interface GradePracticeExerciseRequest {
  sentence: string;
  practicePrompt: {
    title: string;
    instruction: string;
    targetWords: string[];
    englishPrompt?: string;
    frenchPrompt?: string;
    type?: PracticeExerciseType;
  };
}

export interface PracticeQuestionFeedback {
  correct?: boolean;
  userAnswer: string;
  correctAnswer?: string;
  explanation?: string;
  grading?: PracticeExerciseGrading;
}

export interface PracticeSessionSummary {
  stage: PracticeStageId;
  completedCount: number;
  totalCount: number;
  /** Sum of per-question scores; unanswered questions count as 0 toward totalCount */
  totalScore: number;
  correctCount: number;
  endedEarly?: boolean;
  toolboxWordsReinforced: number;
  categoriesPracticed: number;
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
  questionCount?: PracticeSessionLength;
}
