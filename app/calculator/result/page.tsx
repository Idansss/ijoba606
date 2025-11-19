'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { SummaryStat } from '@/components/calculator/SummaryStat';
import { ResultRow } from '@/components/calculator/ResultRow';
import { BreakdownCard } from '@/components/calculator/BreakdownCard';
import { AssumptionNote } from '@/components/calculator/AssumptionNote';
import { ShareSheet } from '@/components/quiz/ShareSheet';
import { formatCurrency } from '@/lib/utils/calculator';
import { CalcInputs, CalcOutputs } from '@/lib/types';
import { saveCalcRun } from '@/lib/firebase/functions';
import { useAuthStore } from '@/lib/store/auth';
import { useToastStore } from '@/lib/store/toast';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </div>
      }
    >
      <ResultPageContent />
    </Suspense>
  );
}

function ResultPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { firebaseUser } = useAuthStore();
  const { addToast } = useToastStore();
  const [inputs, setInputs] = useState<CalcInputs | null>(null);
  const [outputs, setOutputs] = useState<CalcOutputs | null>(null);
  const [saving, setSaving] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    const loadResult = async () => {
      const runId = searchParams.get('id');

      if (runId) {
        // Load from Firestore
        try {
          const runRef = doc(db, 'calcRuns', runId);
          const runSnap = await getDoc(runRef);
          if (runSnap.exists()) {
            const data = runSnap.data();
            setInputs(data.inputs);
            setOutputs(data.outputs);
          } else {
            router.push('/calculator');
          }
        } catch (error) {
          console.error('Error loading calc run:', error);
          router.push('/calculator');
        }
      } else {
        // Load from session storage
        const stored = sessionStorage.getItem('calcResult');
        if (stored) {
          const data = JSON.parse(stored);
          setInputs(data.inputs);
          setOutputs(data.outputs);
        } else {
          router.push('/calculator');
        }
      }
    };

    loadResult();
  }, [searchParams, router]);

  const handleSave = async () => {
    if (!firebaseUser || !inputs || !outputs) {
      addToast({
        type: 'error',
        message: 'Sign in to save your calculation',
      });
      return;
    }

    setSaving(true);
    try {
      const response = await saveCalcRun({ inputs, outputs });
      addToast({
        type: 'success',
        message: 'Calculation saved! View in your profile.',
      });
      router.push(`/calculator/result?id=${response.runId}`);
    } catch (error) {
      console.error('Error saving calc run:', error);
      addToast({ type: 'error', message: 'Failed to save. Try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (!inputs || !outputs) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  const shareData = {
    title: 'IJBoba 606 Tax Calculator',
    text: `My PAYE estimate be ₦${outputs.monthlyTax.toLocaleString()}/month on IJBoba 606 — check yours.`,
    url: typeof window !== 'undefined' ? window.location.origin + '/calculator' : '',
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Your Tax Calculation
          </h1>
          <p className="text-gray-600">
            Here&apos;s your estimated PAYE breakdown
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <SummaryStat
            label="Annual Tax"
            value={formatCurrency(outputs.annualTax)}
            icon="📅"
            color="purple"
            delay={0.1}
          />
          <SummaryStat
            label="Monthly Tax"
            value={formatCurrency(outputs.monthlyTax)}
            icon="💰"
            color="blue"
            delay={0.2}
          />
          <SummaryStat
            label="Effective Rate"
            value={`${(outputs.effectiveRate * 100).toFixed(2)}%`}
            icon="📊"
            color="green"
            delay={0.3}
          />
        </div>

        {/* Breakdown */}
        <div className="mb-8">
          <BreakdownCard lineItems={outputs.lineItems} />
        </div>

        {/* Key Results */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-gray-200 mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Key Results</h3>
          <div className="space-y-3">
            <ResultRow
              label="Taxable Income"
              value={formatCurrency(outputs.taxableIncome)}
              delay={0.4}
            />
            <ResultRow
              label="Annual Tax"
              value={formatCurrency(outputs.annualTax)}
              highlight
              delay={0.5}
            />
            <ResultRow
              label="Monthly Tax"
              value={formatCurrency(outputs.monthlyTax)}
              highlight
              delay={0.6}
            />
          </div>
        </div>

        {/* Assumption Note */}
        <div className="mb-8">
          <AssumptionNote note={outputs.assumptionsNote} />
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Link
            href="/calculator"
            className="block text-center py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            New Calculation
          </Link>
          {firebaseUser && !searchParams.get('id') && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="py-4 bg-white border-2 border-purple-600 text-purple-600 rounded-xl font-bold hover:bg-purple-50 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save to Profile'}
            </button>
          )}
          <button
            onClick={() => setShareOpen(true)}
            className="py-4 bg-gray-100 text-gray-800 rounded-xl font-bold hover:bg-gray-200 transition-all"
          >
            Share Result
          </button>
        </div>

        {/* Print */}
        <div className="text-center">
          <button
            onClick={() => window.print()}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Print or Save as PDF
          </button>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>
            This calculator provides estimates for educational purposes only.
          </p>
          <p>
            Consult with a qualified tax professional for advice specific to
            your situation.
          </p>
        </div>
      </motion.div>

      {/* Share Sheet */}
      <ShareSheet
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        shareData={shareData}
      />
    </div>
  );
}
