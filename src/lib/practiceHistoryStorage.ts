import type { PracticePrompt, PracticeStageId } from '../types/practice';

const STORAGE_KEY = 'mot-a-mot-practice-history-v1';
const MAX_COMPLETED = 500;

export interface CompletedPracticeQuestion {
  id: string;
  stage: PracticeStageId;
  type: string;
  completedAt: string;
}

function loadCompleted(): CompletedPracticeQuestion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CompletedPracticeQuestion[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCompleted(entries: CompletedPracticeQuestion[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_COMPLETED)));
}

export function getCompletedQuestionIds(): string[] {
  return loadCompleted().map((entry) => entry.id);
}

export function markQuestionCompleted(prompt: PracticePrompt, stage: PracticeStageId): void {
  const entry: CompletedPracticeQuestion = {
    id: prompt.id,
    stage,
    type: prompt.type,
    completedAt: new Date().toISOString(),
  };

  const existing = loadCompleted().filter((item) => item.id !== entry.id);
  saveCompleted([entry, ...existing]);
}

export function isQuestionCompleted(id: string): boolean {
  return loadCompleted().some((entry) => entry.id === id);
}
