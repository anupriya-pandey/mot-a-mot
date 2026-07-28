import type { AnalysisResult } from '../types/analysis';

export async function analyzeFrench(sentence: string): Promise<AnalysisResult> {
  let response: Response;

  try {
    response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sentence }),
    });
  } catch {
    throw new Error(
      'Cannot reach the app server. Run .\\start-dev.cmd in Terminal, then open http://localhost:5173/',
    );
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Something went wrong.' }));
    throw new Error(error.message ?? 'Unable to analyze your sentence right now.');
  }

  return response.json();
}
