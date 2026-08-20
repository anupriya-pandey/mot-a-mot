import type {
  CreatePracticeSessionRequest,
  PracticeSessionPlan,
} from '../types/practice';
import type { VocabularyEntry } from '../types/toolbox';
import { getAllSurfaceForms } from '../lib/vocabForms';

export async function createPracticeSession(
  toolboxEntries: VocabularyEntry[],
  options: CreatePracticeSessionRequest,
): Promise<PracticeSessionPlan> {
  let response: Response;

  try {
    response = await fetch('/api/practice-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toolboxEntries: toolboxEntries.map((entry) => ({
          lemma: entry.lemma,
          meaning: entry.meaning,
          partOfSpeech: entry.partOfSpeech,
          surfaces: getAllSurfaceForms(entry),
          adjectiveForms: entry.adjectiveForms,
          nounGenderForms: entry.nounGenderForms,
        })),
        stage: options.stage,
        focusCategory: options.focusCategory,
        questionCount: options.questionCount,
        completedQuestionIds: options.completedQuestionIds,
      }),
    });
  } catch {
    throw new Error(
      'Cannot reach the app server. Run .\\start-dev.cmd in Terminal, then open http://localhost:5173/',
    );
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Something went wrong.' }));
    throw new Error(error.message ?? 'Unable to create your practice session right now.');
  }

  return response.json();
}
