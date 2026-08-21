import { useCallback, useEffect, useRef, useState } from 'react';
import { ERRORS } from '../constants/microcopy';
import { playListeningStartSound, prepareListeningSound } from '../lib/listeningSound';
import { mergeSpeechResults } from '../lib/speechTranscriptMerge';

type SpeechRecognitionCtor = new () => SpeechRecognition;
type MicPermissionState = PermissionState | 'unsupported' | 'unknown';
type MicAccessResult =
  | { ok: true; stream: MediaStream | null }
  | { ok: false; reason: 'denied' | 'no-device' | 'in-use' | 'unsupported' | 'insecure' };

const LISTEN_TIMEOUT_MS = 12000;
const SILENCE_AUTO_STOP_MS = 2000;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  const win = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null;
}

function mapSpeechError(errorCode: SpeechRecognitionErrorEvent['error']): string {
  switch (errorCode) {
    case 'not-allowed':
    case 'service-not-allowed':
      return ERRORS.voiceMicDeniedReset;
    case 'audio-capture':
      return ERRORS.voiceNoMic;
    case 'network':
      return ERRORS.voiceNetwork;
    case 'language-not-supported':
      return ERRORS.voiceLanguage;
    case 'no-speech':
      return ERRORS.voiceTranscription;
    case 'aborted':
      return '';
    default:
      return ERRORS.voiceTranscription;
  }
}

type MicAccessFailureReason = Extract<MicAccessResult, { ok: false }>['reason'];

function mapMicAccessFailure(reason: MicAccessFailureReason): string {
  switch (reason) {
    case 'denied':
      return ERRORS.voiceMicDeniedReset;
    case 'no-device':
      return ERRORS.voiceNoMic;
    case 'in-use':
      return 'Your microphone is in use by another app. Close other apps using the mic and try again.';
    case 'insecure':
      return ERRORS.voiceInsecure;
    case 'unsupported':
      return ERRORS.voiceUnsupported;
    default:
      return ERRORS.voiceMicBlocked;
  }
}

async function queryMicrophonePermission(): Promise<MicPermissionState> {
  if (!navigator.permissions?.query) return 'unsupported';

  try {
    const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    return result.state;
  } catch {
    return 'unsupported';
  }
}

async function openMicrophone(): Promise<MicAccessResult> {
  if (!window.isSecureContext) {
    return { ok: false, reason: 'insecure' };
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    return { ok: false, reason: 'unsupported' };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
    return { ok: true, stream };
  } catch (error) {
    const name = error instanceof DOMException ? error.name : '';

    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      return { ok: false, reason: 'denied' };
    }
    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
      return { ok: false, reason: 'no-device' };
    }
    if (name === 'NotReadableError' || name === 'TrackStartError') {
      return { ok: false, reason: 'in-use' };
    }

    return { ok: false, reason: 'denied' };
  }
}

