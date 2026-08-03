import type { ImportExtractionResponse } from '../types/import';

export async function importToolbox(text: string): Promise<ImportExtractionResponse> {
  let response: Response;

  try {
    response = await fetch('/api/import-toolbox', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
  } catch {
    throw new Error(
      'Cannot reach the app server. Run .\\start-dev.cmd in Terminal, then open http://localhost:5173/',
    );
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Something went wrong.' }));
    throw new Error(error.message ?? 'Unable to analyze your import right now.');
  }

  return response.json();
}
