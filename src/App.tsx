import { useCallback, useState } from 'react';
import { analyzeFrench } from './api/analyzeFrench';
import { importToolbox } from './api/importToolbox';
import { normalizeAnalysisResult } from './lib/normalizeAnalysisResult';
import { applyConsistentRatings } from './lib/ratingsCache';
import { categorizeImportEntries } from './lib/categorizeImport';
import { AppTabs } from './components/AppTabs';
import { StatusBanner } from './components/StatusBanner';
import { IMPORT_LOADING_MESSAGES } from './constants/importMicrocopy';
import { ERRORS } from './constants/microcopy';
import { useFrenchToolbox } from './hooks/useFrenchToolbox';
import { useSearchHistory } from './hooks/useSearchHistory';
import { HistoryScreen } from './screens/HistoryScreen';
import { ImportReviewScreen, collectSelectedImportItems } from './screens/ImportReviewScreen';
import { ImportSuccessScreen } from './screens/ImportSuccessScreen';
import { ImportToolboxScreen } from './screens/ImportToolboxScreen';
import { LandingScreen } from './screens/LandingScreen';
import { LoadingScreen } from './screens/LoadingScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { VocabularyScreen } from './screens/VocabularyScreen';
import type {
  AnalysisResult,
  AppScreen,
  ClarificationInput,
  SentenceLanguage,
  VocabularyItem,
} from './types/analysis';
import type { AppTab, SearchHistoryEntry } from './types/history';
import type { ImportApplyResult, ImportReviewData } from './types/import';
import type { PartOfSpeech } from './types/toolbox';

