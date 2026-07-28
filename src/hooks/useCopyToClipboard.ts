import { useCallback, useState } from 'react';
import { ERRORS } from '../constants/microcopy';

export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copy = useCallback(async (text: string): Promise<boolean> => {
    setError(null);

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      return true;
    } catch {
      setError(ERRORS.copyFailed);
      return false;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { copied, error, copy, clearError };
}
