'use client';

import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';

type ToastItem = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  notify: (message: string, type?: ToastType) => void;
};

const TOAST_COOKIE = 'app_toast';
const ToastContext = createContext<ToastContextValue | null>(null);

function parseToastCookie(raw: string): ToastItem | null {
  const firstSep = raw.indexOf(':');
  const secondSep = raw.indexOf(':', firstSep + 1);
  if (firstSep === -1 || secondSep === -1) return null;

  const id = raw.slice(0, firstSep).trim();
  const typeValue = raw.slice(firstSep + 1, secondSep).trim();
  const messageValue = raw.slice(secondSep + 1);
  if (!id || !messageValue) return null;

  const type: ToastType = typeValue === 'success' || typeValue === 'error' ? typeValue : 'info';
  return {
    id,
    type,
    message: decodeURIComponent(messageValue),
  };
}

function readCookie(name: string) {
  const match = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`));

  if (!match) return null;
  return match.slice(name.length + 1);
}

function clearCookie(name: string) {
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const seenToastId = useRef<string | null>(null);

  const notify = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const toast: ToastItem = { id, message, type };
    setToasts((prev) => [...prev, toast]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 2000);
  }, []);

  useEffect(() => {
    const checkForCookieToast = () => {
      const raw = readCookie(TOAST_COOKIE);
      if (!raw) return;

      const parsed = parseToastCookie(raw);
      clearCookie(TOAST_COOKIE);
      if (!parsed) return;
      if (seenToastId.current === parsed.id) return;
      seenToastId.current = parsed.id;

      notify(parsed.message, parsed.type);
    };

    checkForCookieToast();
    const interval = window.setInterval(checkForCookieToast, 300);
    return () => window.clearInterval(interval);
  }, [notify]);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToasts() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToasts must be used within ToastProvider');
  }
  return context;
}
