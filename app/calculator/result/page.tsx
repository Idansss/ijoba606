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
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-purple-600"></div>
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
        try {
          if (!db) {
            router.push('/calculator');
            return;
          }
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
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  const shareData = {
    title: 'ijoba 606 Tax Calculator',
    text: `My PAYE estimate is ${formatCurrency(outputs.monthlyTax)}/month on ijoba 606 — check yours.`,
    url:
      typeof window !== 'undefined'
        ? window.location.origin + '/calculator'
        : '',
  };

  return (
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-5xl"
      >
        <div className="rounded-[32px] border border-white/80 bg-white/90 p-10 shadow-[0_40px_120px_rgba(15,23,42,0.15)]">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.4em] text-slate-400">
              PAYE summary
            </p>
            <h1 className="mt-3 text-4xl font-semibold text-slate-900">
              Here&apos;s your estimated tax footprint.
          </h1>
            <p className="mt-2 text-sm text-slate-500">
              Print or save this snapshot for your payroll conversations.
          </p>
        </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
          <SummaryStat
              label="Annual tax"
            value={formatCurrency(outputs.annualTax)}
              icon="₦"
            color="purple"
            delay={0.1}
          />
          <SummaryStat
              label="Monthly tax"
            value={formatCurrency(outputs.monthlyTax)}
              icon="🗓️"
            color="blue"
            delay={0.2}
          />
          <SummaryStat
              label="Effective rate"
            value={`${(outputs.effectiveRate * 100).toFixed(2)}%`}
              icon="%"
            color="green"
            delay={0.3}
          />
        </div>

          <div className="mt-8">
          <BreakdownCard lineItems={outputs.lineItems} />
        </div>

          <div className="mt-8 grid gap-3">
            <ResultRow
              label="Taxable income"
              value={formatCurrency(outputs.taxableIncome)}
              delay={0.1}
            />
            <ResultRow
              label="Annual tax"
              value={formatCurrency(outputs.annualTax)}
              highlight
              delay={0.2}
            />
            <ResultRow
              label="Monthly tax"
              value={formatCurrency(outputs.monthlyTax)}
              highlight
              delay={0.3}
            />
        </div>

          <div className="mt-6">
          <AssumptionNote note={outputs.assumptionsNote} />
        </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
          <Link
            href="/calculator"
              className="rounded-full bg-gradient-to-r from-purple-600 to-blue-500 px-6 py-4 text-center text-sm font-semibold text-white shadow-xl"
          >
              New calculation
          </Link>
          {firebaseUser && !searchParams.get('id') && (
            <button
              onClick={handleSave}
              disabled={saving}
                className="rounded-full border border-slate-200 px-6 py-4 text-sm font-semibold text-slate-700 hover:border-purple-200 hover:text-slate-900 disabled:opacity-50"
            >
                {saving ? 'Saving...' : 'Save to profile'}
            </button>
          )}
          <button
            onClick={() => setShareOpen(true)}
              className="rounded-full border border-slate-200 px-6 py-4 text-sm font-semibold text-slate-700 hover:border-purple-200 hover:text-slate-900"
          >
              Share result
          </button>
        </div>

          <div className="mt-6 text-center">
          <button
            onClick={() => window.print()}
              className="text-xs text-slate-500 underline"
          >
              Print or save as PDF
          </button>
        </div>

          <div className="mt-6 rounded-2xl border border-yellow-100 bg-yellow-50 p-4 text-xs text-yellow-800">
            Educational purposes only. Please consult a licensed tax professional
            before filing.
          </div>
        </div>
      </motion.div>

      <ShareSheet
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        shareData={shareData}
      />
    </div>
  );
}
