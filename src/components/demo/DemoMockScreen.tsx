import { useMemo } from 'react';
import { AppTabs } from '../AppTabs';
import {
  DEMO_CHECK_RESULT,
  DEMO_HISTORY_ENTRIES,
  DEMO_IMPORT_REVIEW,
  DEMO_IMPORT_TEXT_FULL,
  DEMO_IMPORT_TEXT_PARTIAL,
  DEMO_NOOP,
  DEMO_NOOP_ASYNC,
  DEMO_PRACTICE_CORRECT_FEEDBACK,
  DEMO_PRACTICE_PROMPT,
  DEMO_PRACTICE_READINESS,
  DEMO_PRACTICE_SESSION,
  DEMO_PRACTICE_WRONG_FEEDBACK,
  DEMO_SENTENCE,
  DEMO_TOOLBOX_COUNTS,
  DEMO_TOOLBOX_ENTRIES,
} from '../../constants/demoFixtures';
import type { DemoFlowStep } from '../../constants/demoFlow';
import type { DemoTabId } from '../../constants/homeMicrocopy';
import { IMPORT_LOADING_MESSAGES } from '../../constants/importMicrocopy';
import { PRACTICE_STAGES } from '../../constants/practiceStages';
import { HistoryScreen } from '../../screens/HistoryScreen';
import { ImportReviewScreen } from '../../screens/ImportReviewScreen';
import { ImportSuccessScreen } from '../../screens/ImportSuccessScreen';
import { ImportToolboxScreen } from '../../screens/ImportToolboxScreen';
import { LandingScreen } from '../../screens/LandingScreen';
import { LoadingScreen } from '../../screens/LoadingScreen';
import { PracticeLabScreen } from '../../screens/PracticeLabScreen';
import { PracticeQuestionScreen } from '../../screens/PracticeQuestionScreen';
import { PracticeSessionIntroScreen } from '../../screens/PracticeSessionIntroScreen';
import { PracticeSetupScreen } from '../../screens/PracticeSetupScreen';
import { ResultsScreen } from '../../screens/ResultsScreen';
import { ToolboxScreen } from '../../screens/ToolboxScreen';
import { VocabularyScreen } from '../../screens/VocabularyScreen';
import { DemoScaledViewport } from './DemoScaledViewport';

interface DemoMockScreenProps {
  tab: DemoTabId;
  step: DemoFlowStep;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  lockScroll?: boolean;
}

function DemoChrome({ tab, children }: { tab: DemoTabId; children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-background pb-xl">
      <div className="mx-auto w-full max-w-content px-m pt-m">
        <AppTabs active={tab} onChange={DEMO_NOOP} />
      </div>
      {children}
    </div>
  );
}

function renderCheckView(step: DemoFlowStep) {
  if (step.view === 'check-loading') {
    return <LoadingScreen />;
  }

  if (step.view === 'check-results') {
    return (
      <ResultsScreen
        result={DEMO_CHECK_RESULT}
        displaySentence={DEMO_SENTENCE}
        sentenceLanguage="french"
        onCheckAnother={DEMO_NOOP}
        onClarify={DEMO_NOOP_ASYNC}
        isClarifying={false}
        clarificationError={null}
        isInToolbox={() => false}
        onAddToToolbox={DEMO_NOOP}
      />
    );
  }

  const sentence =
    step.view === 'check-landing-typing'
      ? 'Je peux pas venir auj|'
      : step.view === 'check-landing-filled'
        ? DEMO_SENTENCE
        : '';

  return (
    <LandingScreen
      sentence={sentence}
      onSentenceChange={DEMO_NOOP}
      onSubmit={DEMO_NOOP}
      isSubmitting={step.view === 'check-loading'}
    />
  );
}

function renderToolboxView(step: DemoFlowStep) {
  if (step.view === 'toolbox-import-paste') {
    return (
      <ImportToolboxScreen
        text={DEMO_IMPORT_TEXT_PARTIAL}
        onTextChange={DEMO_NOOP}
        onAnalyze={DEMO_NOOP}
        onBack={DEMO_NOOP}
        isSubmitting={false}
        error={null}
      />
    );
  }

  if (step.view === 'toolbox-import-filled') {
    return (
      <ImportToolboxScreen
        text={DEMO_IMPORT_TEXT_FULL}
        onTextChange={DEMO_NOOP}
        onAnalyze={DEMO_NOOP}
        onBack={DEMO_NOOP}
        isSubmitting={false}
        error={null}
      />
    );
  }

  if (step.view === 'toolbox-import-loading') {
    return <LoadingScreen messages={IMPORT_LOADING_MESSAGES} />;
  }

  if (step.view === 'toolbox-import-review') {
    return (
      <ImportReviewScreen
        review={DEMO_IMPORT_REVIEW}
        onReviewChange={DEMO_NOOP}
        onConfirm={DEMO_NOOP}
        onBack={DEMO_NOOP}
        isImporting={false}
      />
    );
  }

  if (step.view === 'toolbox-import-success') {
    return (
      <ImportSuccessScreen
        result={{ added: 4, skipped: 2, totalEntries: 49 }}
        onDone={DEMO_NOOP}
      />
    );
  }

  if (step.view === 'toolbox-vocabulary') {
    return (
      <VocabularyScreen
        category="Nouns"
        entries={DEMO_TOOLBOX_ENTRIES}
        onBack={DEMO_NOOP}
        onDeleteEntry={DEMO_NOOP}
      />
    );
  }

  return (
    <ToolboxScreen
      entries={DEMO_TOOLBOX_ENTRIES}
      counts={DEMO_TOOLBOX_COUNTS}
      totalCount={49}
      onSelectCategory={DEMO_NOOP}
      onImport={DEMO_NOOP}
      onDeleteEntry={DEMO_NOOP}
    />
  );
}

