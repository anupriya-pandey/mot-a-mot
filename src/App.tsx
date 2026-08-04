import { useCallback, useState } from 'react';
import { analyzeFrench } from './api/analyzeFrench';
import { gradePracticeExercise } from './api/gradePracticeExercise';
import { createPracticeSession } from './api/createPracticeSession';
import { importToolbox } from './api/importToolbox';
import { normalizeAnalysisResult } from './lib/normalizeAnalysisResult';
import { applyConsistentRatings } from './lib/ratingsCache';
import { categorizeImportEntries } from './lib/categorizeImport';
import {
  computeSessionSummary,
  getCorrectAnswerDisplay,
  gradePracticeAnswer,
  isProductionExercise,
} from './lib/practiceHelpers';
import { buildQuestionResultFromFeedback } from './lib/practiceGradingDisplay';
import { markQuestionCompleted, getCompletedQuestionIds } from './lib/practiceHistoryStorage';
import { computePracticeReadiness } from './lib/practiceReadiness';
import { PRACTICE_STAGES } from './constants/practiceStages';
import { AppTabs } from './components/AppTabs';
import { StatusBanner } from './components/StatusBanner';
import { IMPORT_LOADING_MESSAGES } from './constants/importMicrocopy';
import { PRACTICE_LOADING_MESSAGES } from './constants/practiceMicrocopy';
import { ERRORS } from './constants/microcopy';
import { useFrenchToolbox } from './hooks/useFrenchToolbox';
import { useSearchHistory } from './hooks/useSearchHistory';
import { HistoryScreen } from './screens/HistoryScreen';
import { ImportReviewScreen, collectSelectedImportItems } from './screens/ImportReviewScreen';
import { ImportSuccessScreen } from './screens/ImportSuccessScreen';
import { ImportToolboxScreen } from './screens/ImportToolboxScreen';
import { LandingScreen } from './screens/LandingScreen';
import { LoadingScreen } from './screens/LoadingScreen';
import { PracticeLabScreen } from './screens/PracticeLabScreen';
import { PracticeSetupScreen } from './screens/PracticeSetupScreen';
import { PracticeQuestionScreen } from './screens/PracticeQuestionScreen';
import { PracticeSessionIntroScreen } from './screens/PracticeSessionIntroScreen';
import { PracticeSummaryScreen } from './screens/PracticeSummaryScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { ToolboxScreen } from './screens/ToolboxScreen';
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
import type {
  PracticeFocusFilter,
  PracticeQuestionResult,
  PracticeSessionPlan,
  PracticeSessionSummary,
  PracticeStageId,
  PracticeQuestionFeedback,
} from './types/practice';
import type { PartOfSpeech } from './types/toolbox';

