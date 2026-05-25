/** Toasts e diálogo de confirmação globais (portais no <body>). */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

type ToastType = 'info' | 'success' | 'error';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ConfirmState {
  message: string;
  confirmText: string;
  resolve: (ok: boolean) => void;
}

interface ToastContextValue {
  toast(message: string, type?: ToastType, ms?: number): void;
  confirm(message: string, confirmText?: string): Promise<boolean>;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const nextId = useRef(1);

  const toast = useCallback((message: string, type: ToastType = 'info', ms = 2800) => {
    const id = nextId.current++;
    setToasts((list) => [...list, { id, message, type }]);
    setTimeout(() => {
      setToasts((list) => list.filter((t) => t.id !== id));
    }, ms);
  }, []);

  const confirm = useCallback((message: string, confirmText = 'Confirmar') => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ message, confirmText, resolve });
    });
  }, []);

  const closeConfirm = (ok: boolean) => {
    confirmState?.resolve(ok);
    setConfirmState(null);
  };

  const value = useMemo<ToastContextValue>(() => ({ toast, confirm }), [toast, confirm]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toasts.length > 0 &&
        createPortal(
          <div className="toast-wrap">
            {toasts.map((t) => (
              <div key={t.id} className={`toast toast--${t.type}`}>
                {t.message}
              </div>
            ))}
          </div>,
          document.body,
        )}
      {confirmState &&
        createPortal(
          <div
            className="overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) closeConfirm(false);
            }}
          >
            <div className="sheet">
              <div className="sheet__handle"></div>
              <div className="sheet__title">Confirmação</div>
              <div className="sheet__body">
                <p className="mb-16">{confirmState.message}</p>
                <div className="btn-row">
                  <button
                    className="btn btn--secondary full"
                    data-cancel
                    onClick={() => closeConfirm(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    className="btn btn--primary full"
                    data-ok
                    onClick={() => closeConfirm(true)}
                  >
                    {confirmState.confirmText}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve ser usado dentro de <ToastProvider>');
  return ctx;
}
