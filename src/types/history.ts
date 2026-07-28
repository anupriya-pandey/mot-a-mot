import type { AnalysisResult } from './analysis';

export interface SearchHistoryEntry {
  id: string;
  sentence: string;
  result: AnalysisResult;
  createdAt: string;
}

export type AppTab = 'check' | 'history';
