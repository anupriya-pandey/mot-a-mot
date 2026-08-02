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
  'No searches yet.\nCheck a French sentence — your history will appear here.';
export const TOOLBOX_EMPTY =
  'Your French Toolbox is empty.\nStart checking sentences to build your vocabulary.';

export const VOICE_HINT =
  'Tap the mic — you\'ll hear a short chime when it\'s ready, then speak your French sentence.';
export const VOICE_LISTENING = 'Listening… speak now.';
export const NEW_VOCAB_HINT =
  'See a word you do not recognise in the suggestions below? Scroll to Add to your French toolkit at the bottom of this page — tap + to save words with their English meanings.';
export const SAME_AS_PREVIOUS_STYLE =
  'Same as {style} — already the most natural written version at this style.';
export const PARTIAL_MEANING_AT_LEVEL =
  'Part of your meaning could not fit this writing style — see the note below.';
export const NO_CHANGE_FORMAL_PHRASE = 'No change needed for this writing style.';
