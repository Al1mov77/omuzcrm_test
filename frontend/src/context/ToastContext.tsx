import React, { createContext, useContext, useState, useCallback } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Portal Container */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-9999 flex flex-col gap-3 w-full max-w-sm px-4 pointer-events-none">
        {toasts.map(toast => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border shadow-lg animate-slide-up bg-white/95 dark:bg-[#0e1322]/95 border-gray-100 dark:border-gray-800 backdrop-blur-md transition-all duration-300 w-full`}
              style={{
                boxShadow: isSuccess 
                  ? '0 10px 25px -5px rgba(22, 163, 74, 0.1), 0 0 12px -3px rgba(22, 163, 74, 0.2)' 
                  : isError 
                    ? '0 10px 25px -5px rgba(220, 38, 38, 0.1), 0 0 12px -3px rgba(220, 38, 38, 0.2)'
                    : '0 10px 25px -5px rgba(99, 102, 241, 0.1), 0 0 12px -3px rgba(99, 102, 241, 0.2)'
              }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {isSuccess && (
                  <div className="w-6 h-6 rounded-full bg-green-50 dark:bg-green-950/40 flex items-center justify-center text-green-600 dark:text-green-400">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
                {isError && (
                  <div className="w-6 h-6 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center text-red-650 dark:text-red-400">
                    <AlertCircle className="w-3.5 h-3.5" />
                  </div>
                )}
                {!isSuccess && !isError && (
                  <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-accent">
                    <AlertCircle className="w-3.5 h-3.5" />
                  </div>
                )}
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate pr-2">
                  {toast.message}
                </p>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-slate-800 dark:hover:text-white p-0.5 rounded-lg hover:bg-accent/10 hover:text-accent dark:hover:bg-accent/20 dark:hover:text-indigo-400 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};


