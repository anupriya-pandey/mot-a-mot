import type { GradePracticeExerciseRequest, PracticeExerciseGrading } from '../types/practice';

export async function gradePracticeExercise(
  request: GradePracticeExerciseRequest,
): Promise<PracticeExerciseGrading> {
  let response: Response;

  try {
    response = await fetch('/api/practice-grade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  } catch {
    throw new Error(
      'Cannot reach the app server. Run .\\start-dev.cmd in Terminal, then open http://localhost:5173/',
    );
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Something went wrong.' }));
    throw new Error(error.message ?? 'Unable to grade your answer right now.');
  }

  return response.json();
}
