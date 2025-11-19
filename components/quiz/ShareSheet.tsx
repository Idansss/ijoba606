'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useToastStore } from '@/lib/store/toast';

interface ShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  shareData: {
    title: string;
    text: string;
    url: string;
  };
}

export function ShareSheet({ isOpen, onClose, shareData }: ShareSheetProps) {
  const { addToast } = useToastStore();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        onClose();
      } catch (error) {
        // User cancelled or error occurred
        console.error('Share failed:', error);
      }
    } else {
      // Fallback: copy to clipboard
      handleCopy();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        `${shareData.text}\n${shareData.url}`
      );
      setCopied(true);
      addToast({ type: 'success', message: 'Copied to clipboard!' });
      setTimeout(() => {
        setCopied(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
      addToast({ type: 'error', message: 'Failed to copy' });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Sheet */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 z-50 max-w-lg mx-auto"
          >
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>

            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Share Your Result
            </h3>
            <p className="text-gray-600 mb-6">
              Spread the word and challenge your friends!
            </p>

            <div className="bg-gray-100 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-700">{shareData.text}</p>
            </div>

            <div className="flex flex-col gap-3">
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  onClick={handleShare}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
                >
                  Share via...
                </button>
              )}
              <button
                onClick={handleCopy}
                className="w-full py-3 bg-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-300 transition-all"
              >
                {copied ? '✓ Copied!' : 'Copy Link'}
              </button>
              <button
                onClick={onClose}
                className="w-full py-3 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

