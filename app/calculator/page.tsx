'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CalcForm } from '@/components/calculator/CalcForm';
import { CalcInputsFormData } from '@/lib/validation/schemas';
import { computeTax, DEFAULT_PAYE_RULES } from '@/lib/utils/calculator';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { PayeRules } from '@/lib/types';
import { useToastStore } from '@/lib/store/toast';
import { Icon } from '@/components/ui/Icon';

export default function CalculatorPage() {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [rules, setRules] = useState<PayeRules>(DEFAULT_PAYE_RULES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch Personal Income Tax rules from Firestore
    const fetchRules = async () => {
      try {
        if (!db) {
          // No Firebase configuration in local dev; keep default rules.
          return;
        }
        const rulesRef = doc(db, 'configs', 'payeRules');
        const rulesSnap = await getDoc(rulesRef);
        if (rulesSnap.exists()) {
          setRules(rulesSnap.data() as PayeRules);
        }
      } catch (error) {
        console.error('Error fetching tax rules:', error);
        // Use default rules on error
      }
    };
    fetchRules();
  }, []);

  const handleSubmit = async (data: CalcInputsFormData) => {
    setLoading(true);
    try {
      // Compute tax
      const outputs = computeTax(data, rules);

      // Store in session storage for result page
      sessionStorage.setItem(
        'calcResult',
        JSON.stringify({ inputs: data, outputs })
      );

      // Navigate to result page
      router.push('/calculator/result');
    } catch (error) {
      console.error('Calculation error:', error);
      addToast({
        type: 'error',
        message: 'Failed to calculate tax. Try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-container-max px-margin-mobile py-12 md:px-margin-desktop">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-3xl"
      >
        {/* Header */}
        <div className="mb-8">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary-container/10 text-deep-green">
            <Icon name="calculate" className="text-3xl" />
          </span>
          <h1 className="mt-4 font-display-lg-mobile text-display-lg-mobile leading-tight text-deep-green">
            Personal Income Tax Calculator
          </h1>
          <p className="mt-3 font-body-lg text-body-lg text-on-surface-variant">
            Figure your tax wahala in 60 seconds. Gain clarity on your take-home
            pay versus deductions — fast, accurate, and built for the modern
            Nigerian workforce.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-tertiary-fixed/30 px-4 py-2 font-label-sm text-label-sm text-on-tertiary-fixed-variant">
            <Icon name="info" className="text-[16px]" />
            Educational purposes only — not legal or tax advice.
          </div>
        </div>

        {/* Form */}
        <div className="rounded-bento border border-deep-green/10 bg-surface-container-lowest p-8 shadow-[0px_20px_40px_rgba(0,100,0,0.08)] md:p-10">
          <CalcForm onSubmit={handleSubmit} loading={loading} />
        </div>

        {/* Info */}
        <p className="mt-8 text-center font-body-md text-sm text-on-surface-variant/70">
          Based on Nigeria Personal Income Tax rules ({rules.year}). Rules are
          configurable by admin.
        </p>
      </motion.div>
    </div>
  );
}
