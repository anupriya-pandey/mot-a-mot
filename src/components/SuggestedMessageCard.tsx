import { InformationCard } from './InformationCard';
import { PrimaryButton } from './PrimaryButton';
import { StatusBanner } from './StatusBanner';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';

interface SuggestedMessageCardProps {
  sentence: string;
  english?: string;
}

export function SuggestedMessageCard({ sentence, english }: SuggestedMessageCardProps) {
  const { copied, error: copyError, copy } = useCopyToClipboard();
  const title = '🗣 Everyday French (Speaking)';
  const copyLabel = 'Copy everyday French message';

  return (
    <div className="space-y-m">
      <InformationCard icon="✅" title={title} highlight="success">
        <p className="leading-relaxed">{sentence}</p>
        {english?.trim() && (
          <p className="mt-s text-sm leading-relaxed text-text-secondary">{english.trim()}</p>
        )}
      </InformationCard>
      <PrimaryButton
        onClick={() => void copy(sentence)}
        success={copied}
        aria-label={copyLabel}
      >
        Copy Message
      </PrimaryButton>
      {copyError && <StatusBanner type="error" message={copyError} />}
    </div>
  );
}
