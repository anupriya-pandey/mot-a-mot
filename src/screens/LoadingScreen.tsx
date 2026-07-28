import { useEffect, useState } from 'react';
import { AppLogo } from '../components/AppLogo';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { LOADING_MESSAGES, LOADING_MESSAGE_INTERVAL_MS } from '../constants/loadingMessages';

export function LoadingScreen() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % LOADING_MESSAGES.length);
    }, LOADING_MESSAGE_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="mx-auto min-h-screen w-full max-w-content px-m py-xl">
      <header className="mb-xxl text-center">
        <AppLogo size="md" />
      </header>
      <LoadingIndicator activeIndex={activeIndex} />
    </div>
  );
}
