export const HOME_TAGLINE = 'Write confidently. Learn naturally.';
export const HOME_MISSION_TITLE = 'Our mission';
export const HOME_MISSION =
  'Mot-à-Mot helps beginner French learners express everyday thoughts with instant, friendly corrections — before you send the message.';
export const HOME_FEATURES_TITLE = 'What you can do';
export const HOME_FEATURES = [
  {
    title: 'Check my French',
    description:
      'Type or speak a sentence and get clear corrections, ratings, and explanations in seconds.',
  },
  {
    title: 'French Toolbox',
    description:
      'Your personal vocabulary grows automatically from every check and import — organised by grammar.',
  },
  {
    title: 'Practice Lab',
    description:
      'Short exercises built from your own words so you reinforce what you actually use.',
  },
  {
    title: 'History',
    description: 'Revisit past checks anytime and track how your French is improving.',
  },
] as const;
export const HOME_CTA_CHECK = 'Try Check my French';
export const HOME_DEMO_BUTTON = 'Watch demo videos';
export const HOME_DEMO_TITLE = 'See Mot-à-Mot in action';
export const HOME_DEMO_SUBTITLE = 'Choose a tab to watch a guided walkthrough with narration.';

export const DEMO_TABS = [
  { id: 'check' as const, label: 'Check' },
  { id: 'toolbox' as const, label: 'Toolbox' },
  { id: 'practice' as const, label: 'Practice' },
  { id: 'history' as const, label: 'History' },
];

export type DemoTabId = (typeof DEMO_TABS)[number]['id'];

export const DEMO_SCRIPTS: Record<
  DemoTabId,
  { title: string; steps: { caption: string; narration: string }[] }
> = {
  check: {
    title: 'Check my French',
    steps: [
      {
        caption: 'Open the Check tab and type what you want to say.',
        narration:
          'Welcome to Check my French. Type or speak the sentence you want to send — for example, telling a friend you cannot come today.',
      },
      {
        caption: 'Tap Check My French for instant feedback.',
        narration:
          'Tap Check My French. Mot-à-Mot analyses your sentence, rates grammar and naturalness, and shows a clearer version you can copy.',
      },
      {
        caption: 'Review what changed and why.',
        narration:
          'Scroll through what changed and why. Beginner-friendly explanations help you learn from each mistake, not just fix it.',
      },
    ],
  },
  toolbox: {
    title: 'French Toolbox',
    steps: [
      {
        caption: 'Browse vocabulary by grammatical category.',
        narration:
          'Your French Toolbox collects words from every check. Browse nouns, verbs, adjectives, and more — all organised for you.',
      },
      {
        caption: 'See full forms on each card.',
        narration:
          'Each card shows meanings, gender pairs like acteur and actrice, and all adjective forms — so you learn the whole word family.',
      },
      {
        caption: 'Import, export, or delete entries.',
        narration:
          'Import class lists, export your vocabulary to PDF or Excel, and remove entries you no longer need.',
      },
    ],
  },
  practice: {
    title: 'Practice Lab',
    steps: [
      {
        caption: 'Pick a practice stage matched to your level.',
        narration:
          'Practice Lab turns your toolbox into exercises. Choose a stage — quick drills, sentences, reading, or conversation-style tasks.',
      },
      {
        caption: 'Answer using words you have collected.',
        narration:
          'Every question uses vocabulary you already saved, so practice always feels relevant to your real French.',
      },
      {
        caption: 'Get immediate feedback on each answer.',
        narration:
          'Submit your answer and get instant feedback. Mot-à-Mot tells you what worked and what to try next.',
      },
    ],
  },
  history: {
    title: 'History',
    steps: [
      {
        caption: 'See every sentence you have checked.',
        narration:
          'History keeps a timeline of every sentence you checked, so nothing gets lost between sessions.',
      },
      {
        caption: 'Reopen any past result.',
        narration:
          'Tap any entry to reopen the full results — corrections, ratings, and explanations — exactly as you saw them.',
      },
      {
        caption: 'Your progress syncs across visits.',
        narration:
          'With cloud backup enabled, your toolbox and history stay saved even after app updates.',
      },
    ],
  },
};
