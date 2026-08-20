/** UX-spec microcopy and error messages */

export const ERRORS = {
  emptyInput: 'Please enter or speak a sentence in French.',
  voiceTranscription: "We couldn't hear that clearly. Please try again or type your sentence.",
  voiceMicBlocked:
    'Microphone access was blocked. Click the lock icon in your browser address bar, allow the microphone, then try again.',
  voiceMicDeniedReset:
    'Microphone access is blocked for this site. In Chrome/Edge: click the lock icon next to the address bar → Site settings → Microphone → Allow. Then refresh the page.',
  voiceMicRequesting: 'Allow microphone access in the browser popup, then speak your French sentence.',
  voiceInsecure:
    'Microphone needs a secure connection. Open the app at http://localhost:5173/ in Chrome or Edge (not a preview panel).',
  voiceNoMic:
    'No microphone detected. Check that a mic is connected and selected in Windows Settings → System → Sound.',
  voiceNetwork:
    'Voice input needs an internet connection. Chrome and Edge send audio to Google for transcription.',
  voiceUnsupported:
    'Voice input works best in Chrome or Edge. Try one of those browsers, or type your sentence.',
  voiceLanguage:
    'French voice input is not supported in this browser. Try Chrome or Edge, or type your sentence.',
  aiRequestFailed: "We couldn't check your sentence right now. Please try again.",
  clarificationFailed: "We couldn't update your correction right now. Please try again.",
  clarificationEmpty: 'Please tell us what you intended to say.',
  copyFailed: 'Unable to copy. Please try again.',
} as const;

export const SCORES_ENGLISH_CLARIFICATION =
  'Grammar and naturalness scores apply to French writing only. You clarified your meaning in English, so both scores are 0.';
export const SCORES_FRENCH_NOTE =
  'These ratings score what you wrote — not the corrected versions above.';
export const HISTORY_EMPTY =
  'No practice history yet.\nCheck a French sentence — your past corrections will appear here.';
export const HISTORY_SUBTITLE = 'Past corrections and analyses from your practice.';
export const TOOLBOX_TAB_SUBTITLE = 'Everything you know — your personal French reference.';
export const TOOLBOX_DESCRIPTION =
  'Your personal collection of French entries — words, expressions, and phrases you want to remember.';
export const TOOLBOX_METHOD_PRACTICE =
  'As you practice — check a sentence and the vocabulary from what you wrote is saved automatically; tap + on your results to add new entries from the corrected versions too.';
export const TOOLBOX_METHOD_IMPORT =
  'From your notes — import class lists, textbook pages, or pasted notes to add many entries at once.';
export const TOOLBOX_EMPTY = 'No entries yet — your toolbox will grow as you check sentences and import notes.';
export const TOOLBOX_GROW_TITLE = '🌱 Grow Your Toolbox';
export const TOOLBOX_GROW_TAGLINE = 'Discover French that fits what you already know.';
export const TOOLBOX_GROW_BODY =
  'Based on your current vocabulary, here are 10 words worth adding next.';
export const TOOLBOX_GROW_REFRESH = 'Refresh suggestions';
export const TOOLBOX_GROW_EMPTY =
  'You\'ve reviewed every word we had for now. Keep checking sentences and importing notes — new picks will appear as your toolbox grows.';

export const VOICE_HINT =
  'Tap the mic — you\'ll hear a short chime when it\'s ready, then speak your French sentence.';
export const VOICE_LISTENING = 'Listening… speak now.';
export const NEW_VOCAB_HINT =
  'See an entry you do not recognise in the suggestions below? Scroll to Add to your French toolkit at the bottom of this page — tap + to save entries with their English meanings.';
export const PARTIAL_MEANING_AT_LAYER =
  'Part of your meaning could not fit at this layer — see the note below.';
export const NO_CHANGE_AT_LAYER = 'No change needed at this layer.';
export const CHANGE_CARRIES_FROM_LAYER = (label: string) =>
  `Same wording as ${label} — the improvement from what you wrote still applies here.`;

export const SHOW_ORIGINAL_SENTENCE = 'Show my original sentence';

export const HIDE_ORIGINAL_SENTENCE = 'Hide my original sentence';

export const COMPARE_WITH_ORIGINAL = 'Compare with my original sentence';

export const HIDE_ORIGINAL_COMPARISON = 'Hide sentence comparison';

export const YOUR_ORIGINAL_LABEL = 'Your original';

export const STYLE_VERSION_LABEL = (styleLabel: string) => `${styleLabel} version`;
