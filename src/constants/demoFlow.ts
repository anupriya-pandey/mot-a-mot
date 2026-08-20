import type { DemoTabId } from './homeMicrocopy';

export interface DemoFlowStep {
  id: string;
  caption: string;
  narration: string;
  durationMs: number;
  cursor: { x: number; y: number };
  click?: boolean;
  highlight?: { x: number; y: number; width: number; height: number };
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
        id: 'check-focus-input',
        caption: 'Open Check and type your sentence.',
        narration:
          'Start on the Check tab. Type or speak the French sentence you want to send — for example, telling a friend you cannot come today.',
        durationMs: 5200,
        cursor: { x: 52, y: 46 },
        highlight: { x: 8, y: 38, width: 84, height: 14 },
      },
      {
        id: 'check-submit',
        caption: 'Tap Check My French.',
        narration:
          'Tap Check My French. Mot-à-Mot analyses your sentence and returns structured feedback in seconds.',
        durationMs: 4800,
        cursor: { x: 50, y: 62 },
        click: true,
        highlight: { x: 18, y: 58, width: 64, height: 8 },
      },
      {
        id: 'check-results',
        caption: 'Review suggestions and what changed.',
        narration:
          'Review everyday French suggestions, see what changed in a clear table, and read short explanations that teach the rule behind each fix.',
        durationMs: 5600,
        cursor: { x: 72, y: 58 },
        highlight: { x: 8, y: 28, width: 84, height: 44 },
      },
      {
        id: 'check-copy',
        caption: 'Copy and send with confidence.',
        narration:
          'Copy the version you want, paste it into your messaging app, and send — knowing you understood the correction first.',
        durationMs: 5000,
        cursor: { x: 78, y: 34 },
        click: true,
        highlight: { x: 62, y: 30, width: 24, height: 7 },
      },
    ],
  },
  toolbox: {
    title: 'French Toolbox',
    steps: [
      {
        id: 'toolbox-dashboard',
        caption: 'Browse vocabulary by grammatical category.',
        narration:
          'Your French Toolbox grows from every check and import. Browse nouns, verbs, adjectives, and more — all organised for you.',
        durationMs: 5200,
        cursor: { x: 28, y: 52 },
        highlight: { x: 8, y: 34, width: 84, height: 36 },
      },
      {
        id: 'toolbox-open-nouns',
        caption: 'Open a category to see your words.',
        narration:
          'Tap a category like Nouns to open the words you have collected from your own French.',
        durationMs: 4600,
        cursor: { x: 28, y: 44 },
        click: true,
        highlight: { x: 10, y: 38, width: 36, height: 10 },
      },
      {
        id: 'toolbox-forms',
        caption: 'See full forms on each card.',
        narration:
          'Each card shows meanings, gender pairs like acteur and actrice, and all adjective forms — so you learn the whole word family.',
        durationMs: 5400,
        cursor: { x: 50, y: 58 },
        highlight: { x: 8, y: 24, width: 84, height: 48 },
      },
      {
        id: 'toolbox-export',
        caption: 'Export or manage your vocabulary.',
        narration:
          'Export everything or just one grammatical category to PDF or Excel, import class lists, or delete entries you no longer need.',
        durationMs: 5200,
        cursor: { x: 50, y: 22 },
        click: true,
        highlight: { x: 8, y: 16, width: 84, height: 8 },
      },
    ],
  },
  practice: {
    title: 'Practice Lab',
    steps: [
      {
        id: 'practice-readiness',
        caption: 'See when your toolbox is ready to practice.',
        narration:
          'Practice Lab turns your toolbox into exercises. Your readiness score shows when you have enough words to start.',
        durationMs: 5000,
        cursor: { x: 50, y: 36 },
        highlight: { x: 8, y: 22, width: 84, height: 22 },
      },
      {
        id: 'practice-pick-stage',
        caption: 'Choose a practice stage.',
        narration:
          'Pick a stage — quick drills, sentence building, reading, or conversation-style tasks matched to your toolbox.',
        durationMs: 4800,
        cursor: { x: 50, y: 58 },
        click: true,
        highlight: { x: 8, y: 48, width: 84, height: 16 },
      },
      {
        id: 'practice-answer',
        caption: 'Answer using your own vocabulary.',
        narration:
          'Every question uses words you already saved, so practice always feels relevant to your real French.',
        durationMs: 5200,
        cursor: { x: 52, y: 50 },
        highlight: { x: 8, y: 30, width: 84, height: 28 },
      },
      {
        id: 'practice-feedback',
        caption: 'Get instant feedback on each answer.',
        narration:
          'Submit your answer and get immediate feedback on meaning, grammar, and naturalness — then move to the next question.',
        durationMs: 5000,
        cursor: { x: 50, y: 72 },
        click: true,
        highlight: { x: 24, y: 68, width: 52, height: 8 },
      },
    ],
  },
  history: {
    title: 'History',
    steps: [
      {
        id: 'history-list',
        caption: 'See every sentence you have checked.',
        narration:
          'History keeps a timeline of every sentence you checked, so nothing gets lost between sessions.',
        durationMs: 5000,
        cursor: { x: 50, y: 42 },
        highlight: { x: 8, y: 22, width: 84, height: 38 },
      },
      {
        id: 'history-open',
        caption: 'Reopen any past result.',
        narration:
          'Tap any entry to reopen the full results — corrections, ratings, and explanations — exactly as you saw them.',
        durationMs: 4800,
        cursor: { x: 50, y: 38 },
        click: true,
        highlight: { x: 8, y: 28, width: 84, height: 12 },
      },
      {
        id: 'history-detail',
        caption: 'Compare and learn from past checks.',
        narration:
          'Scroll through past suggestions and changes to spot patterns in your mistakes and track how your French is improving.',
        durationMs: 5200,
        cursor: { x: 68, y: 56 },
        highlight: { x: 8, y: 24, width: 84, height: 46 },
      },
      {
        id: 'history-sync',
        caption: 'Your progress stays saved.',
        narration:
          'With cloud backup enabled, your toolbox and history stay saved even after app updates or device changes.',
        durationMs: 4800,
        cursor: { x: 50, y: 14 },
        highlight: { x: 8, y: 8, width: 84, height: 10 },
      },
    ],
  },
};
