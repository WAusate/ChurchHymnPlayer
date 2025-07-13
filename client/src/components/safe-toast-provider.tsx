import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToastMessage {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

interface ToastState {
  toasts: ToastMessage[];
}

type ToastAction = 
  | { type: 'ADD_TOAST'; toast: ToastMessage }
  | { type: 'REMOVE_TOAST'; id: string };

const toastReducer = (state: ToastState, action: ToastAction): ToastState => {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [...state.toasts, action.toast]
      };
    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter(toast => toast.id !== action.id)
      };
    default:
      return state;
  }
};

const ToastContext = createContext<{
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
} | null>(null);

export function SafeToastProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(toastReducer, { toasts: [] });

  const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const duration = toast.duration || 3000;
    
    dispatch({ type: 'ADD_TOAST', toast: { ...toast, id } });
    
    // Auto-remove toast after duration
    setTimeout(() => {
      dispatch({ type: 'REMOVE_TOAST', id });
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_TOAST', id });
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Custom toast container - no Portals, no DOM manipulation */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {state.toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-lg border bg-background p-4 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
              toast.variant === 'destructive' && "destructive border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive"
            )}
          >
            <div className="grid gap-1">
              {toast.title && (
                <div className="text-sm font-semibold">
                  {toast.title}
                </div>
              )}
              {toast.description && (
                <div className="text-sm opacity-90">
                  {toast.description}
                </div>
              )}
            </div>
            <button
              className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600"
              onClick={() => removeToast(toast.id)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useSafeToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useSafeToast must be used within SafeToastProvider');
  }
  return context;
}