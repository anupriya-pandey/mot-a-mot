import type { ReactNode } from 'react';

interface InformationCardProps {
  icon?: ReactNode;
  title: string;
  children: ReactNode;
  action?: ReactNode;
  highlight?: 'success' | 'default';
}

export function InformationCard({
  icon,
  title,
  children,
  action,
  highlight = 'default',
}: InformationCardProps) {
  return (
    <section className="rounded-card bg-surface p-l shadow-card">
      <div className="mb-s flex items-center justify-between gap-s">
        <div className="flex items-center gap-s">
          {icon && <span className="text-lg">{icon}</span>}
          <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
        </div>
        {action}
      </div>
      <div className={highlight === 'success' ? 'text-success font-medium' : 'text-text-primary'}>
        {children}
      </div>
    </section>
  );
}
