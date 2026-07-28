import { Star } from 'lucide-react';

interface RatingBarProps {
  label: string;
  value: number;
}

export function RatingBar({ label, value }: RatingBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className="rounded-card bg-surface p-l shadow-card">
      <div className="mb-s flex items-center justify-between">
        <div className="flex items-center gap-s">
          <Star className="h-4 w-4 fill-warning text-warning" />
          <span className="font-semibold text-text-primary">{label}</span>
        </div>
        <span className="text-sm font-medium text-success">{clamped}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-success transition-all duration-interaction"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
