import type { ImportApplyResult } from '../types/import';
import { IMPORT_SUCCESS_TITLE } from '../constants/importMicrocopy';
import { PrimaryButton } from '../components/PrimaryButton';

interface ImportSuccessScreenProps {
  result: ImportApplyResult;
  onDone: () => void;
}

export function ImportSuccessScreen({ result, onDone }: ImportSuccessScreenProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-content flex-col justify-center px-m py-xl">
      <div className="rounded-card bg-surface p-xl text-center shadow-card">
        <h1 className="text-2xl font-semibold text-text-primary">{IMPORT_SUCCESS_TITLE}</h1>

        <ul className="mt-l space-y-s text-center text-base text-text-primary md:text-left">
          {result.added > 0 && <li>+{result.added} new entries</li>}
          {result.added === 0 && (
            <li>No new entries were added — everything was already in your toolbox.</li>
          )}
        </ul>

        <p className="mt-l text-base text-text-secondary">
          Your toolbox now contains{' '}
          <span className="font-semibold text-text-primary">{result.totalEntries}</span> entries.
        </p>

        <div className="mt-xl">
          <PrimaryButton onClick={onDone} data-demo-target="toolbox-import-done">
            Back to Toolbox
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
