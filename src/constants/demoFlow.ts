import type { DemoTabId } from './homeMicrocopy';

export interface DemoFlowStep {
  id: string;
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
        id: 'check-input',
        target: 'check-input',
        caption: 'Type what you want to say in French.',
        narration:
          'On the Check tab, type the French sentence you want to send — for example, telling a friend you cannot come today.',
        durationMs: 5200,
      },
      {
        id: 'check-voice',
        target: 'check-voice',
        caption: 'Or tap the microphone to speak.',
        narration:
          'Prefer speaking? Tap the microphone, say your sentence in French, and review the transcript before checking.',
        durationMs: 4800,
        click: true,
      },
      {
        id: 'check-submit',
        target: 'check-submit',
        caption: 'Tap Check My French.',
        narration:
          'Tap Check My French. Mot-à-Mot analyses your sentence and returns structured feedback in seconds.',
        durationMs: 4800,
        click: true,
      },
      {
        id: 'check-suggestions',
        target: 'check-suggestions',
        caption: 'Review everyday French suggestions.',
        narration:
          'See how a French speaker might naturally say it — everyday speaking and writing layers you can compare side by side.',
        durationMs: 5400,
      },
      {
        id: 'check-changes',
        target: 'check-changes',
        caption: 'See what changed and why.',
        narration:
          'Scroll through what changed in a clear table, with short explanations that teach the rule behind each fix.',
        durationMs: 5200,
      },
      {
        id: 'check-copy',
        target: 'check-copy',
        caption: 'Copy and send with confidence.',
        narration:
          'Copy the version you want, paste it into your messaging app, and send — knowing you understood the correction first.',
        durationMs: 5000,
        click: true,
      },
    ],
  },
  toolbox: {
    title: 'French Toolbox',
    steps: [
      {
        id: 'toolbox-search',
        target: 'toolbox-search',
        caption: 'Search your entire toolbox.',
        narration:
          'Use search to find any word you have saved — by French, English, or grammatical category.',
        durationMs: 4600,
      },
      {
        id: 'toolbox-import',
        target: 'toolbox-import',
        caption: 'Import notes or class lists.',
        narration:
          'Tap Import to Toolbox to paste French notes, vocabulary lists, or lesson material — Mot-à-Mot extracts and organises every entry.',
        durationMs: 5400,
        click: true,
      },
      {
        id: 'toolbox-export-all',
        target: 'toolbox-export-all',
        caption: 'Export all vocabulary.',
        narration:
          'Export all vocabulary to PDF or Excel — every category in one file, with validated forms or N/A when a form does not apply.',
        durationMs: 5200,
        click: true,
      },
      {
        id: 'toolbox-categories',
        target: 'toolbox-categories',
        caption: 'Browse by grammatical category.',
        narration:
          'Your toolbox is organised by grammar — nouns, verbs, adjectives, adverbs, and more — so you can review what you actually use.',
        durationMs: 5000,
      },
      {
        id: 'toolbox-category-nouns',
        target: 'toolbox-category-nouns',
        caption: 'Open a category.',
        narration:
          'Tap a category like Nouns to see every word you have collected from your own French.',
        durationMs: 4600,
        click: true,
      },
      {
        id: 'toolbox-card-forms',
        target: 'toolbox-card-forms',
        caption: 'See full forms on each card.',
        narration:
          'Each card shows meanings, gender pairs like acteur and actrice, and all adjective forms — the whole word family on one card.',
        durationMs: 5400,
      },
      {
        id: 'toolbox-export-category',
        target: 'toolbox-export-category',
        caption: 'Export one category.',
        narration:
          'From any category page, export just that grammatical function — useful for focused review or sharing with a tutor.',
        durationMs: 5000,
        click: true,
      },
      {
        id: 'toolbox-delete',
        target: 'toolbox-delete',
        caption: 'Remove entries you no longer need.',
        narration:
          'Tap the bin icon to delete an entry. Mot-à-Mot asks you to confirm before removing anything from your toolbox.',
        durationMs: 4800,
        click: true,
      },
    ],
  },
  practice: {
    title: 'Practice Lab',
    steps: [
      {
        id: 'practice-readiness',
        target: 'practice-readiness',
        caption: 'See when your toolbox is ready.',
        narration:
          'Practice Lab turns your toolbox into exercises. Your readiness score shows when you have enough words to start.',
        durationMs: 5000,
      },
      {
        id: 'practice-stages',
        target: 'practice-stages',
        caption: 'Choose a practice stage.',
        narration:
          'Pick a stage — quick drills, sentence building, reading, or conversation-style tasks matched to your toolbox.',
        durationMs: 4800,
        click: true,
      },
      {
        id: 'practice-setup',
        target: 'practice-setup',
        caption: 'Focus your session.',
        narration:
          'Before you start, choose which grammatical categories to focus on — or practise everything in your toolbox.',
        durationMs: 5000,
      },
      {
        id: 'practice-question',
        target: 'practice-question',
        caption: 'Answer using your own vocabulary.',
        narration:
          'Every question uses words you already saved, so practice always feels relevant to your real French.',
        durationMs: 5200,
      },
      {
        id: 'practice-submit',
        target: 'practice-submit',
        caption: 'Submit your answer.',
        narration:
          'Type or speak your answer, then submit. Mot-à-Mot checks meaning, grammar, vocabulary use, and naturalness.',
        durationMs: 4800,
        click: true,
      },
      {
        id: 'practice-feedback',
        target: 'practice-feedback',
        caption: 'Get instant feedback.',
        narration:
          'See what worked and what to try next — then move to the next question and reuse the French you know.',
        durationMs: 5000,
      },
    ],
  },
  history: {
    title: 'History',
    steps: [
      {
        id: 'history-list',
        target: 'history-list',
        caption: 'See every sentence you have checked.',
        narration:
          'History keeps a timeline of every sentence you checked, so nothing gets lost between sessions.',
        durationMs: 5000,
      },
      {
        id: 'history-entry',
        target: 'history-entry',
        caption: 'Reopen any past result.',
        narration:
          'Tap any entry to reopen the full results — corrections, ratings, and explanations — exactly as you saw them.',
        durationMs: 4800,
        click: true,
      },
      {
        id: 'history-detail',
        target: 'history-detail',
        caption: 'Review suggestions and changes.',
        narration:
          'Scroll through past suggestions and changes to spot patterns in your mistakes and track how your French is improving.',
        durationMs: 5200,
      },
      {
        id: 'history-scores',
        target: 'history-scores',
        caption: 'Track your grammar and naturalness scores.',
        narration:
          'Every check saves grammar and naturalness ratings for your original sentence — so you can see progress over time.',
        durationMs: 4800,
      },
      {
        id: 'history-sync',
        target: 'history-sync',
        caption: 'Your progress stays saved.',
        narration:
          'With cloud backup enabled, your toolbox and history stay saved even after app updates or device changes.',
        durationMs: 4800,
      },
    ],
  },
};
