'use client';

import { useToastStore } from '@/lib/store/toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            className={cn(
              'px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm',
              'border border-white/20',
              {
                'bg-green-500/90 text-white': toast.type === 'success',
                'bg-red-500/90 text-white': toast.type === 'error',
                'bg-blue-500/90 text-white': toast.type === 'info',
                'bg-yellow-500/90 text-white': toast.type === 'warning',
              }
            )}
          >
            <div className="flex items-start gap-2">
              <span className="text-sm flex-1">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-white/80 hover:text-white transition-colors"
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

