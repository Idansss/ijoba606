'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth';
import { useToastStore } from '@/lib/store/toast';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { PayeRules, CalcInputs, CalcOutputs } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { payeRulesSchema, PayeRulesFormData } from '@/lib/validation/schemas';
import { computeTax, DEFAULT_PAYE_RULES, formatCurrency } from '@/lib/utils/calculator';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';
import { ArrowLeft } from 'lucide-react';

export default function AdminRulesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthStore();
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(true);
  const [testInputs, setTestInputs] = useState<CalcInputs>({
    earnerType: 'salary',
    period: 'monthly',
    basic: 100000,
    housing: 0,
    transport: 0,
    other: 0,
    bonus: 0,
    pensionPct: 8,
    nhfEnabled: true,
  });
  const [testResults, setTestResults] = useState<CalcOutputs | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PayeRulesFormData>({
    resolver: zodResolver(payeRulesSchema),
    defaultValues: DEFAULT_PAYE_RULES,
  });

  useEffect(() => {
    if (!authLoading && user?.role !== 'admin') {
      addToast({ type: 'error', message: 'Admin access required' });
      router.push('/admin/login');
    }
  }, [user, authLoading, router, addToast]);

  const fetchRules = useCallback(async () => {
    try {
      if (!db) {
        setLoading(false);
        return;
      }
      const rulesRef = doc(db, 'configs', 'payeRules');
      const rulesSnap = await getDoc(rulesRef);
      
      if (rulesSnap.exists()) {
        const rules = rulesSnap.data() as PayeRules;
        // Convert Infinity back from stored number
        const brackets = rules.brackets.map(b => ({
          ...b,
          upTo: b.upTo >= 9999999999 ? Infinity : b.upTo
        }));
        reset({ ...rules, brackets });
      } else {
        reset(DEFAULT_PAYE_RULES);
      }
    } catch (error) {
      console.error('Error fetching rules:', error);
      addToast({ type: 'error', message: 'Failed to fetch rules' });
    } finally {
      setLoading(false);
    }
  }, [addToast, reset]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchRules();
    }
  }, [user, fetchRules]);

  const onSubmit = async (data: PayeRulesFormData) => {
    try {
      if (!db) {
        addToast({
          type: 'error',
          message: 'Admin rules editing is disabled in this local demo (no Firebase configuration).',
        });
        return;
      }
      // Convert Infinity to a large number for Firestore
      const brackets = data.brackets.map(b => ({
        ...b,
        upTo: b.upTo === Infinity ? 9999999999 : b.upTo
      }));

      const rulesToSave = { ...data, brackets };

      // Save via Cloud Function (if implemented) or directly
      const rulesRef = doc(db, 'configs', 'payeRules');
      await setDoc(rulesRef, rulesToSave);

      addToast({ type: 'success', message: 'PAYE rules updated successfully! 🎉' });
    } catch (error) {
      console.error('Error saving rules:', error);
      addToast({ type: 'error', message: 'Failed to save rules. Try again.' });
    }
  };

  const handleTestCalculation = () => {
    const currentRules = watch();
    try {
      const outputs = computeTax(testInputs, currentRules as PayeRules);
      setTestResults(outputs);
    } catch (error) {
      console.error('Test calculation error:', error);
      addToast({ type: 'error', message: 'Invalid rules configuration' });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <AdminBreadcrumb items={[{ label: 'PAYE Rules' }]} />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/admin"
              className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-semibold">Back to Dashboard</span>
            </Link>
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            PAYE Rules Configuration
          </h1>
          <p className="text-gray-600">
            Configure tax brackets, reliefs, and personal allowance rules
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Info */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Basic Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tax Year
                    </label>
                    <input
                      type="number"
                      {...register('year', { valueAsNumber: true })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                    />
                    {errors.year && (
                      <p className="text-red-500 text-sm mt-1">{errors.year.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Currency
                    </label>
                    <input
                      type="text"
                      {...register('currency')}
                      disabled
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl bg-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* Reliefs */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Reliefs & Deductions</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      {...register('reliefs.pensionIsDeductible')}
                      className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Pension is deductible
                    </span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      {...register('reliefs.nhfIsDeductible')}
                      className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      NHF is deductible
                    </span>
                  </label>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Life Assurance Cap (optional)
                    </label>
                    <input
                      type="number"
                      {...register('reliefs.lifeAssuranceCap', { valueAsNumber: true })}
                      placeholder="Leave blank for no cap"
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Tax Brackets */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Tax Brackets</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Define progressive tax rates. For the last bracket, use 9999999999 for &quot;Infinity&quot;
                </p>
                <div className="space-y-3">
                  {[0, 1, 2, 3, 4, 5].map((idx) => (
                    <div key={idx} className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Up to (₦)
                        </label>
                        <input
                          type="number"
                          {...register(`brackets.${idx}.upTo`, { valueAsNumber: true })}
                          placeholder="e.g., 300000"
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Rate (decimal)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          {...register(`brackets.${idx}.rate`, { valueAsNumber: true })}
                          placeholder="e.g., 0.07"
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Personal Allowance */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Personal Allowance</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Type
                    </label>
                    <select
                      {...register('personalAllowance.type')}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                    >
                      <option value="fixed">Fixed Amount</option>
                      <option value="percentOfGross">Percent of Gross</option>
                      <option value="hybrid">Hybrid (Higher of % or fixed)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Value
                    </label>
                    <input
                      type="number"
                      {...register('personalAllowance.value', { valueAsNumber: true })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      For fixed: NGN amount. For percent: decimal (e.g., 0.2 = 20%)
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Disclaimer Notes</h3>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none resize-none"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
              >
                Save PAYE Rules
              </button>
            </form>
          </div>

          {/* Test Calculator */}
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-gray-200 sticky top-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Test Calculator</h3>
              <p className="text-sm text-gray-600 mb-4">
                Test your rules with sample inputs
              </p>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Monthly Basic Salary (₦)
                  </label>
                  <input
                    type="number"
                    value={testInputs.basic}
                    onChange={(e) =>
                      setTestInputs({ ...testInputs, basic: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Pension % (e.g., 8)
                  </label>
                  <input
                    type="number"
                    value={testInputs.pensionPct}
                    onChange={(e) =>
                      setTestInputs({ ...testInputs, pensionPct: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-sm"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestCalculation}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all mb-4"
              >
                Calculate Test
              </button>

              {testResults && (
                <div className="space-y-3 pt-4 border-t-2 border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Annual Tax:</span>
                    <span className="font-bold text-gray-900">
                      {formatCurrency(testResults.annualTax)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Monthly Tax:</span>
                    <span className="font-bold text-purple-600">
                      {formatCurrency(testResults.monthlyTax)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Effective Rate:</span>
                    <span className="font-bold text-gray-900">
                      {(testResults.effectiveRate * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