type LoadingMode = 'analyze' | 'import' | 'practice-generate' | 'practice-check';

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
  const [practiceSession, setPracticeSession] = useState<PracticeSessionPlan | null>(null);
  const [practiceQuestionIndex, setPracticeQuestionIndex] = useState(0);
  const [practiceResults, setPracticeResults] = useState<PracticeQuestionResult[]>([]);
  const [practiceSummary, setPracticeSummary] = useState<PracticeSessionSummary | null>(null);
  const [practiceError, setPracticeError] = useState<string | null>(null);
  const [isStartingPractice, setIsStartingPractice] = useState(false);
  const [selectedPracticeStage, setSelectedPracticeStage] = useState<PracticeStageId | null>(null);
  const [practiceQuickFeedback, setPracticeQuickFeedback] = useState<PracticeQuestionFeedback | null>(
    null,
  );
  const [isPracticeChecking, setIsPracticeChecking] = useState(false);

  const toolbox = useFrenchToolbox();
  const history = useSearchHistory();
  const practiceReadiness = computePracticeReadiness(toolbox.totalCount, toolbox.counts);

  const resetPractice = useCallback(() => {
    setPracticeSession(null);
    setPracticeQuestionIndex(0);
    setPracticeResults([]);
    setPracticeSummary(null);
    setPracticeError(null);
    setSelectedPracticeStage(null);
    setPracticeQuickFeedback(null);
    setIsPracticeChecking(false);
  }, []);

  const isPracticeFlow =
    Boolean(practiceSession) &&
    (screen === 'practice-setup' ||
      screen === 'practice-intro' ||
      screen === 'practice-question' ||
      screen === 'practice-summary' ||
      (screen === 'results' && activeTab === 'practice'));

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
    setActiveTab('toolbox');
    setScreen('vocabulary');
  }, []);

  const handleBackFromVocabulary = useCallback(() => {
    setVocabularyCategory(null);
    setActiveTab('toolbox');
    setScreen('toolbox');
  }, []);

  const handleTabChange = useCallback(
    (tab: AppTab) => {
      setActiveTab(tab);
      setError(null);
      setClarificationError(null);
      setVocabularyCategory(null);

      if (tab !== 'practice' && isPracticeFlow) {
        resetPractice();
      }

      if (tab === 'history') {
        setScreen('history');
        return;
      }

      if (tab === 'toolbox') {
        setScreen('toolbox');
        return;
      }

      if (tab === 'practice') {
        setScreen(
          screen === 'practice-question' ||
            screen === 'practice-intro' ||
            screen === 'practice-setup' ||
            screen === 'practice-summary' ||
            (screen === 'results' && practiceSession)
            ? screen
            : 'practice',
        );
        return;
      }

      setScreen(result && activeTab === 'check' ? 'results' : 'landing');
    },
    [activeTab, isPracticeFlow, practiceSession, resetPractice, result, screen],
  );

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
    setActiveTab('toolbox');
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
    const applyResult = toolbox.applyImport(items);

    setImportResult({
      added: applyResult.added,
      skipped: importReview.alreadyIn.length,
      totalEntries: applyResult.totalEntries,
    });
    setIsImporting(false);
    setImportReview(null);
    setImportText('');
    setScreen('import-success');
  }, [importReview, toolbox]);

  const handleImportDone = useCallback(() => {
    setImportResult(null);
    setImportError(null);
    setActiveTab('toolbox');
    setScreen('toolbox');
  }, []);

  const handleBackFromImport = useCallback(() => {
    setImportError(null);
    setActiveTab('toolbox');
    setScreen('toolbox');
  }, []);

  const handleBackFromImportReview = useCallback(() => {
    setScreen('import');
  }, []);

  const handleSelectPracticeStage = useCallback((stageId: PracticeStageId) => {
    setPracticeError(null);
    setSelectedPracticeStage(stageId);
    setScreen('practice-setup');
  }, []);

  const handleBackFromPracticeSetup = useCallback(() => {
    setSelectedPracticeStage(null);
    setScreen('practice');
  }, []);

  const handleBackFromPracticeIntro = useCallback(() => {
    resetPractice();
    setActiveTab('practice');
    setScreen('practice');
  }, [resetPractice]);

  const handleStartPracticeSession = useCallback(
    async (focusCategory: PracticeFocusFilter) => {
      if (!selectedPracticeStage) return;

      setPracticeError(null);
      setIsStartingPractice(true);
      setLoadingMode('practice-generate');
      setScreen('loading');

      try {
        const session = await createPracticeSession(toolbox.entries, {
          stage: selectedPracticeStage,
          focusCategory,
          completedQuestionIds: getCompletedQuestionIds(),
        });
        setPracticeSession(session);
        setPracticeQuestionIndex(0);
        setPracticeResults([]);
        setPracticeSummary(null);
        setPracticeQuickFeedback(null);
        setActiveTab('practice');
        setScreen('practice-intro');
      } catch (err) {
        setScreen('practice-setup');
        setActiveTab('practice');
        setPracticeError(
          err instanceof Error && err.message ? err.message : ERRORS.aiRequestFailed,
        );
      } finally {
        setIsStartingPractice(false);
      }
    },
    [selectedPracticeStage, toolbox.entries],
  );

  const handleBeginPracticeSession = useCallback(() => {
    setPracticeQuickFeedback(null);
    setScreen('practice-question');
  }, []);

  const handlePracticeSubmit = useCallback(
    async (userAnswer: string) => {
      if (!practiceSession) return;

      const prompt = practiceSession.prompts[practiceQuestionIndex];
      if (!prompt) return;

      if (isProductionExercise(prompt.type)) {
        setIsPracticeChecking(true);
        setPracticeError(null);
        try {
          const grading = await gradePracticeExercise({
            sentence: userAnswer,
            practicePrompt: {
              title: prompt.title,
              instruction: prompt.instruction,
              targetWords: prompt.targetWords,
              englishPrompt: prompt.englishPrompt,
              frenchPrompt: prompt.frenchPrompt,
              type: prompt.type,
            },
          });
          setPracticeQuickFeedback({ userAnswer, grading });
        } catch (err) {
          setPracticeError(
            err instanceof Error && err.message ? err.message : ERRORS.aiRequestFailed,
          );
        } finally {
          setIsPracticeChecking(false);
        }
        return;
      }

      const correct = gradePracticeAnswer(userAnswer, prompt);
      setPracticeQuickFeedback({
        correct,
        userAnswer,
        correctAnswer: getCorrectAnswerDisplay(prompt),
        explanation: prompt.explanation,
      });
    },
    [practiceQuestionIndex, practiceSession],
  );

  const finishPracticeSession = useCallback(
    (updatedResults: PracticeQuestionResult[], options?: { endedEarly?: boolean }) => {
      if (!practiceSession) return;

      const stats = computeSessionSummary(updatedResults, (lemma) => {
        const match = toolbox.entries.find(
          (entry) => entry.lemma.trim().toLowerCase() === lemma.trim().toLowerCase(),
        );
        return match?.partOfSpeech;
      });
      setPracticeResults(updatedResults);
      setPracticeSummary({
        stage: practiceSession.stage,
        completedCount: updatedResults.length,
        totalCount: practiceSession.prompts.length,
        totalScore: stats.totalScore,
        correctCount: stats.correctCount,
        endedEarly: options?.endedEarly ?? updatedResults.length < practiceSession.prompts.length,
        toolboxWordsReinforced: stats.toolboxWordsReinforced,
        categoriesPracticed: stats.categoriesPracticed,
        questionResults: updatedResults,
      });
      setResult(null);
      setPracticeQuickFeedback(null);
      setIsPracticeChecking(false);
      setScreen('practice-summary');
    },
    [practiceSession, toolbox.entries],
  );

  const handleEndPracticeSession = useCallback(() => {
    if (!practiceSession) return;

    let results = practiceResults;
    if (practiceQuickFeedback) {
      const prompt = practiceSession.prompts[practiceQuestionIndex];
      if (prompt && !results.some((result) => result.prompt.id === prompt.id)) {
        results = [...results, buildQuestionResultFromFeedback(prompt, practiceQuickFeedback)];
        markQuestionCompleted(prompt, practiceSession.stage);
      }
    }

    finishPracticeSession(results, { endedEarly: true });
  }, [
    finishPracticeSession,
    practiceQuestionIndex,
    practiceQuickFeedback,
    practiceResults,
    practiceSession,
  ]);

  const handlePracticeQuestionNext = useCallback(() => {
    if (!practiceSession || !practiceQuickFeedback) return;

    const prompt = practiceSession.prompts[practiceQuestionIndex];
    if (!prompt) return;

    const questionResult = buildQuestionResultFromFeedback(prompt, practiceQuickFeedback);
    markQuestionCompleted(prompt, practiceSession.stage);

    const updatedResults = [...practiceResults, questionResult];

    if (practiceQuestionIndex >= practiceSession.prompts.length - 1) {
      finishPracticeSession(updatedResults);
      return;
    }

    setPracticeResults(updatedResults);
    setPracticeQuestionIndex((index) => index + 1);
    setPracticeQuickFeedback(null);
  }, [
    finishPracticeSession,
    practiceQuestionIndex,
    practiceQuickFeedback,
    practiceResults,
    practiceSession,
  ]);

  const handlePracticeDone = useCallback(() => {
    resetPractice();
    setResult(null);
    setActiveTab('practice');
    setScreen('practice');
  }, [resetPractice]);

  const loadingMessages =
    loadingMode === 'import'
      ? IMPORT_LOADING_MESSAGES
      : loadingMode === 'practice-generate'
        ? PRACTICE_LOADING_MESSAGES
        : undefined;

  if (screen === 'loading') {
    return <LoadingScreen messages={loadingMessages} />;
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

  const showTabs =
    screen === 'landing' ||
    screen === 'results' ||
    screen === 'history' ||
    screen === 'toolbox' ||
    screen === 'practice';

  if (screen === 'practice-setup' && selectedPracticeStage) {
    const stageMeta = PRACTICE_STAGES.find((stage) => stage.id === selectedPracticeStage);
    return (
      <div className="min-h-screen">
        <AppTabs active={activeTab} onChange={handleTabChange} />
        <PracticeSetupScreen
          stageId={selectedPracticeStage}
          stageTitle={stageMeta?.title ?? 'Practice'}
          categoryCounts={toolbox.counts}
          onBack={handleBackFromPracticeSetup}
          onStart={(focusCategory) => void handleStartPracticeSession(focusCategory)}
          isStarting={isStartingPractice}
          error={practiceError}
        />
      </div>
    );
  }

  if (screen === 'practice-intro' && practiceSession) {
    return (
      <PracticeSessionIntroScreen
        session={practiceSession}
        onStart={handleBeginPracticeSession}
        onBack={handleBackFromPracticeIntro}
      />
    );
  }

  if (screen === 'practice-question' && practiceSession) {
    const prompt = practiceSession.prompts[practiceQuestionIndex];
    if (!prompt) {
      setScreen('practice');
      return null;
    }

    return (
      <div className="min-h-screen">
        {practiceError && (
          <div className="mx-auto max-w-content px-m pt-m">
            <StatusBanner type="error" message={practiceError} />
          </div>
        )}
        <PracticeQuestionScreen
          prompt={prompt}
          questionNumber={practiceQuestionIndex + 1}
          totalQuestions={practiceSession.prompts.length}
          feedback={practiceQuickFeedback}
          onSubmit={(value) => void handlePracticeSubmit(value)}
          onNext={handlePracticeQuestionNext}
          onEndSession={handleEndPracticeSession}
          isChecking={isPracticeChecking}
        />
      </div>
    );
  }

  if (screen === 'practice-summary' && practiceSummary) {
    return <PracticeSummaryScreen summary={practiceSummary} onDone={handlePracticeDone} />;
  }

  if (screen === 'vocabulary' && vocabularyCategory) {
    return (
      <div className="min-h-screen">
        <AppTabs active="toolbox" onChange={handleTabChange} />
        <VocabularyScreen
          category={vocabularyCategory}
          entries={toolbox.getByCategory(vocabularyCategory)}
          onBack={handleBackFromVocabulary}
        />
      </div>
    );
  }

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
          mode="check"
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

  if (screen === 'toolbox') {
    return (
      <div className="min-h-screen">
        <AppTabs active={activeTab} onChange={handleTabChange} />
        <ToolboxScreen
          entries={toolbox.entries}
          counts={toolbox.counts}
          totalCount={toolbox.totalCount}
          onSelectCategory={handleSelectCategory}
          onImport={handleOpenImport}
        />
      </div>
    );
  }

  if (screen === 'practice') {
    return (
      <div className="min-h-screen">
        <AppTabs active={activeTab} onChange={handleTabChange} />
        <PracticeLabScreen
          readiness={practiceReadiness}
          totalEntries={toolbox.totalCount}
          onSelectStage={handleSelectPracticeStage}
          onGoToCheck={() => {
            setActiveTab('check');
            setScreen('landing');
          }}
          onGoToImport={handleOpenImport}
          error={practiceError}
        />
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
      />
    </div>
  );
}
