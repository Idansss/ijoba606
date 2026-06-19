'use client';

import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { calcInputsSchema, CalcInputsFormData } from '@/lib/validation/schemas';
import { ReliefType } from '@/lib/types';
import { cn } from '@/lib/utils/cn';
import { Plus, X } from 'lucide-react';
import { Select } from '@/components/ui/Select';

interface CalcFormProps {
  onSubmit: (data: CalcInputsFormData) => void;
  loading?: boolean;
}

const RELIEF_OPTIONS: { value: ReliefType; label: string; helper?: string }[] = [
  { value: 'gifts', label: 'Gifts', helper: 'Gifts received (exempt from tax)' },
  { value: 'rent_relief', label: 'Rent', helper: '20% of annual rent (max ₦500,000)' },
  { value: 'charity_religious', label: 'Charity/Religious Institution', helper: 'Income from pension funds, charities, religious institutions (non-commercial)' },
  { value: 'employment_compensation', label: 'Employment Compensation', helper: 'Compensation for loss of employment (up to ₦50 million)' },
  { value: 'housing_interest', label: 'Interest on Housing Loan', helper: 'Interest on loans for owner-occupied residential housing' },
  { value: 'life_insurance', label: 'Life Insurance Premium', helper: 'Life insurance or annuity premiums' },
  { value: 'nhf', label: 'National Housing Fund (NHF)', helper: 'NHF contributions' },
  { value: 'nhis', label: 'National Health Insurance Scheme (NHIS)', helper: 'NHIS contributions' },
  { value: 'owner_occupied_house', label: 'Sale of Owner-Occupied House', helper: 'Sale of owner-occupied residential house (exempt)' },
  { value: 'pension', label: 'Pension Contribution (PFA)', helper: 'Contributions to Pension Fund Administrator' },
  { value: 'pension_funds', label: 'Pension Funds & Assets (PRA)', helper: 'Pension funds and assets under Pension Reform Act (tax-exempt)' },
  { value: 'personal_effects', label: 'Personal Effects/ Chattels', helper: 'Personal effects or chattels worth up to ₦5 million (exempt)' },
  { value: 'private_vehicles', label: 'Sale of Private Vehicles', helper: 'Sale of up to two private vehicles per year (exempt)' },
  { value: 'retirement_benefits', label: 'Retirement Benefits (PRA)', helper: 'Pension, gratuity or retirement benefits under PRA' },
  { value: 'share_gains', label: 'Share Gains (Below Threshold)', helper: 'Gains on shares below ₦150M/year or gains up to ₦10M (exempt)' },
  { value: 'share_gains_reinvested', label: 'Share Gains (Reinvested)', helper: 'Gains on shares above threshold if proceeds reinvested (exempt)' },
];

