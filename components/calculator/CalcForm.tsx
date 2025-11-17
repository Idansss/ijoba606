'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { calcInputsSchema, CalcInputsFormData } from '@/lib/validation/schemas';
import { cn } from '@/lib/utils/cn';

interface CalcFormProps {
  onSubmit: (data: CalcInputsFormData) => void;
  loading?: boolean;
}

export function CalcForm({ onSubmit, loading }: CalcFormProps) {
  const [period, setPeriod] = useState<'monthly' | 'annual'>('monthly');
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CalcInputsFormData>({
    resolver: zodResolver(calcInputsSchema),
    defaultValues: {
      period: 'monthly',
      basic: 0,
      housing: 0,
      transport: 0,
      other: 0,
      bonus: 0,
      pensionPct: 8,
      nhfEnabled: true,
      nhfAmount: 0,
      lifeAssurance: 0,
      voluntaryContrib: 0,
    },
  });

  const nhfEnabled = watch('nhfEnabled');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Period Toggle */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Calculation Period
        </label>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setPeriod('monthly')}
            className={cn(
              'flex-1 py-3 rounded-lg font-semibold transition-all',
              period === 'monthly'
                ? 'bg-white text-purple-600 shadow-md'
                : 'text-gray-600'
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setPeriod('annual')}
            className={cn(
              'flex-1 py-3 rounded-lg font-semibold transition-all',
              period === 'annual'
                ? 'bg-white text-purple-600 shadow-md'
                : 'text-gray-600'
            )}
          >
            Annual
          </button>
        </div>
        <input type="hidden" {...register('period')} value={period} />
      </div>

      {/* Employment Income */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          Employment Income ({period})
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Basic Salary
            </label>
            <input
              type="number"
              {...register('basic', { valueAsNumber: true })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
              placeholder="0"
            />
            {errors.basic && (
              <p className="text-red-500 text-sm mt-1">{errors.basic.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Housing Allowance
            </label>
            <input
              type="number"
              {...register('housing', { valueAsNumber: true })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
              placeholder="0"
            />
            {errors.housing && (
              <p className="text-red-500 text-sm mt-1">
                {errors.housing.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transport Allowance
            </label>
            <input
              type="number"
              {...register('transport', { valueAsNumber: true })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
              placeholder="0"
            />
            {errors.transport && (
              <p className="text-red-500 text-sm mt-1">
                {errors.transport.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Other Taxable Allowances
            </label>
            <input
              type="number"
              {...register('other', { valueAsNumber: true })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
              placeholder="0"
            />
            {errors.other && (
              <p className="text-red-500 text-sm mt-1">{errors.other.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bonus / 13th Month
            </label>
            <input
              type="number"
              {...register('bonus', { valueAsNumber: true })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
              placeholder="0"
            />
            {errors.bonus && (
              <p className="text-red-500 text-sm mt-1">{errors.bonus.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Deductions */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          Deductions & Reliefs
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pension Contribution (%)
            </label>
            <input
              type="number"
              step="0.1"
              {...register('pensionPct', { valueAsNumber: true })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
              placeholder="8"
            />
            <p className="text-xs text-gray-500 mt-1">
              Typically 8% of gross income
            </p>
            {errors.pensionPct && (
              <p className="text-red-500 text-sm mt-1">
                {errors.pensionPct.message}
              </p>
            )}
          </div>

          <div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                {...register('nhfEnabled')}
                className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-gray-700">
                National Housing Fund (NHF) - 2.5%
              </span>
            </label>
          </div>

          {nhfEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom NHF Amount (optional)
              </label>
              <input
                type="number"
                {...register('nhfAmount', { valueAsNumber: true })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                placeholder="Leave blank for auto 2.5%"
              />
            </motion.div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Life Assurance Premium (optional)
            </label>
            <input
              type="number"
              {...register('lifeAssurance', { valueAsNumber: true })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Voluntary Contributions (optional)
            </label>
            <input
              type="number"
              {...register('voluntaryContrib', { valueAsNumber: true })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold text-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Calculating...' : 'Calculate Tax'}
      </button>

      {/* Disclaimer */}
      <div className="text-center text-xs text-gray-500">
        <p>⚠️ Educational purposes only. Not legal or tax advice.</p>
      </div>
    </form>
  );
}


