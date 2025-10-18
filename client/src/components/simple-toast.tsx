import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

export function SimpleToast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Allow fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const Icon = type === 'success' ? CheckCircle : type === 'error' ? AlertCircle : null;

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 max-w-sm p-4 rounded-lg shadow-lg transition-all duration-300',
        'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
        {
          'border-green-200 bg-green-50 dark:bg-green-900/20': type === 'success',
          'border-red-200 bg-red-50 dark:bg-red-900/20': type === 'error',
          'opacity-100 translate-y-0': isVisible,
          'opacity-0 translate-y-2': !isVisible,
        }
      )}
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <Icon
            className={cn('h-5 w-5 mt-0.5 flex-shrink-0', {
              'text-green-600 dark:text-green-400': type === 'success',
              'text-red-600 dark:text-red-400': type === 'error',
            })}
          />
        )}
        <p
          className={cn('text-sm flex-1', {
            'text-green-800 dark:text-green-200': type === 'success',
            'text-red-800 dark:text-red-200': type === 'error',
            'text-gray-800 dark:text-gray-200': type === 'info',
          })}
        >
          {message}
        </p>
        <button
          onClick={handleClose}
          className={cn(
            'p-1 rounded-full transition-colors flex-shrink-0',
            'hover:bg-gray-100 dark:hover:bg-gray-700',
            {
              'hover:bg-green-100 dark:hover:bg-green-800': type === 'success',
              'hover:bg-red-100 dark:hover:bg-red-800': type === 'error',
            }
          )}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Global toast manager using only React state, no DOM manipulation
let toastId = 0;
const toastListeners: Array<(toasts: Array<{ id: number; message: string; type: 'success' | 'error' | 'info' }>) => void> = [];
let currentToasts: Array<{ id: number; message: string; type: 'success' | 'error' | 'info' }> = [];

export function showSimpleToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  const id = ++toastId;
  currentToasts = [...currentToasts, { id, message, type }];
  toastListeners.forEach(listener => listener(currentToasts));
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    removeSimpleToast(id);
  }, 3000);
}

export function removeSimpleToast(id: number) {
  currentToasts = currentToasts.filter(toast => toast.id !== id);
  toastListeners.forEach(listener => listener(currentToasts));
}

export function useSimpleToasts() {
  const [toasts, setToasts] = useState(currentToasts);

  useEffect(() => {
    toastListeners.push(setToasts);
    return () => {
      const index = toastListeners.indexOf(setToasts);
      if (index > -1) {
        toastListeners.splice(index, 1);
      }
    };
  }, []);

  return toasts;
}

export function SimpleToastContainer() {
  const toasts = useSimpleToasts();

  return (
    <>
      {toasts.map((toast) => (
        <SimpleToast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeSimpleToast(toast.id)}
        />
      ))}
    </>
  );
}