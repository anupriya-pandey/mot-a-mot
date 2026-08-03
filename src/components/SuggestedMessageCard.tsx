import { InformationCard } from './InformationCard';
import { PrimaryButton } from './PrimaryButton';
import { PronunciationButton } from './PronunciationButton';
import { StatusBanner } from './StatusBanner';
import {
  EVERYDAY_FRENCH_DESCRIPTION,
  EVERYDAY_FRENCH_SUBTITLE,
  EVERYDAY_FRENCH_TITLE,
} from '../constants/writingStyles';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';

interface SuggestedMessageCardProps {
  sentence: string;
  english?: string;
}

export function SuggestedMessageCard({ sentence, english }: SuggestedMessageCardProps) {
  const { copied, error: copyError, copy } = useCopyToClipboard();
  const title = `🗣 ${EVERYDAY_FRENCH_TITLE}`;

  return (
    <div className="space-y-m">
      <InformationCard icon="✅" title={title} highlight="success">
        <p className="text-sm font-medium text-text-secondary">{EVERYDAY_FRENCH_SUBTITLE}</p>
        <p className="mt-xs text-sm text-text-secondary">{EVERYDAY_FRENCH_DESCRIPTION}</p>
        <div className="mt-m flex items-start gap-s">
          <p className="flex-1 leading-relaxed">{sentence}</p>
          <PronunciationButton text={sentence} ariaLabel="Hear everyday French pronunciation" />
        </div>
        {english?.trim() && (
          <p className="mt-s text-sm leading-relaxed text-text-secondary">{english.trim()}</p>
        )}
      </InformationCard>
      <PrimaryButton
        onClick={() => void copy(sentence)}
        success={copied}
        aria-label="Copy everyday French message"
      >
        Copy Message
      </PrimaryButton>
      {copyError && <StatusBanner type="error" message={copyError} />}
    </div>
  );
}
