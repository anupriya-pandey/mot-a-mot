import { LOADING_MESSAGES } from '../constants/loadingMessages';

interface LoadingIndicatorProps {
  activeIndex: number;
}

export function LoadingIndicator({ activeIndex }: LoadingIndicatorProps) {
  return (
    <div className="flex flex-col items-center py-xxl">
      <div
        className="mb-xl h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary"
        role="status"
        aria-label="Analyzing your French"
      />
      <p className="mb-xl text-center text-xl font-semibold text-text-primary">
        {LOADING_MESSAGES[activeIndex]}
      </p>
      <ul className="w-full max-w-sm space-y-m">
        {LOADING_MESSAGES.map((message, index) => {
          const isActive = index === activeIndex;
          const isComplete = index < activeIndex;

          return (
            <li key={message} className="flex items-center gap-m text-sm">
              <span
                className={[
                  'h-2.5 w-2.5 shrink-0 rounded-full transition-colors duration-interaction',
                  isActive ? 'bg-primary' : isComplete ? 'bg-primary/40' : 'bg-border',
                ].join(' ')}
              />
              <span
                className={
                  isActive ? 'font-medium text-text-primary' : 'text-text-secondary'
                }
              >
                {message}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
