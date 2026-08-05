import type { FeedbackArea, FeedbackType } from '../types/feedback';

export const FEEDBACK_BUTTON = 'Feedback';

export const FEEDBACK_TITLE = 'Help Improve Mot-à-Mot';
export const FEEDBACK_INTRO =
  "Thanks for trying Mot-à-Mot! I'd love to hear about bugs, confusing experiences, or ideas that would make practicing French even better.";

export const FEEDBACK_TYPE_LABEL = 'What would you like to share?';
export const FEEDBACK_AREA_LABEL = 'Which part of the app?';
export const FEEDBACK_DESCRIPTION_LABEL = 'Tell me what happened';
export const FEEDBACK_AI_RESPONSE_LABEL = 'If this was an AI response, paste it here (optional)';
export const FEEDBACK_REPRO_LABEL = 'How can I reproduce it? (optional)';
export const FEEDBACK_SCREENSHOT_LABEL = 'Upload screenshot (optional)';
export const FEEDBACK_FEATURE_IDEA_LABEL = 'Your idea';
export const FEEDBACK_CONTACT_LABEL = 'Can I contact you if I need more details?';
export const FEEDBACK_EMAIL_LABEL = 'Email (optional)';

export const FEEDBACK_DESCRIPTION_PLACEHOLDER = `What were you trying to do?

What happened instead?

What did you expect to happen?`;

export const FEEDBACK_AI_RESPONSE_PLACEHOLDER =
  'Paste the sentence or AI response that looked incorrect.';

export const FEEDBACK_REPRO_PLACEHOLDER = `Tell me the steps that caused the issue.

Example:
Opened Check
Typed "Bonjour"
Clicked Check
The app froze`;

export const FEEDBACK_FEATURE_IDEA_PLACEHOLDER = 'What would make Mot-à-Mot better?';
export const FEEDBACK_EMAIL_PLACEHOLDER = 'If you\'d like a reply, leave your email.';

export const FEEDBACK_UPLOAD = 'Upload';
export const FEEDBACK_REMOVE_SCREENSHOT = 'Remove screenshot';
export const FEEDBACK_SCREENSHOT_HINT = 'PNG, JPG, or JPEG — up to 4 MB';
export const FEEDBACK_SUBMIT = 'Send Feedback';
export const FEEDBACK_SENDING = 'Sending…';
export const FEEDBACK_CLOSE = 'Close';

export const FEEDBACK_SUCCESS_TITLE = 'Thank You!';
export const FEEDBACK_SUCCESS_BODY =
  'Thank you for helping improve Mot-à-Mot 🇫🇷\nYour feedback has been sent.';
export const FEEDBACK_FOOTER_NOTE =
  'Mot-à-Mot is an active personal project. Every piece of feedback helps improve it. Thank you for being part of its journey.';

export const FEEDBACK_TYPE_OPTIONS: { id: FeedbackType; label: string }[] = [
  { id: 'bug_report', label: 'Bug Report' },
  { id: 'feature_idea', label: 'Feature Idea' },
  { id: 'ui_ux', label: 'UI / UX Feedback' },
  { id: 'incorrect_french', label: 'Incorrect French or AI Response' },
  { id: 'other', label: 'Other' },
];

export const FEEDBACK_AREA_OPTIONS: { id: FeedbackArea; label: string }[] = [
  { id: 'check', label: 'Check' },
  { id: 'toolbox', label: 'Toolbox' },
  { id: 'practice', label: 'Practice' },
  { id: 'history', label: 'History' },
  { id: 'general', label: 'General' },
  { id: 'not_sure', label: 'Not Sure' },
];

export const FEEDBACK_CONTACT_OPTIONS = [
  { id: 'yes', label: 'Yes' },
  { id: 'no', label: 'No' },
] as const;

export const FEEDBACK_ERRORS = {
  typeRequired: 'Please choose a feedback type.',
  descriptionRequired: 'Please tell us what happened.',
  featureIdeaRequired: 'Please share your feature idea.',
  emailRequired: 'Please enter your email if we may contact you.',
  emailInvalid: 'Please enter a valid email address.',
  screenshotType: 'Screenshot must be a PNG or JPG file.',
  screenshotSize: 'Screenshot must be smaller than 4 MB.',
  submitFailed: "We couldn't send your feedback right now. Please try again.",
} as const;
