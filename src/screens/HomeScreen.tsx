import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { AppLogo } from '../components/AppLogo';
import { DemoVideoModal } from '../components/DemoVideoModal';
import { PrimaryButton } from '../components/PrimaryButton';
import {
  HOME_ABOUT_PARAGRAPHS,
  HOME_ABOUT_TITLE,
  HOME_CTA_CHECK,
  HOME_DEMO_BUTTON,
  HOME_FEATURES,
  HOME_FEATURES_TITLE,
  HOME_LOOP_FOOTER,
  HOME_LOOP_STEPS,
  HOME_LOOP_TITLE,
  HOME_MISSION,
  HOME_MISSION_BODY,
  HOME_MISSION_TITLE,
  HOME_TAGLINE,
} from '../constants/homeMicrocopy';

interface HomeScreenProps {
  onTryCheck: () => void;
}

export function HomeScreen({ onTryCheck }: HomeScreenProps) {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-content flex-col px-m py-xl">
      <header className="mb-xxl text-center">
        <AppLogo />
        <p className="mt-m text-lg font-medium text-text-primary">{HOME_TAGLINE}</p>
      </header>

      <section className="mb-xxl">
        <h1 className="mb-l text-2xl font-semibold text-text-primary">{HOME_ABOUT_TITLE}</h1>
        <div className="space-y-m text-base leading-relaxed text-text-secondary">
          {HOME_ABOUT_PARAGRAPHS.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className="mb-xxl rounded-card bg-surface p-l shadow-card">
        <h2 className="mb-s text-2xl font-semibold text-text-primary">{HOME_MISSION_TITLE}</h2>
        <p className="text-lg font-medium text-text-primary">{HOME_MISSION}</p>
        <p className="mt-m text-base leading-relaxed text-text-secondary">{HOME_MISSION_BODY}</p>
        <p className="mt-l text-base font-medium text-text-primary">{HOME_LOOP_TITLE}</p>
        <p className="mt-s text-base text-text-secondary">
          {HOME_LOOP_STEPS.join(' \u2192 ')}
        </p>
        <p className="mt-m text-base leading-relaxed text-text-secondary">{HOME_LOOP_FOOTER}</p>
      </section>

      <section className="mb-xxl">
        <h2 className="mb-l text-2xl font-semibold text-text-primary">{HOME_FEATURES_TITLE}</h2>
        <div className="space-y-m">
          {HOME_FEATURES.map((feature) => (
            <article
              key={feature.title}
              className="rounded-card bg-surface p-l shadow-card"
            >
              <div className="mb-xs flex items-center gap-s">
                <Sparkles className="h-4 w-4 text-primary" aria-hidden />
                <h3 className="text-lg font-semibold text-text-primary">{feature.title}</h3>
              </div>
              <p className="text-sm leading-relaxed text-text-secondary">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="mt-auto space-y-m pb-xl">
        <PrimaryButton onClick={onTryCheck}>{HOME_CTA_CHECK}</PrimaryButton>
        <button
          type="button"
          onClick={() => setDemoOpen(true)}
          className="w-full rounded-button border border-border bg-surface px-m py-3 text-base font-medium text-text-primary transition-colors hover:bg-primary-light hover:text-primary"
        >
          {HOME_DEMO_BUTTON}
        </button>
      </div>

      {demoOpen && <DemoVideoModal onClose={() => setDemoOpen(false)} />}
    </div>
  );
}
