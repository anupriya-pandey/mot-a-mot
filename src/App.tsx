import { useCallback, useState } from 'react';
import { analyzeFrench } from './api/analyzeFrench';
import { ERRORS } from './constants/microcopy';
import { LandingScreen } from './screens/LandingScreen';
import { LoadingScreen } from './screens/LoadingScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { StatusBanner } from './components/StatusBanner';
import type { AnalysisResult, AppScreen } from './types/analysis';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('landing');
  const [sentence, setSentence] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    const trimmed = sentence.trim();
    if (!trimmed) return;

    setError(null);
    setIsSubmitting(true);
    setScreen('loading');

    try {
      const analysis = await analyzeFrench(trimmed);
      setResult(analysis);
      setScreen('results');
    } catch (err) {
      setScreen('landing');
      setError(err instanceof Error && err.message ? err.message : ERRORS.aiRequestFailed);
    } finally {
      setIsSubmitting(false);
    }
  }, [sentence]);

  const handleCheckAnother = useCallback(() => {
    setSentence('');
    setResult(null);
    setError(null);
    setScreen('landing');
  }, []);

  if (screen === 'loading') {
    return <LoadingScreen />;
  }

  if (screen === 'results' && result) {
    return (
      <ResultsScreen
        result={result}
        originalSentence={sentence.trim()}
        onCheckAnother={handleCheckAnother}
      />
    );
  }

  return (
    <>
      {error && (
        <div className="fixed left-0 right-0 top-m z-10 mx-auto max-w-content px-m">
          <StatusBanner type="error" message={error} />
        </div>
      )}
      <LandingScreen
        sentence={sentence}
        onSentenceChange={setSentence}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
