'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onRemove(toast.id), 3500);
    return () => clearTimeout(t);
  }, [toast.id, onRemove]);

  const colors: Record<ToastType, { bg: string; border: string; icon: React.ReactNode }> = {
    success: { bg: 'rgba(46, 160, 67, 0.15)', border: '#2ea043', icon: <CheckCircle size={18} color="#3fb950" /> },
    error:   { bg: 'rgba(248, 81, 73, 0.15)',  border: '#f85149', icon: <XCircle size={18} color="#f85149" /> },
    info:    { bg: 'rgba(88, 166, 255, 0.15)', border: '#58a6ff', icon: <Info size={18} color="#58a6ff" /> },
  };

  const c = colors[toast.type];

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: '10px', padding: '0.75rem 1rem',
      boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      animation: 'toastIn 0.25s ease',
      minWidth: '280px', maxWidth: '400px',
      backdropFilter: 'blur(8px)',
    }}>
      {c.icon}
      <span style={{ flex: 1, fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.1rem', display: 'flex' }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      <div style={{
        position: 'fixed', bottom: '1.5rem', right: '1.5rem',
        zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.6rem',
        pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'all' }}>
            <ToastItem toast={t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
