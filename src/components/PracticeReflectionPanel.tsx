import { Plus } from 'lucide-react';
import {
  PRACTICE_NEW_EXPRESSION,
  PRACTICE_REFLECTION_TITLE,
  PRACTICE_WORDS_USED,
} from '../constants/practiceMicrocopy';
import type { PracticeReflection } from '../types/practice';

interface PracticeReflectionPanelProps {
  reflection: PracticeReflection;
  onAddExpression?: () => void;
  expressionAdded?: boolean;
}

export function PracticeReflectionPanel({
  reflection,
  onAddExpression,
  expressionAdded,
}: PracticeReflectionPanelProps) {
  const hasContent =
    reflection.wordsUsed.length > 0 || reflection.newExpression || onAddExpression;

  if (!hasContent) return null;

  return (
    <section
      className="rounded-card border border-border bg-surface p-m shadow-card"
      aria-labelledby="practice-reflection"
    >
      <h2 id="practice-reflection" className="text-lg font-semibold text-text-primary">
        {PRACTICE_REFLECTION_TITLE}
      </h2>

      {reflection.wordsUsed.length > 0 && (
        <div className="mt-m">
          <p className="text-sm font-medium text-text-secondary">{PRACTICE_WORDS_USED}</p>
          <ul className="mt-s space-y-xs">
            {reflection.wordsUsed.map((word) => (
              <li key={word} className="text-sm text-text-primary">
                ✓ {word}
              </li>
            ))}
          </ul>
        </div>
      )}

      {reflection.newExpression && (
        <div className="mt-m rounded-lg bg-primary/5 px-m py-s">
          <p className="text-sm font-medium text-text-secondary">{PRACTICE_NEW_EXPRESSION}</p>
          <p className="mt-xs font-medium text-text-primary">{reflection.newExpression.lemma}</p>
          <p className="text-sm text-text-secondary">
            {reflection.newExpression.meaning} · {reflection.newExpression.partOfSpeech}
          </p>
          {onAddExpression && (
            <button
              type="button"
              onClick={onAddExpression}
              disabled={expressionAdded}
              className="mt-s inline-flex items-center gap-s rounded-button bg-primary px-m py-s text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              {expressionAdded ? 'Added to Toolbox' : 'Add to Toolbox?'}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
