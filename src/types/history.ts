import type { AnalysisResult, SentenceLanguage } from './analysis';

export interface SearchHistoryEntry {
  id: string;
  /** What the user sees on the results screen */
  sentence: string;
  /** Original French sent to the API (for re-clarification) */
  sourceSentence: string;
  sentenceLanguage?: SentenceLanguage;
  result: AnalysisResult;
  createdAt: string;
}

export type AppTab = 'check' | 'toolbox' | 'history';
