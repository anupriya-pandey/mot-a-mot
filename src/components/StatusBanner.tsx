import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { BannerType } from '../types/analysis';

interface StatusBannerProps {
  type: BannerType;
  message: string;
}

const config: Record<BannerType, { icon: typeof CheckCircle2; className: string }> = {
  success: { icon: CheckCircle2, className: 'border-success/30 bg-success/10 text-success' },
  warning: { icon: AlertTriangle, className: 'border-warning/30 bg-warning/10 text-warning' },
  error: { icon: AlertCircle, className: 'border-error/30 bg-error/10 text-error' },
};

export function StatusBanner({ type, message }: StatusBannerProps) {
  const { icon: Icon, className } = config[type];

  return (
    <div className={`flex items-start gap-s rounded-card border p-m ${className}`} role="alert">
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
