export const HOME_TAGLINE = 'French you know. French you can use.';
export const HOME_ABOUT_TITLE = 'About Us';
export const HOME_ABOUT_PARAGRAPHS = [
  'Mot-à-Mot started with a simple frustration: knowing a French word or grammar rule does not necessarily mean you can use it when you need it.',
  'Language learning often gives us plenty of things to study, but not enough opportunities to use what we\u2019ve already learned.',
  'Mot-à-Mot is being built as a practice companion for that gap.',
  'Write something. See how a French speaker might naturally say it. Build your own French Toolbox from what you encounter. Then come back and practice using it.',
  'The goal isn\u2019t to teach you all of French.',
  'It\u2019s to help you get better at using the French you already have. You know more French than you think. Let\u2019s use it.',
] as const;
export const HOME_MISSION_TITLE = 'Our mission';
export const HOME_MISSION =
  'Turn the French you know into French you can use.';
export const HOME_MISSION_BODY =
  'We believe language learning becomes more meaningful when knowledge moves from something you recognize to something you can produce.';
export const HOME_LOOP_TITLE = 'That\u2019s why Mot-à-Mot is built around a simple loop:';
export const HOME_LOOP_STEPS = [
  'Produce',
  'Understand',
  'Collect',
  'Practice',
  'Reuse',
] as const;
export const HOME_LOOP_FOOTER = 'Keep what you can use as is.';
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
export const HOME_DEMO_BUTTON = 'Watch demo walkthrough';
export const HOME_DEMO_TITLE = 'See Mot-à-Mot in action';
export const HOME_DEMO_SUBTITLE =
  'Choose a tab to watch an auto-play walkthrough — a cursor moves through each feature step by step, with narration.';

export const DEMO_TABS = [
  { id: 'check' as const, label: 'Check' },
  { id: 'toolbox' as const, label: 'Toolbox' },
  { id: 'practice' as const, label: 'Practice' },
  { id: 'history' as const, label: 'History' },
];

export type DemoTabId = (typeof DEMO_TABS)[number]['id'];
