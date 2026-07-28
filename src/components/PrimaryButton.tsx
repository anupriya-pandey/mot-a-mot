import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  success?: boolean;
  loading?: boolean;
}

export function PrimaryButton({
  children,
  success = false,
  loading = false,
  disabled,
  className = '',
  ...props
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      disabled={isDisabled}
      className={[
        'w-full rounded-button px-m py-3 text-base font-medium transition-colors duration-interaction',
        success
          ? 'bg-success text-white'
          : isDisabled
            ? 'cursor-not-allowed bg-border text-text-secondary'
            : 'bg-primary text-white hover:bg-primary-hover',
        className,
      ].join(' ')}
      {...props}
    >
      {loading ? 'Checking...' : success ? '✓ Copied!' : children}
    </button>
  );
}
