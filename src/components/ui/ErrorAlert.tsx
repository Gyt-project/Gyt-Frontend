import { AlertCircle, X } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
}

/**
 * A polished inline error banner for form pages.
 */
export default function ErrorAlert({ message, onDismiss }: ErrorAlertProps) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-3 bg-danger-muted border border-danger text-danger-fg rounded-lg px-4 py-3"
    >
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
      <p className="text-sm flex-1 leading-snug">{message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 text-danger-fg/60 hover:text-danger-fg transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
