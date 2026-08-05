import { FEEDBACK_ERRORS } from '../constants/feedbackMicrocopy';
import type { FeedbackRequest } from '../types/feedback';

export async function submitFeedback(request: FeedbackRequest): Promise<void> {
  let response: Response;

  try {
    response = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  } catch {
    throw new Error(FEEDBACK_ERRORS.submitFailed);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: FEEDBACK_ERRORS.submitFailed }));
    throw new Error(error.message ?? FEEDBACK_ERRORS.submitFailed);
  }
}
