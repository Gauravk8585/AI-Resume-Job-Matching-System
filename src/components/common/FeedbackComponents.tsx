import React, { Component, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

// Error Boundary
interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message || 'An unexpected error occurred.' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F5F5FF] dark:bg-[#0D0B1A] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white dark:bg-[#16122B] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-5 break-words">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-[#6425E8] text-white text-sm font-semibold hover:bg-[#531BC9] transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Toast Notifications
export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((t) => {
        const icon =
          t.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          ) : t.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          ) : t.type === 'warning' ? (
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          ) : (
            <Info className="w-5 h-5 text-[#6425E8] dark:text-[#A78BFA] shrink-0" />
          );

        return (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto bg-white dark:bg-[#1D1836] border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-3.5 flex items-start gap-3"
          >
            {icon}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.title}</p>
              {t.message && (
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                  {t.message}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              aria-label="Dismiss notification"
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

// Confirmation Dialog
export const ConfirmDialog: React.FC = () => {
  const { confirmDialog, closeConfirm } = useApp();
  if (!confirmDialog.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        className="max-w-md w-full bg-white dark:bg-[#1D1836] rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-2xl"
      >
        <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
          {confirmDialog.title}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
          {confirmDialog.message}
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={closeConfirm}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              confirmDialog.onConfirm();
              closeConfirm();
            }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors ${
              confirmDialog.danger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[#6425E8] hover:bg-[#531BC9]'
            }`}
          >
            {confirmDialog.confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};
