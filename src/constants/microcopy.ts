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

export const HISTORY_EMPTY =
  'No searches yet.\nCheck a French sentence — your history will appear here.';
export const TOOLBOX_EMPTY =
  'Your French Toolbox is empty.\nStart checking sentences to build your vocabulary.';

export const VOICE_HINT =
  'Click the mic, wait until it turns blue, then speak your French sentence right away.';
export const VOICE_LISTENING = 'Listening… speak your French sentence now.';