type LoadingMode = 'analyze' | 'import';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('landing');
  const [activeTab, setActiveTab] = useState<AppTab>('check');
  const [sentence, setSentence] = useState('');
  const [displaySentence, setDisplaySentence] = useState('');
  const [sentenceLanguage, setSentenceLanguage] = useState<SentenceLanguage>('french');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClarifying, setIsClarifying] = useState(false);
  const [clarificationError, setClarificationError] = useState<string | null>(null);
  const [vocabularyCategory, setVocabularyCategory] = useState<PartOfSpeech | null>(null);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const [loadingMode, setLoadingMode] = useState<LoadingMode>('analyze');
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importReview, setImportReview] = useState<ImportReviewData | null>(null);
  const [importResult, setImportResult] = useState<ImportApplyResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const toolbox = useFrenchToolbox();
  const history = useSearchHistory();

  const applyAnalysis = useCallback(
    (
      analysis: AnalysisResult,
      options?: {
        display?: string;
        language?: SentenceLanguage;
        saveToHistory?: boolean;
        historyId?: string | null;
      },
    ) => {
      const shown = options?.display ?? sentence.trim();
      const language = options?.language ?? 'french';

      const consistentRatings = applyConsistentRatings(shown, language, analysis.ratings);
      const analysisWithConsistentRatings = { ...analysis, ratings: consistentRatings };

      setResult(analysisWithConsistentRatings);
      setDisplaySentence(shown);
      setSentenceLanguage(language);

      toolbox.addUserVocabulary(analysisWithConsistentRatings.userVocabulary ?? []);

      if (options?.saveToHistory === false) return;

      if (options?.historyId) {
        history.updateSearch(options.historyId, shown, sentence.trim(), analysisWithConsistentRatings, language);
        setCurrentHistoryId(options.historyId);
        return;
      }

      const id = history.saveSearch(shown, sentence.trim(), analysisWithConsistentRatings, language);
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
    setLoadingMode('analyze');
    setIsSubmitting(true);
    setScreen('loading');

    try {
      const analysis = normalizeAnalysisResult(await analyzeFrench({ sentence: trimmed }));
      applyAnalysis(analysis, { display: trimmed, language: 'french' });
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
      setLoadingMode('analyze');
      setScreen('loading');

      const clarifiedText = clarification.text.trim();
      const language: SentenceLanguage = clarification.mode === 'english' ? 'english' : 'french';

      try {
        const analysis = normalizeAnalysisResult(
          await analyzeFrench({ sentence: trimmed, clarification }),
        );
        applyAnalysis(analysis, {
          display: clarifiedText,
          language,
          historyId: currentHistoryId ?? undefined,
        });
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
    setDisplaySentence('');
    setSentenceLanguage('french');
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
    const normalized = normalizeAnalysisResult(entry.result);
    setSentence(entry.sourceSentence ?? entry.sentence);
    setDisplaySentence(entry.sentence);
    setSentenceLanguage(entry.sentenceLanguage ?? 'french');
    setResult(normalized);
    setCurrentHistoryId(entry.id);
    setError(null);
    setClarificationError(null);
    setActiveTab('history');
    setScreen('results');
  }, []);

  const handleAddToToolbox = useCallback(
    (item: VocabularyItem) => {
      toolbox.addSingleItem(item);
    },
    [toolbox],
  );

  const handleOpenImport = useCallback(() => {
    setImportError(null);
    setScreen('import');
  }, []);

  const handleAnalyzeImport = useCallback(async () => {
    const trimmed = importText.trim();
    if (!trimmed) return;

    setImportError(null);
    setLoadingMode('import');
    setScreen('loading');

    try {
      const { entries } = await importToolbox(trimmed);
      const review = categorizeImportEntries(entries, toolbox.entries);
      setImportReview(review);
      setScreen('import-review');
    } catch (err) {
      setScreen('import');
      setImportError(
        err instanceof Error && err.message ? err.message : ERRORS.aiRequestFailed,
      );
    }
  }, [importText, toolbox.entries]);

  const handleConfirmImport = useCallback(() => {
    if (!importReview) return;

    setIsImporting(true);
    const items = collectSelectedImportItems(importReview);
    const result = toolbox.applyImport(items);

    setImportResult({
      added: result.added,
      skipped: importReview.alreadyIn.length,
      totalEntries: result.totalEntries,
    });
    setIsImporting(false);
    setImportReview(null);
    setImportText('');
    setScreen('import-success');
  }, [importReview, toolbox]);

  const handleImportDone = useCallback(() => {
    setImportResult(null);
    setImportError(null);
    setScreen('landing');
    setActiveTab('check');
  }, []);

  const handleBackFromImport = useCallback(() => {
    setImportError(null);
    setScreen('landing');
  }, []);

  const handleBackFromImportReview = useCallback(() => {
    setScreen('import');
  }, []);

  if (screen === 'loading') {
    return (
      <LoadingScreen
        messages={loadingMode === 'import' ? IMPORT_LOADING_MESSAGES : undefined}
      />
    );
  }

  if (screen === 'import') {
    return (
      <ImportToolboxScreen
        text={importText}
        onTextChange={setImportText}
        onAnalyze={() => void handleAnalyzeImport()}
        onBack={handleBackFromImport}
        isSubmitting={false}
        error={importError}
      />
    );
  }

  if (screen === 'import-review' && importReview) {
    return (
      <ImportReviewScreen
        review={importReview}
        onReviewChange={setImportReview}
        onConfirm={handleConfirmImport}
        onBack={handleBackFromImportReview}
        isImporting={isImporting}
      />
    );
  }

  if (screen === 'import-success' && importResult) {
    return <ImportSuccessScreen result={importResult} onDone={handleImportDone} />;
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
          displaySentence={displaySentence}
          sentenceLanguage={sentenceLanguage}
          onCheckAnother={handleCheckAnother}
          onClarify={handleClarify}
          isClarifying={isClarifying}
          clarificationError={clarificationError}
          isInToolbox={toolbox.isInToolbox}
          onAddToToolbox={handleAddToToolbox}
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
        onImport={handleOpenImport}
      />
    </div>
  );
}