export function useSpeechRecognition(onTranscript: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [permissionState, setPermissionState] = useState<MicPermissionState>('unknown');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onTranscriptRef = useRef(onTranscript);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const listenTimeoutRef = useRef<number | null>(null);
  const gotResultRef = useRef(false);
  const userStoppedRef = useRef(false);
  const isRetryingRef = useRef(false);
  const sessionTranscriptRef = useRef('');
  const hasCommittedRef = useRef(false);
  const silenceTimeoutRef = useRef<number | null>(null);

  onTranscriptRef.current = onTranscript;

  useEffect(() => {
    setIsSupported(Boolean(getSpeechRecognition()));
    void queryMicrophonePermission().then(setPermissionState);

    return () => {
      if (listenTimeoutRef.current) window.clearTimeout(listenTimeoutRef.current);
      if (silenceTimeoutRef.current) window.clearTimeout(silenceTimeoutRef.current);
      micStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const clearListenTimeout = useCallback(() => {
    if (listenTimeoutRef.current) {
      window.clearTimeout(listenTimeoutRef.current);
      listenTimeoutRef.current = null;
    }
  }, []);

  const clearSilenceTimeout = useCallback(() => {
    if (silenceTimeoutRef.current) {
      window.clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
  }, []);

  const releaseMicrophone = useCallback(() => {
    micStreamRef.current?.getTracks().forEach((track) => track.stop());
    micStreamRef.current = null;
  }, []);

  const stop = useCallback(() => {
    userStoppedRef.current = true;
    clearListenTimeout();
    clearSilenceTimeout();
    recognitionRef.current?.stop();
    setIsListening(false);
    setInterimTranscript('');
    releaseMicrophone();
  }, [clearListenTimeout, clearSilenceTimeout, releaseMicrophone]);

  const beginRecognition = useCallback(
    (attempt: number) => {
      const SpeechRecognitionClass = getSpeechRecognition();
      if (!SpeechRecognitionClass) return;

      sessionTranscriptRef.current = '';
      hasCommittedRef.current = false;

      const recognition = new SpeechRecognitionClass();
      recognition.lang = 'fr-FR';
      recognition.interimResults = true;
      recognition.continuous = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setInterimTranscript('');
        playListeningStartSound();
        clearListenTimeout();
        clearSilenceTimeout();
        listenTimeoutRef.current = window.setTimeout(() => {
          userStoppedRef.current = true;
          recognition.stop();
        }, LISTEN_TIMEOUT_MS);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = mergeSpeechResults(event.results);
        sessionTranscriptRef.current = transcript;

        if (transcript) {
          setInterimTranscript(transcript);
          setError(null);
        }

        clearSilenceTimeout();
        if (transcript) {
          silenceTimeoutRef.current = window.setTimeout(() => {
            userStoppedRef.current = true;
            recognition.stop();
          }, SILENCE_AUTO_STOP_MS);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === 'aborted') return;

        if (event.error === 'no-speech' && attempt < 2 && !gotResultRef.current) {
          isRetryingRef.current = true;
          try {
            recognition.stop();
          } catch {
            // ignore stop errors during retry handoff
          }
          window.setTimeout(() => {
            isRetryingRef.current = false;
            beginRecognition(attempt + 1);
          }, 400);
          return;
        }

        clearListenTimeout();
        clearSilenceTimeout();
        setIsListening(false);
        setInterimTranscript('');
        releaseMicrophone();

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setPermissionState('denied');
        }

        const message = mapSpeechError(event.error);
        if (message) setError(message);
      };

      recognition.onend = () => {
        clearListenTimeout();
        clearSilenceTimeout();
        setIsListening(false);
        setInterimTranscript('');
        releaseMicrophone();

        if (isRetryingRef.current) return;
        if (hasCommittedRef.current) return;

        const committed = sessionTranscriptRef.current.trim();
        if (committed) {
          hasCommittedRef.current = true;
          gotResultRef.current = true;
          setError(null);
          onTranscriptRef.current(committed);
          return;
        }

        if (!gotResultRef.current && !userStoppedRef.current) {
          setError(ERRORS.voiceTranscription);
        }
      };

      recognitionRef.current = recognition;

      try {
        recognition.start();
      } catch {
        setError(ERRORS.voiceTranscription);
        setIsListening(false);
        releaseMicrophone();
      }
    },
    [clearListenTimeout, clearSilenceTimeout, releaseMicrophone],
  );

  const start = useCallback(async () => {
    const SpeechRecognitionClass = getSpeechRecognition();
    if (!SpeechRecognitionClass) {
      setError(ERRORS.voiceUnsupported);
      return;
    }

    setError(null);
    setInterimTranscript('');
    prepareListeningSound();
    gotResultRef.current = false;
    userStoppedRef.current = false;
    isRetryingRef.current = false;
    hasCommittedRef.current = false;

    if (permissionState === 'denied') {
      setError(ERRORS.voiceMicDeniedReset);
      return;
    }

    if (permissionState !== 'granted') {
      setIsRequestingPermission(true);
      const micAccess = await openMicrophone();
      setIsRequestingPermission(false);

      if (!micAccess.ok) {
        if (micAccess.reason === 'denied') setPermissionState('denied');
        setError(mapMicAccessFailure(micAccess.reason));
        return;
      }

      micStreamRef.current = micAccess.stream;
      setPermissionState('granted');
    }

    beginRecognition(1);
  }, [beginRecognition, permissionState]);

  return {
    isListening,
    isRequestingPermission,
    isSupported,
    permissionState,
    interimTranscript,
    error,
    start,
    stop,
  };
}
