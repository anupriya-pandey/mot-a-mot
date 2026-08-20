export const HOME_TAGLINE = 'Write confidently. Learn naturally.';
export const HOME_MISSION_TITLE = 'Our mission';
export const HOME_MISSION =
  'Mot-à-Mot is an AI messaging assistant for beginner French learners, built for the moment right before you press Send. We shorten the loop between thinking, writing, correcting, understanding, and communicating — with instant, beginner-friendly feedback on your real messages, a personal toolbox grown from the French you actually use, and practice that keeps you moving toward confident everyday communication.';
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
