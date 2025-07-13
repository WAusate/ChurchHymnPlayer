import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { Toast, ToastProvider, ToastViewport } from '@/components/ui/toast';
import { ToastTitle, ToastDescription, ToastClose } from '@/components/ui/toast';

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
      <ToastProvider>
        {state.toasts.map((toast) => (
          <Toast
            key={toast.id}
            variant={toast.variant}
            onOpenChange={(open) => {
              if (!open) {
                removeToast(toast.id);
              }
            }}
          >
            <div className="grid gap-1">
              {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
              {toast.description && <ToastDescription>{toast.description}</ToastDescription>}
            </div>
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
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