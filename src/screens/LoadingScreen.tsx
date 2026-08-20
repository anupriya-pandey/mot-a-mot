import { useEffect, useState } from 'react';
import { AppLogo } from '../components/AppLogo';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { LOADING_MESSAGES, LOADING_MESSAGE_INTERVAL_MS } from '../constants/loadingMessages';

export function LoadingScreen({ messages }: { messages?: readonly string[] }) {
  const activeMessages = messages ?? LOADING_MESSAGES;
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % activeMessages.length);
    }, LOADING_MESSAGE_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [activeMessages]);

  return (
    <div className="mx-auto min-h-screen w-full max-w-content px-m py-xl" data-demo-target="check-loading">
      <header className="mb-xxl text-center">
        <AppLogo size="md" />
      </header>
      <LoadingIndicator activeIndex={activeIndex} messages={activeMessages} />
    </div>
  );
}
