'use client';

import { useToast } from './useToast';

export function Toast() {
  const { message } = useToast();
  if (!message) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in"
      role="status"
      aria-live="polite"
    >
      <div className="bg-espresso text-crema px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-md">
        <span>{message}</span>
      </div>
    </div>
  );
}
