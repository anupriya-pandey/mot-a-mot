import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-m"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full max-w-md rounded-card bg-surface p-l shadow-card">
        <h2 id="confirm-dialog-title" className="text-lg font-semibold text-text-primary">
          {title}
        </h2>
        <p className="mt-s text-sm text-text-secondary">{message}</p>
        <div className="mt-l flex flex-col gap-s sm:flex-row">
          <SecondaryButton onClick={onCancel} className="sm:flex-1">
            {cancelLabel}
          </SecondaryButton>
          <PrimaryButton onClick={onConfirm} className="sm:flex-1 !bg-error hover:!bg-error">
            {confirmLabel}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
