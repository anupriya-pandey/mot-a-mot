import { forwardRef, type TextareaHTMLAttributes } from 'react';

interface TextInputProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  warning?: boolean;
  error?: boolean;
}

export const TextInput = forwardRef<HTMLTextAreaElement, TextInputProps>(
  ({ warning, error, className = '', ...props }, ref) => {
    const borderClass = error
      ? 'border-error focus:ring-error'
      : warning
        ? 'border-warning focus:ring-warning'
        : 'border-border focus:border-primary focus:ring-primary';

    return (
      <textarea
        ref={ref}
        rows={4}
        className={[
          'w-full resize-none rounded-input border bg-surface p-m text-base text-text-primary',
          'placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-offset-0',
          borderClass,
          className,
        ].join(' ')}
        {...props}
      />
    );
  },
);

TextInput.displayName = 'TextInput';
