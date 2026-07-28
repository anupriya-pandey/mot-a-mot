import { useCallback, useState } from 'react';
import { analyzeFrench } from './api/analyzeFrench';
import { AppTabs } from './components/AppTabs';
import { StatusBanner } from './components/StatusBanner';
import { ERRORS } from './constants/microcopy';
import { useFrenchToolbox } from './hooks/useFrenchToolbox';
import { useSearchHistory } from './hooks/useSearchHistory';
import { HistoryScreen } from './screens/HistoryScreen';
import { LandingScreen } from './screens/LandingScreen';
import { LoadingScreen } from './screens/LoadingScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { VocabularyScreen } from './screens/VocabularyScreen';
import type { AnalysisResult, AppScreen, ClarificationInput } from './types/analysis';
import type { AppTab, SearchHistoryEntry } from './types/history';
import type { PartOfSpeech } from './types/toolbox';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('landing');
  const [activeTab, setActiveTab] = useState<AppTab>('check');
  const [sentence, setSentence] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClarifying, setIsClarifying] = useState(false);
  const [clarificationError, setClarificationError] = useState<string | null>(null);
  const [vocabularyCategory, setVocabularyCategory] = useState<PartOfSpeech | null>(null);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);

  const toolbox = useFrenchToolbox();
  const history = useSearchHistory();

  const applyAnalysis = useCallback(
    (
      analysis: AnalysisResult,
      options?: {
        addToToolbox?: boolean;
        saveToHistory?: boolean;
        historyId?: string | null;
      },
    ) => {
      const trimmed = sentence.trim();
      setResult(analysis);

      if (options?.addToToolbox !== false) {
        toolbox.addFromAnalysis(analysis.vocabulary);
      }

      if (options?.saveToHistory === false) return;

      if (options?.historyId) {
        history.updateSearch(options.historyId, trimmed, analysis);
        setCurrentHistoryId(options.historyId);
        return;
      }

      const id = history.saveSearch(trimmed, analysis);
      setCurrentHistoryId(id);
    },
    [history, sentence, toolbox],
  );

  const handleSubmit = useCallback(async () => {
    const trimmed = sentence.trim();
    if (!trimmed) return;

    setError(null);
    setClarificationError(null);
    setCurrentHistoryId(null);
    setIsSubmitting(true);
    setScreen('loading');

    try {
      const analysis = await analyzeFrench({ sentence: trimmed });
      applyAnalysis(analysis);
      setActiveTab('check');
      setScreen('results');
    } catch (err) {
      setScreen('landing');
      setActiveTab('check');
      setError(err instanceof Error && err.message ? err.message : ERRORS.aiRequestFailed);
    } finally {
      setIsSubmitting(false);
    }
  }, [applyAnalysis, sentence]);

  const handleClarify = useCallback(
    async (clarification: ClarificationInput): Promise<boolean> => {
      const trimmed = sentence.trim();
      if (!trimmed) return false;

      setClarificationError(null);
      setIsClarifying(true);
      setScreen('loading');

      try {
        const analysis = await analyzeFrench({ sentence: trimmed, clarification });
        applyAnalysis(analysis, { historyId: currentHistoryId ?? undefined });
        setScreen('results');
        return true;
      } catch (err) {
        setScreen('results');
        setClarificationError(
          err instanceof Error && err.message ? err.message : ERRORS.clarificationFailed,
        );
        return false;
      } finally {
        setIsClarifying(false);
      }
    },
    [applyAnalysis, currentHistoryId, sentence],
  );

  const handleCheckAnother = useCallback(() => {
    setSentence('');
    setResult(null);
    setError(null);
    setClarificationError(null);
    setCurrentHistoryId(null);
    setActiveTab('check');
    setScreen('landing');
  }, []);

  const handleSelectCategory = useCallback((category: PartOfSpeech) => {
    setVocabularyCategory(category);
    setScreen('vocabulary');
  }, []);

  const handleBackFromVocabulary = useCallback(() => {
    setVocabularyCategory(null);
    setScreen('landing');
    setActiveTab('check');
  }, []);

  const handleTabChange = useCallback((tab: AppTab) => {
    setActiveTab(tab);
    setError(null);
    setClarificationError(null);

    if (tab === 'history') {
      setScreen('history');
      return;
    }

    setScreen('landing');
  }, []);

  const handleOpenHistoryEntry = useCallback((entry: SearchHistoryEntry) => {
    setSentence(entry.sentence);
    setResult(entry.result);
    setCurrentHistoryId(entry.id);
    setError(null);
    setClarificationError(null);
    setActiveTab('history');
    setScreen('results');
  }, []);

  if (screen === 'loading') {
    return <LoadingScreen />;
  }

  if (screen === 'vocabulary' && vocabularyCategory) {
    return (
      <VocabularyScreen
        category={vocabularyCategory}
        entries={toolbox.getByCategory(vocabularyCategory)}
        onBack={handleBackFromVocabulary}
      />
    );
  }

  const showTabs = screen === 'landing' || screen === 'history' || screen === 'results';

  if (screen === 'results' && result) {
    return (
      <div className="min-h-screen">
        {showTabs && <AppTabs active={activeTab} onChange={handleTabChange} />}
        <ResultsScreen
          result={result}
          originalSentence={sentence.trim()}
          onCheckAnother={handleCheckAnother}
          onClarify={handleClarify}
          isClarifying={isClarifying}
          clarificationError={clarificationError}
        />
      </div>
    );
  }

  if (screen === 'history') {
    return (
      <div className="min-h-screen">
        <AppTabs active={activeTab} onChange={handleTabChange} />
        <HistoryScreen entries={history.entries} onSelectEntry={handleOpenHistoryEntry} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {error && (
        <div className="fixed left-0 right-0 top-m z-10 mx-auto max-w-content px-m">
          <StatusBanner type="error" message={error} />
        </div>
      )}
      {showTabs && <AppTabs active={activeTab} onChange={handleTabChange} />}
      <LandingScreen
        sentence={sentence}
        onSentenceChange={setSentence}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        toolboxCounts={toolbox.counts}
        toolboxTotal={toolbox.totalCount}
        onSelectCategory={handleSelectCategory}
      />
    </div>
  );
}