export function CalcForm({ onSubmit, loading }: CalcFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    control,
  } = useForm<CalcInputsFormData>({
    resolver: zodResolver(calcInputsSchema),
    defaultValues: {
      earnerType: 'non-salary',
      period: 'annual',
      grossIncome: 0,
      reliefs: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'reliefs',
  });

  const handleAddRelief = () => {
    append({ type: 'gifts', amount: 0 });
  };

  // Format number with commas for display
  const formatNumber = (value: number | string | undefined): string => {
    if (value === undefined || value === null || value === '' || value === 0) return '';
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
    if (isNaN(numValue) || numValue === 0) return '';
    return numValue.toLocaleString('en-NG');
  };

  // Parse formatted number string back to number
  const parseNumber = (value: string): number => {
    const cleaned = value.replace(/,/g, '').trim();
    return cleaned ? parseFloat(cleaned) || 0 : 0;
  };

  const handleRentReliefChange = (index: number, annualRent: number) => {
    const reliefAmount = Math.min(annualRent * 0.2, 500000); // 20% of rent, max ₦500,000
    setValue(`reliefs.${index}.amount`, reliefAmount);
    setValue(`reliefs.${index}.annualRent`, annualRent);
  };

  const renderInput = (
    label: string,
    name: keyof CalcInputsFormData,
    options: { helper?: string; step?: string } = {}
  ) => (
    <div>
      <label className="font-label-sm text-sm font-semibold text-on-surface-variant">{label}</label>
      <input
        type="number"
        step={options.step}
        {...register(name, { valueAsNumber: true })}
        className="mt-2 w-full rounded-input border border-outline-variant bg-surface-container-low px-4 py-3 text-on-surface transition focus:border-forest-green focus:outline-none focus:ring-2 focus:ring-forest-green/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      {options.helper && (
        <p className="mt-1 text-xs text-on-surface-variant/60">{options.helper}</p>
      )}
      {errors[name] && (
        <p className="mt-1 text-xs text-rose-500">{errors[name]?.message}</p>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
      <input type="hidden" {...register('earnerType')} value="non-salary" />
      <input type="hidden" {...register('period')} value="annual" />

      {/* Income Section */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 rounded-input border border-outline-variant/30 bg-surface-container-low p-6"
      >
        <div>
          <p className="font-label-sm text-xs font-semibold uppercase tracking-[0.2em] text-forest-green">
            Total income
          </p>
          <p className="mt-2 text-xs text-on-surface-variant">
            Enter income amount (this could be a sum of your income or specific income)
          </p>
        </div>
        <div>
          <label className="font-label-sm text-sm font-semibold text-on-surface-variant">Income Amount</label>
          <Controller
            name="grossIncome"
            control={control}
            render={({ field: { onChange, value } }) => (
              <input
                type="text"
                inputMode="numeric"
                defaultValue={value ? formatNumber(value) : ''}
                onKeyDown={(e) => {
                  // Allow: backspace, delete, tab, escape, enter, decimal point, and numbers
                  if (
                    [46, 8, 9, 27, 13, 110, 190].indexOf(e.keyCode) !== -1 ||
                    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                    (e.keyCode === 65 && e.ctrlKey === true) ||
                    (e.keyCode === 67 && e.ctrlKey === true) ||
                    (e.keyCode === 86 && e.ctrlKey === true) ||
                    (e.keyCode === 88 && e.ctrlKey === true) ||
                    // Allow: home, end, left, right
                    (e.keyCode >= 35 && e.keyCode <= 39)
                  ) {
                    return;
                  }
                  // Ensure that it is a number and stop the keypress
                  if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow only digits and commas (remove decimal point for whole numbers)
                  const cleaned = value.replace(/[^\d,]/g, '');
                  e.target.value = cleaned;
                  const parsed = parseNumber(cleaned);
                  onChange(parsed);
                }}
                onBlur={(e) => {
                  const parsed = parseNumber(e.target.value);
                  e.target.value = formatNumber(parsed);
                  onChange(parsed);
                }}
                className="mt-2 w-full rounded-input border border-outline-variant bg-surface-container-low px-4 py-3 text-on-surface transition focus:border-forest-green focus:outline-none focus:ring-2 focus:ring-forest-green/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="Enter income amount"
              />
            )}
          />
          {errors.grossIncome && (
            <p className="mt-1 text-xs text-rose-500">{errors.grossIncome?.message}</p>
          )}
        </div>
      </motion.section>

      {/* Reliefs & Exemptions Section */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 rounded-input border border-outline-variant/30 bg-surface-container-low p-6"
      >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-label-sm text-xs font-semibold uppercase tracking-[0.2em] text-forest-green">
                  Tax Reliefs & Exemptions
                </p>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Add reliefs and exemptions that apply to you
                </p>
              </div>
              {fields.length === 0 && (
                <button
                  type="button"
                  onClick={handleAddRelief}
                  className="flex items-center gap-2 rounded-full bg-deep-green px-4 py-2 font-label-sm text-sm font-semibold text-on-primary transition hover:bg-forest-green"
                >
                  <Plus className="h-4 w-4" />
                  Add Relief
                </button>
              )}
            </div>

            <AnimatePresence>
              {fields.map((field, index) => {
                const reliefType = watch(`reliefs.${index}.type`) as ReliefType;
                const isRentRelief = reliefType === 'rent_relief';
                
                return (
              <motion.div
                    key={field.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-input border border-outline-variant/30 bg-surface-container-low p-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 space-y-4">
                        <div>
                          <label className="font-label-sm text-sm font-semibold text-on-surface-variant">
                            Relief Type
                          </label>
                          <Controller
                            control={control}
                            name={`reliefs.${index}.type`}
                            render={({ field }) => (
                              <Select
                                value={field.value ?? ''}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                className="mt-2 px-4 py-3"
                                options={RELIEF_OPTIONS.map((option) => ({
                                  value: option.value,
                                  label: option.label,
                                }))}
                              />
                            )}
                          />
                          {RELIEF_OPTIONS.find((opt) => opt.value === reliefType)?.helper && (
                            <p className="mt-1 text-xs text-on-surface-variant/60">
                              {RELIEF_OPTIONS.find((opt) => opt.value === reliefType)?.helper}
                            </p>
                          )}
                        </div>

                        {isRentRelief ? (
                          <div>
                            <label className="font-label-sm text-sm font-semibold text-on-surface-variant">
                              Annual Rent
                            </label>
                            <Controller
                              name={`reliefs.${index}.annualRent`}
                              control={control}
                              render={({ field: { onChange, value } }) => (
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  defaultValue={value ? formatNumber(value) : ''}
                                  onKeyDown={(e) => {
                                    // Allow: backspace, delete, tab, escape, enter, decimal point, and numbers
                                    if (
                                      [46, 8, 9, 27, 13, 110, 190].indexOf(e.keyCode) !== -1 ||
                                      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                                      (e.keyCode === 65 && e.ctrlKey === true) ||
                                      (e.keyCode === 67 && e.ctrlKey === true) ||
                                      (e.keyCode === 86 && e.ctrlKey === true) ||
                                      (e.keyCode === 88 && e.ctrlKey === true) ||
                                      // Allow: home, end, left, right
                                      (e.keyCode >= 35 && e.keyCode <= 39)
                                    ) {
                                      return;
                                    }
                                    // Ensure that it is a number and stop the keypress
                                    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                                      e.preventDefault();
                                    }
                                  }}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    // Allow only digits and commas
                                    const cleaned = value.replace(/[^\d,]/g, '');
                                    e.target.value = cleaned;
                                    const parsed = parseNumber(cleaned);
                                    onChange(parsed);
                                    handleRentReliefChange(index, parsed);
                                  }}
                                  onBlur={(e) => {
                                    const parsed = parseNumber(e.target.value);
                                    e.target.value = formatNumber(parsed);
                                    onChange(parsed);
                                    handleRentReliefChange(index, parsed);
                                  }}
                                  className="mt-2 w-full rounded-input border border-outline-variant bg-surface-container-low px-4 py-3 text-on-surface transition focus:border-forest-green focus:outline-none focus:ring-2 focus:ring-forest-green/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  placeholder="Enter annual rent"
                                />
                              )}
                            />
                            <input
                              type="hidden"
                              {...register(`reliefs.${index}.amount`, { valueAsNumber: true })}
                            />
                            <p className="mt-1 text-xs text-on-surface-variant">
                              Relief amount: ₦{watch(`reliefs.${index}.amount`)?.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'} (20% of rent, max ₦500,000)
                            </p>
                          </div>
                        ) : (
                          <div>
                            <label className="font-label-sm text-sm font-semibold text-on-surface-variant">
                              Amount
                </label>
                            <Controller
                              name={`reliefs.${index}.amount`}
                              control={control}
                              render={({ field: { onChange, value } }) => (
                <input
                                  type="text"
                                  defaultValue={value ? formatNumber(value) : ''}
                                  onChange={(e) => {
                                    const parsed = parseNumber(e.target.value);
                                    onChange(parsed);
                                  }}
                                  onBlur={(e) => {
                                    const parsed = parseNumber(e.target.value);
                                    e.target.value = formatNumber(parsed);
                                    onChange(parsed);
                                  }}
                                  className="mt-2 w-full rounded-input border border-outline-variant bg-surface-container-low px-4 py-3 text-on-surface transition focus:border-forest-green focus:outline-none focus:ring-2 focus:ring-forest-green/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  placeholder="Enter amount"
                                />
                              )}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="mt-2 rounded-full p-2 text-on-surface-variant transition hover:bg-surface-container-high hover:text-error"
                        >
                          <X className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleAddRelief}
                          className="rounded-full p-2 text-deep-green transition hover:bg-deep-green/10"
                          title="Add another relief"
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
              </motion.div>
                );
              })}
            </AnimatePresence>

            {fields.length === 0 && (
              <div className="rounded-input border-2 border-dashed border-outline-variant bg-surface-container-low p-8 text-center">
                <p className="text-sm text-on-surface-variant">
                  No reliefs added. Click "Add Relief" to add applicable tax reliefs and exemptions.
                </p>
              </div>
            )}
          </motion.section>

          {/* Reliefs & Exemptions Section */}

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-deep-green px-6 py-4 font-label-sm text-base font-semibold text-on-primary shadow-md transition hover:bg-forest-green disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Calculating...' : 'Calculate Personal Income Tax'}
      </button>
    </form>
  );
}
