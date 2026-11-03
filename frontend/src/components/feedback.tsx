import { createContext, useContext, useCallback, useRef, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, AlertCircle, Info, X } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// In-app confirm dialog + toasts — replaces window.confirm / window.alert.
// Usage:
//   const confirm = useConfirm();
//   if (!(await confirm({ title, message, variant: 'danger' }))) return;
//
//   const toast = useToast();
//   toast({ message: 'Saved', variant: 'success' });
// ─────────────────────────────────────────────────────────────────────────────

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
}

type ToastVariant = 'success' | 'error' | 'info';
interface ToastOptions {
  message: string;
  variant?: ToastVariant;
}

interface FeedbackContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  toast: (options: ToastOptions | string) => void;
}

const FeedbackContext = createContext<FeedbackContextType | null>(null);

interface ToastItem extends ToastOptions {
  id: number;
  variant: ToastVariant;
}

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => setConfirmState({ ...options, resolve })),
    [],
  );

  const closeConfirm = (value: boolean) => {
    setConfirmState((curr) => {
      curr?.resolve(value);
      return null;
    });
  };

  const toast = useCallback((options: ToastOptions | string) => {
    const opts: ToastOptions = typeof options === 'string' ? { message: options } : options;
    const id = nextId.current++;
    setToasts((curr) => [...curr, { id, message: opts.message, variant: opts.variant ?? 'info' }]);
    setTimeout(() => setToasts((curr) => curr.filter((t) => t.id !== id)), 4000);
  }, []);

  const danger = confirmState?.variant === 'danger';

  const toastStyle: Record<ToastVariant, string> = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-qore-dark',
  };
  const ToastIcon = { success: CheckCircle, error: AlertCircle, info: Info } as const;

  return (
    <FeedbackContext.Provider value={{ confirm, toast }}>
      {children}

      {/* Confirm dialog */}
      <AnimatePresence>
        {confirmState && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4"
            onClick={() => closeConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${danger ? 'bg-red-50 text-red-500' : 'bg-qore-light text-qore-medium'}`}>
                    <AlertTriangle size={18} />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-bold text-qore-text">{confirmState.title}</h2>
                    {confirmState.message && (
                      <p className="text-sm text-gray-500 mt-1">{confirmState.message}</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    onClick={() => closeConfirm(false)}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    {confirmState.cancelLabel ?? 'Cancel'}
                  </button>
                  <button
                    onClick={() => closeConfirm(true)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-qore-dark hover:bg-qore-medium'}`}
                  >
                    {confirmState.confirmLabel ?? 'Confirm'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toasts */}
      <div className="fixed top-5 right-5 z-[70] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = ToastIcon[t.variant];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                className={`pointer-events-auto flex items-center gap-2.5 text-white text-sm font-medium pl-4 pr-3 py-3 rounded-xl shadow-lg max-w-sm ${toastStyle[t.variant]}`}
              >
                <Icon size={16} className="shrink-0" />
                <span className="flex-1">{t.message}</span>
                <button
                  onClick={() => setToasts((curr) => curr.filter((x) => x.id !== t.id))}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback must be used within FeedbackProvider');
  return ctx;
}

export const useConfirm = () => useFeedback().confirm;
export const useToast = () => useFeedback().toast;
