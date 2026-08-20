import type { DemoTabId } from './homeMicrocopy';

export interface DemoFlowStep {
  id: string;
  view: string;
  target: string;
  caption: string;
  narration: string;
  durationMs: number;
  click?: boolean;
}

export interface DemoFlow {
  title: string;
  steps: DemoFlowStep[];
}

export const DEMO_FLOWS: Record<DemoTabId, DemoFlow> = {
  check: {
    title: 'Check my French',
    steps: [
      {
        id: 'check-type',
        view: 'check-landing-typing',
        target: 'check-input',
        caption: 'Type what you want to say in French.',
        narration:
          'On the Check tab, type the French sentence you want to send. Here the learner writes: «Je peux pas venir aujourd\u2019hui».',
        durationMs: 5200,
      },
      {
        id: 'check-voice',
        view: 'check-landing-filled',
        target: 'check-voice',
        caption: 'Or tap the microphone to speak.',
        narration:
          'Prefer speaking? Tap the microphone, say your sentence in French, and review the transcript before checking.',
        durationMs: 4800,
        click: true,
      },
      {
        id: 'check-submit',
        view: 'check-landing-filled',
        target: 'check-submit',
        caption: 'Tap Check My French.',
        narration:
          'Tap Check My French. Mot-à-Mot analyses your sentence and prepares structured feedback.',
        durationMs: 4600,
        click: true,
      },
      {
        id: 'check-loading',
        view: 'check-loading',
        target: 'check-input',
        caption: 'Mot-à-Mot analyses your sentence.',
        narration:
          'While you wait, Mot-à-Mot checks grammar, naturalness, and the most natural way to say what you mean.',
        durationMs: 4200,
      },
      {
        id: 'check-suggestions',
        view: 'check-results',
        target: 'check-suggestions',
        caption: 'Review Everyday French and Writing layers.',
        narration:
          'The results page shows Everyday French for speaking, then Foundation, Expanding, and Fluent writing layers \u2014 each with copy buttons and English support.',
        durationMs: 5600,
      },
      {
        id: 'check-carousel-speaking',
        view: 'check-results',
        target: 'check-changes-carousel',
        caption: 'Swipe through what changed.',
        narration:
          'Swipe through the What Changed carousel to see each fix for everyday conversation \u2014 what you wrote, the better French, and why.',
        durationMs: 5400,
      },
      {
        id: 'check-writing',
        view: 'check-results',
        target: 'check-writing-foundation',
        caption: 'Compare Foundation, Expanding, and Fluent.',
        narration:
          'Each writing layer shows the sentence, a copy button, and its own What Changed carousel so you can compare how the message grows.',
        durationMs: 5400,
      },
      {
        id: 'check-scores',
        view: 'check-results',
        target: 'check-scores',
        caption: 'See grammar and naturalness scores.',
        narration:
          'Your Sentence Scores rate the French you actually wrote \u2014 so you know how clear and natural it was before the correction.',
        durationMs: 4800,
      },
      {
        id: 'check-toolkit',
        view: 'check-results',
        target: 'check-toolkit',
        caption: 'Add new words to your toolbox.',
        narration:
          'If new vocabulary appeared in the correction, you can add selected words straight to your French Toolbox.',
        durationMs: 4800,
      },
      {
        id: 'check-copy',
        view: 'check-results',
        target: 'check-copy',
        caption: 'Copy and send with confidence.',
        narration:
          'When you are ready, copy the version you want and paste it into your messaging app.',
        durationMs: 4600,
        click: true,
      },
    ],
  },
  toolbox: {
    title: 'French Toolbox',
    steps: [
      {
        id: 'toolbox-search',
        view: 'toolbox-main',
        target: 'toolbox-search',
        caption: 'Search your entire toolbox.',
        narration:
          'Search finds any saved word by French, English, or grammatical category.',
        durationMs: 4400,
      },
      {
        id: 'toolbox-import-open',
        view: 'toolbox-main',
        target: 'toolbox-import',
        caption: 'Open Import to Toolbox.',
        narration:
          'Tap Import to Toolbox to paste class notes, vocabulary lists, or lesson material.',
        durationMs: 4600,
        click: true,
      },
      {
        id: 'toolbox-import-type',
        view: 'toolbox-import-paste',
        target: 'toolbox-import-text',
        caption: 'Paste your French notes.',
        narration:
          'Paste anything in French \u2014 single words, lists, or full sentences from your class.',
        durationMs: 5000,
      },
      {
        id: 'toolbox-import-filled',
        view: 'toolbox-import-filled',
        target: 'toolbox-import-text',
        caption: 'Review what you pasted.',
        narration:
          'When your notes are ready, tap Analyze Import. Mot-à-Mot extracts every meaningful entry.',
        durationMs: 4800,
      },
      {
        id: 'toolbox-import-analyze',
        view: 'toolbox-import-filled',
        target: 'toolbox-import-analyze',
        caption: 'Analyze the import.',
        narration:
          'Mot-à-Mot reads the pasted text and organises vocabulary by grammatical function.',
        durationMs: 4600,
        click: true,
      },
      {
        id: 'toolbox-import-loading',
        view: 'toolbox-import-loading',
        target: 'toolbox-import-analyze',
        caption: 'Organising your vocabulary.',
        narration:
          'While it works, Mot-à-Mot looks for patterns, duplicates, and multiple meanings.',
        durationMs: 4800,
      },
      {
        id: 'toolbox-import-summary',
        view: 'toolbox-import-review',
        target: 'toolbox-import-summary',
        caption: 'Review what was found.',
        narration:
          'The review screen summarises new entries, duplicates already in your toolbox, ambiguous words, and related entries.',
        durationMs: 5400,
      },
      {
        id: 'toolbox-import-ready',
        view: 'toolbox-import-review',
        target: 'toolbox-import-ready',
        caption: 'Confirm new entries.',
        narration:
          'Ready to Import lists brand-new entries that will be added to your toolbox.',
        durationMs: 4800,
      },
      {
        id: 'toolbox-import-duplicates',
        view: 'toolbox-import-review',
        target: 'toolbox-import-duplicates',
        caption: 'See duplicates skipped.',
        narration:
          'Entries already saved are marked as duplicates and skipped automatically so your toolbox stays clean.',
        durationMs: 5000,
      },
      {
        id: 'toolbox-import-ambiguous',
        view: 'toolbox-import-review',
        target: 'toolbox-import-ambiguous',
        caption: 'Choose between multiple meanings.',
        narration:
          'When one French word has several valid meanings, you choose which ones to keep.',
        durationMs: 5000,
      },
      {
        id: 'toolbox-import-confirm',
        view: 'toolbox-import-review',
        target: 'toolbox-import-confirm',
        caption: 'Import to Toolbox.',
        narration:
          'Tap Import to Toolbox to save everything you selected.',
        durationMs: 4600,
        click: true,
      },
      {
        id: 'toolbox-import-success',
        view: 'toolbox-import-success',
        target: 'toolbox-import-done',
        caption: 'Your toolbox just grew.',
        narration:
          'A success screen confirms how many new entries were added and your updated toolbox total.',
        durationMs: 4800,
      },
      {
        id: 'toolbox-export-all',
        view: 'toolbox-main',
        target: 'toolbox-export-all',
        caption: 'Export all vocabulary.',
        narration:
          'Back on the toolbox home, export everything to PDF or Excel with validated forms or N A when a form does not apply.',
        durationMs: 5000,
        click: true,
      },
      {
        id: 'toolbox-category-open',
        view: 'toolbox-main',
        target: 'toolbox-category-nouns',
        caption: 'Browse by category.',
        narration:
          'Open any grammatical category to see the words you collected from your own French.',
        durationMs: 4600,
        click: true,
      },
      {
        id: 'toolbox-vocab-card',
        view: 'toolbox-vocabulary',
        target: 'toolbox-delete',
        caption: 'Manage entries on each card.',
        narration:
          'Each card shows meanings and full form tables. Remove entries with the bin icon when you no longer need them.',
        durationMs: 5000,
      },
      {
        id: 'toolbox-export-category',
        view: 'toolbox-vocabulary',
        target: 'toolbox-export-category',
        caption: 'Export one category.',
        narration:
          'From a category page, export just that grammatical function to PDF or Excel.',
        durationMs: 4800,
        click: true,
      },
    ],
  },
  practice: {
    title: 'Practice Lab',
    steps: [
      {
        id: 'practice-ready',
        view: 'practice-ready',
        target: 'practice-readiness',
        caption: 'Start when your toolbox is ready.',
        narration:
          'Practice unlocks when your toolbox reaches one hundred percent readiness \u2014 enough entries, categories, and verbs to begin.',
        durationMs: 5200,
      },
      {
        id: 'practice-start-stage',
        view: 'practice-ready',
        target: 'practice-stage-start',
        caption: 'Choose Quick drills.',
        narration:
          'Pick a practice stage like Quick drills and tap Start.',
        durationMs: 4600,
        click: true,
      },
      {
        id: 'practice-setup',
        view: 'practice-setup',
        target: 'practice-begin-session',
        caption: 'Focus your session.',
        narration:
          'Choose which categories to practise, then tap Begin Session.',
        durationMs: 4800,
        click: true,
      },
      {
        id: 'practice-intro',
        view: 'practice-intro',
        target: 'practice-session-start',
        caption: 'Review today\u2019s session.',
        narration:
          'See how many questions are in the session and tap Start when you are ready.',
        durationMs: 4600,
        click: true,
      },
      {
        id: 'practice-wrong-answer',
        view: 'practice-question-wrong',
        target: 'practice-answer-input',
        caption: 'Try the question.',
        narration:
          'Every question uses words from your toolbox. Here the learner fills in the blank with an incorrect answer: «va».',
        durationMs: 5000,
      },
      {
        id: 'practice-wrong-submit',
        view: 'practice-question-wrong',
        target: 'practice-submit',
        caption: 'Submit your answer.',
        narration:
          'Tap Submit. Mot-à-Mot checks the answer immediately.',
        durationMs: 4400,
        click: true,
      },
      {
        id: 'practice-wrong-feedback',
        view: 'practice-feedback-wrong',
        target: 'practice-feedback',
        caption: 'Learn from a wrong answer.',
        narration:
          'When the answer is wrong, Mot-à-Mot shows the correct form and explains why \u2014 here, «je vais» not «va».',
        durationMs: 5400,
      },
      {
        id: 'practice-correct-answer',
        view: 'practice-question-correct',
        target: 'practice-answer-input',
        caption: 'Try again with the right form.',
        narration:
          'The learner tries again with the correct answer: «vais».',
        durationMs: 4600,
      },
      {
        id: 'practice-correct-submit',
        view: 'practice-question-correct',
        target: 'practice-submit',
        caption: 'Submit the correct answer.',
        narration:
          'Submit again. This time the answer is correct.',
        durationMs: 4400,
        click: true,
      },
      {
        id: 'practice-correct-feedback',
        view: 'practice-feedback-correct',
        target: 'practice-feedback',
        caption: 'Get instant confirmation.',
        narration:
          'Mot-à-Mot confirms the answer and reinforces the rule so you reuse the French you know.',
        durationMs: 5000,
      },
    ],
  },
  history: {
    title: 'History',
    steps: [
      {
        id: 'history-list',
        view: 'history-list',
        target: 'history-list',
        caption: 'See every sentence you checked.',
        narration:
          'History keeps a timeline of every sentence you checked, with grammar and naturalness scores.',
        durationMs: 4800,
      },
      {
        id: 'history-open',
        view: 'history-list',
        target: 'history-entry',
        caption: 'Reopen a past result.',
        narration:
          'Tap any entry to reopen the full results exactly as you saw them.',
        durationMs: 4600,
        click: true,
      },
      {
        id: 'history-results',
        view: 'history-results',
        target: 'check-suggestions',
        caption: 'Review past suggestions.',
        narration:
          'The full results page opens \u2014 Everyday French, writing layers, and What Changed carousels.',
        durationMs: 5400,
      },
      {
        id: 'history-scores',
        view: 'history-results',
        target: 'check-scores',
        caption: 'Compare your past scores.',
        narration:
          'Scroll to Your Sentence Scores to see how your original French was rated that day.',
        durationMs: 4800,
      },
      {
        id: 'history-copy',
        view: 'history-results',
        target: 'check-copy',
        caption: 'Copy or check another sentence.',
        narration:
          'From history you can copy a past correction or return to check new French.',
        durationMs: 4600,
      },
    ],
  },
};
