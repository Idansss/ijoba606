'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { reportContent } from '@/lib/firebase/functions';
import { useAuthStore } from '@/lib/store/auth';
import { useToastStore } from '@/lib/store/toast';
import { Icon } from '@/components/ui/Icon';
import { Select } from '@/components/ui/Select';

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
        className="flex items-center gap-1 text-sm text-outline transition-colors hover:text-error"
      >
        <Icon name="flag" className="text-[18px]" />
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
              <div className="w-full max-w-md rounded-bento border border-deep-green/5 bg-surface-container-lowest p-6 shadow-[0px_20px_40px_rgba(0,50,0,0.15)]">
                <h3 className="mb-4 font-headline-md text-headline-md text-deep-green">
                  Report Content
                </h3>

                <div className="mb-6 space-y-4">
                  {/* Reason */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-on-surface-variant">
                      Reason for reporting
                    </label>
                    <Select
                      value={reason}
                      onChange={setReason}
                      placeholder="Select a reason..."
                      options={REPORT_REASONS.map((r) => ({ value: r, label: r }))}
                    />
                  </div>

                  {/* Additional Details */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-on-surface-variant">
                      Additional details (optional)
                    </label>
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      maxLength={500}
                      rows={3}
                      placeholder="Provide more context..."
                      className="w-full resize-none rounded-input border-2 border-outline-variant bg-surface-container-lowest px-4 py-2 focus:border-forest-green focus:outline-none"
                    />
                    <p className="mt-1 text-xs text-outline">
                      {text.length}/500 characters
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 rounded-input bg-surface-container-high py-3 font-semibold text-on-surface transition-all hover:bg-surface-variant"
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
