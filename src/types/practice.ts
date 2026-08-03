import type { AnalysisResult } from './analysis';

export interface PracticePrompt {
  index: number;
  title: string;
  instruction: string;
  targetWords: string[];
}

export interface PracticeSessionPlan {
  estimatedMinutes: string;
  prompts: PracticePrompt[];
}

export interface PracticeQuestionResult {
  prompt: PracticePrompt;
  userSentence: string;
  analysis: AnalysisResult;
  wordsUsed: string[];
}

export interface PracticeSessionSummary {
  completedCount: number;
  totalCount: number;
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