function renderPracticeView(step: DemoFlowStep) {
  const spotAndMatchStage = PRACTICE_STAGES.find((stage) => stage.id === 'quick');

  if (step.view === 'practice-setup') {
    return (
      <PracticeSetupScreen
        stageId="quick"
        stageTitle={spotAndMatchStage?.title ?? 'Spot & Match'}
        categoryCounts={DEMO_TOOLBOX_COUNTS}
        onBack={DEMO_NOOP}
        onStart={DEMO_NOOP}
        isStarting={false}
      />
    );
  }

  if (step.view === 'practice-intro') {
    return (
      <PracticeSessionIntroScreen
        session={DEMO_PRACTICE_SESSION}
        onStart={DEMO_NOOP}
        onBack={DEMO_NOOP}
      />
    );
  }

  if (step.view === 'practice-question-wrong') {
    return (
      <PracticeQuestionScreen
        prompt={DEMO_PRACTICE_PROMPT}
        questionNumber={1}
        totalQuestions={5}
        feedback={null}
        onSubmit={DEMO_NOOP}
        onNext={DEMO_NOOP}
        onEndSession={DEMO_NOOP}
        isChecking={false}
        demoPrefillAnswer="va"
      />
    );
  }

  if (step.view === 'practice-feedback-wrong') {
    return (
      <PracticeQuestionScreen
        prompt={DEMO_PRACTICE_PROMPT}
        questionNumber={1}
        totalQuestions={5}
        feedback={DEMO_PRACTICE_WRONG_FEEDBACK}
        onSubmit={DEMO_NOOP}
        onNext={DEMO_NOOP}
        onEndSession={DEMO_NOOP}
        isChecking={false}
      />
    );
  }

  if (step.view === 'practice-question-correct') {
    return (
      <PracticeQuestionScreen
        prompt={DEMO_PRACTICE_PROMPT}
        questionNumber={1}
        totalQuestions={5}
        feedback={null}
        onSubmit={DEMO_NOOP}
        onNext={DEMO_NOOP}
        onEndSession={DEMO_NOOP}
        isChecking={false}
        demoPrefillAnswer="vais"
      />
    );
  }

  if (step.view === 'practice-feedback-correct') {
    return (
      <PracticeQuestionScreen
        prompt={DEMO_PRACTICE_PROMPT}
        questionNumber={1}
        totalQuestions={5}
        feedback={DEMO_PRACTICE_CORRECT_FEEDBACK}
        onSubmit={DEMO_NOOP}
        onNext={DEMO_NOOP}
        onEndSession={DEMO_NOOP}
        isChecking={false}
      />
    );
  }

  return (
    <PracticeLabScreen
      readiness={DEMO_PRACTICE_READINESS}
      totalEntries={49}
      onSelectStage={DEMO_NOOP}
      onGoToCheck={DEMO_NOOP}
      onGoToImport={DEMO_NOOP}
      error={null}
    />
  );
}

function renderHistoryView(step: DemoFlowStep) {
  if (step.view === 'history-results') {
    return (
      <ResultsScreen
        result={DEMO_CHECK_RESULT}
        displaySentence={DEMO_SENTENCE}
        sentenceLanguage="french"
        onCheckAnother={DEMO_NOOP}
        onClarify={DEMO_NOOP_ASYNC}
        isClarifying={false}
        clarificationError={null}
        isInToolbox={() => false}
        onAddToToolbox={DEMO_NOOP}
      />
    );
  }

  return <HistoryScreen entries={DEMO_HISTORY_ENTRIES} onSelectEntry={DEMO_NOOP} />;
}

export function DemoMockScreen({ tab, step, scrollRef, lockScroll = false }: DemoMockScreenProps) {
  const content = useMemo(() => {
    switch (tab) {
      case 'check':
        return renderCheckView(step);
      case 'toolbox':
        return renderToolboxView(step);
      case 'practice':
        return renderPracticeView(step);
      case 'history':
        return renderHistoryView(step);
      default:
        return null;
    }
  }, [tab, step]);

  return (
    <DemoScaledViewport scrollRef={scrollRef} lockScroll={lockScroll} viewKey={step.view}>
      <div key={step.view} className="demo-view-enter">
        <DemoChrome tab={tab}>{content}</DemoChrome>
      </div>
    </DemoScaledViewport>
  );
}
