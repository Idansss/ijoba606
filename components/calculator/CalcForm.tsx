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

  const renderInput = (
    label: string,
    name: keyof CalcInputsFormData,
    options: { helper?: string; step?: string } = {}
  ) => (
    <div>
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      <input
        type="number"
        step={options.step}
        {...register(name, { valueAsNumber: true })}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 transition focus:border-purple-300 focus:outline-none"
      />
      {options.helper && (
        <p className="mt-1 text-xs text-slate-400">{options.helper}</p>
      )}
      {errors[name] && (
        <p className="mt-1 text-xs text-rose-500">{errors[name]?.message}</p>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
      <div>
        <label className="text-sm font-semibold text-slate-700">
          Calculation period
        </label>
        <div className="mt-3 flex gap-2 rounded-full border border-slate-100 bg-white/80 p-1">
          {(['monthly', 'annual'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setPeriod(value)}
              className={cn(
                'flex-1 rounded-full px-4 py-2 text-sm font-semibold capitalize transition',
                period === value
                  ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              {value}
            </button>
          ))}
        </div>
        <input type="hidden" {...register('period')} value={period} />
      </div>

      <section className="space-y-4 rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Employment income ({period})
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {renderInput('Basic salary', 'basic')}
          {renderInput('Housing allowance', 'housing')}
          {renderInput('Transport allowance', 'transport')}
          {renderInput('Other allowances', 'other')}
          {renderInput('Bonus / 13th month', 'bonus')}
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          Deductions & reliefs
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {renderInput('Pension contribution (%)', 'pensionPct', {
            helper: 'Typically 8% of gross',
            step: '0.1',
          })}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                {...register('nhfEnabled')}
                className="h-5 w-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm font-semibold text-slate-700">
                Enable National Housing Fund (2.5%)
              </span>
            </label>
            {nhfEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Custom NHF amount (optional)
                </label>
                <input
                  type="number"
                  {...register('nhfAmount', { valueAsNumber: true })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-slate-800 focus:border-purple-300 focus:outline-none"
                />
              </motion.div>
            )}
          </div>
          {renderInput('Life assurance premium', 'lifeAssurance')}
          {renderInput('Voluntary contributions', 'voluntaryContrib')}
        </div>
      </section>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-gradient-to-r from-purple-600 to-blue-500 px-6 py-4 text-lg font-semibold text-white shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Calculating...' : 'Calculate PAYE'}
      </button>
    </form>
  );
}
