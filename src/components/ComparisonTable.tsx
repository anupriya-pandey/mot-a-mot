import type { CorrectionChange } from '../types/analysis';
import { SectionHeader } from './SectionHeader';

interface ComparisonTableProps {
  changes: CorrectionChange[];
}

export function ComparisonTable({ changes }: ComparisonTableProps) {
  if (changes.length === 0) {
    return null;
  }

  return (
    <section>
      <SectionHeader icon="📝" title="Changes Made" />
      <div className="overflow-x-auto rounded-card bg-surface shadow-card">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-background">
              <th className="px-m py-s font-semibold text-text-primary">Your Sentence</th>
              <th className="px-m py-s font-semibold text-text-primary">Informal French</th>
              <th className="px-m py-s font-semibold text-text-primary">Formal French</th>
            </tr>
          </thead>
          <tbody>
            {changes.map((change, index) => (
              <tr key={index} className="border-b border-border last:border-b-0">
                <td className="px-m py-m text-error">{change.youWrote}</td>
                <td className="px-m py-m text-success">{change.informalFrench}</td>
                <td className="px-m py-m text-success">{change.formalFrench}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
