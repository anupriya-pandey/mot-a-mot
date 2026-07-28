import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface SecondaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function SecondaryButton({ children, className = '', ...props }: SecondaryButtonProps) {
  return (
    <button
      type="button"
      className={[
        'w-full rounded-button border-2 border-primary bg-surface px-m py-3 text-base font-medium text-primary',
        'transition-colors duration-interaction hover:bg-primary-light',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  );
}
