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

export default function CalculatorPage() {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [rules, setRules] = useState<PayeRules>(DEFAULT_PAYE_RULES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch PAYE rules from Firestore
    const fetchRules = async () => {
      try {
        const rulesRef = doc(db, 'configs', 'payeRules');
        const rulesSnap = await getDoc(rulesRef);
        if (rulesSnap.exists()) {
          setRules(rulesSnap.data() as PayeRules);
        }
      } catch (error) {
        console.error('Error fetching PAYE rules:', error);
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
    <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🧮</div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Personal Income Tax Calculator
          </h1>
          <p className="text-gray-600">
            Figure your tax wahala in 60 seconds. Monthly or annual, with clean
            breakdown.
          </p>
          <div className="mt-4 inline-block px-4 py-2 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
            <p className="text-sm text-yellow-800">
              ⚠️ Educational purposes only. Not legal or tax advice.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border-2 border-gray-200">
          <CalcForm onSubmit={handleSubmit} loading={loading} />
        </div>

        {/* Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            💡 Based on Nigeria PAYE rules ({rules.year}). Rules are
            configurable by admin.
          </p>
        </div>
      </motion.div>
    </div>
  );
}


