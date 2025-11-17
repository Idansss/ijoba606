'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { reportContent } from '@/lib/firebase/functions';
import { useAuthStore } from '@/lib/store/auth';
import { useToastStore } from '@/lib/store/toast';

interface ReportButtonProps {
  targetKind: 'thread' | 'post';
  targetId: string;
}

const REPORT_REASONS = [
  'Spam or advertising',
  'Harassment or hate speech',
  'Misinformation',
  'Off-topic content',
  'Inappropriate content',
  'Other',
];

export function ReportButton({ targetKind, targetId }: ReportButtonProps) {
  const { firebaseUser } = useAuthStore();
  const { addToast } = useToastStore();
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!firebaseUser) {
      addToast({ type: 'error', message: 'Sign in to report content' });
      return;
    }

    if (!reason) {
      addToast({ type: 'error', message: 'Please select a reason' });
      return;
    }

    setSubmitting(true);
    try {
      await reportContent({
        targetKind,
        targetId,
        reason,
        text: text || undefined,
      });

      addToast({
        type: 'success',
        message: 'Report submitted. Moderators will review it.',
      });
      setShowModal(false);
      setReason('');
      setText('');
    } catch (error) {
      console.error('Report error:', error);
      addToast({ type: 'error', message: 'Failed to submit report. Try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="text-sm text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z"
            clipRule="evenodd"
          />
        </svg>
        Report
      </button>

      <AnimatePresence>
        {showModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  Report Content
                </h3>

                <div className="space-y-4 mb-6">
                  {/* Reason */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for reporting
                    </label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                    >
                      <option value="">Select a reason...</option>
                      {REPORT_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Additional Details */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional details (optional)
                    </label>
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      maxLength={500}
                      rows={3}
                      placeholder="Provide more context..."
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {text.length}/500 characters
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!reason || submitting}
                    className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
