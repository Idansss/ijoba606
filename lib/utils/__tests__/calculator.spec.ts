import { describe, it, expect } from 'vitest';
import { computeTax, DEFAULT_PAYE_RULES } from '../calculator';
import { CalcInputs, PayeRules } from '@/lib/types';

describe('Calculator Engine', () => {
  const testRules: PayeRules = {
    currency: 'NGN',
    year: 2025,
    reliefs: {
      pensionIsDeductible: true,
      nhfIsDeductible: true,
    },
    brackets: [
      { upTo: 300000, rate: 0.07 },
      { upTo: 600000, rate: 0.11 },
      { upTo: Infinity, rate: 0.15 },
    ],
    personalAllowance: {
      type: 'fixed',
      value: 200000,
    },
    notes: 'Test rules',
  };

  it('should calculate tax with no deductions', () => {
    const inputs: CalcInputs = {
      period: 'annual',
      basic: 600000,
      housing: 0,
      transport: 0,
      other: 0,
      bonus: 0,
      pensionPct: 0,
      nhfEnabled: false,
    };

    const outputs = computeTax(inputs, testRules);

    // Gross: 600,000
    // Personal allowance: 200,000
    // Taxable: 400,000
    // Tax: (300,000 * 0.07) + (100,000 * 0.11) = 21,000 + 11,000 = 32,000
    expect(outputs.annualTax).toBe(32000);
    expect(outputs.monthlyTax).toBe(32000 / 12);
    expect(outputs.taxableIncome).toBe(400000);
  });

  it('should apply pension deduction', () => {
    const inputs: CalcInputs = {
      period: 'annual',
      basic: 1000000,
      housing: 0,
      transport: 0,
      other: 0,
      bonus: 0,
      pensionPct: 8,
      nhfEnabled: false,
    };

    const outputs = computeTax(inputs, testRules);

    // Gross: 1,000,000
    // Pension (8%): 80,000
    // After pension: 920,000
    // Personal allowance: 200,000
    // Taxable: 720,000
    // Tax: (300,000 * 0.07) + (300,000 * 0.11) + (120,000 * 0.15)
    // = 21,000 + 33,000 + 18,000 = 72,000
    expect(outputs.annualTax).toBe(72000);
  });

  it('should apply NHF deduction', () => {
    const inputs: CalcInputs = {
      period: 'annual',
      basic: 1000000,
      housing: 0,
      transport: 0,
      other: 0,
      bonus: 0,
      pensionPct: 0,
      nhfEnabled: true,
    };

    const outputs = computeTax(inputs, testRules);

    // Gross: 1,000,000
    // NHF (2.5%): 25,000
    // After NHF: 975,000
    // Personal allowance: 200,000
    // Taxable: 775,000
    expect(outputs.taxableIncome).toBe(775000);
  });

  it('should convert monthly to annual correctly', () => {
    const monthlyInputs: CalcInputs = {
      period: 'monthly',
      basic: 100000,
      housing: 0,
      transport: 0,
      other: 0,
      bonus: 0,
      pensionPct: 0,
      nhfEnabled: false,
    };

    const annualInputs: CalcInputs = {
      ...monthlyInputs,
      period: 'annual',
      basic: 1200000,
    };

    const monthlyOutputs = computeTax(monthlyInputs, testRules);
    const annualOutputs = computeTax(annualInputs, testRules);

    expect(monthlyOutputs.annualTax).toBe(annualOutputs.annualTax);
  });

  it('should calculate effective rate correctly', () => {
    const inputs: CalcInputs = {
      period: 'annual',
      basic: 1000000,
      housing: 0,
      transport: 0,
      other: 0,
      bonus: 0,
      pensionPct: 0,
      nhfEnabled: false,
    };

    const outputs = computeTax(inputs, testRules);

    const expectedRate = outputs.annualTax / 1000000;
    expect(outputs.effectiveRate).toBeCloseTo(expectedRate, 5);
  });

  it('should handle bracket boundaries correctly', () => {
    const inputs: CalcInputs = {
      period: 'annual',
      basic: 500000, // Exactly at second bracket limit
      housing: 0,
      transport: 0,
      other: 0,
      bonus: 0,
      pensionPct: 0,
      nhfEnabled: false,
    };

    const outputs = computeTax(inputs, testRules);

    // Gross: 500,000
    // Personal allowance: 200,000
    // Taxable: 300,000 (exactly at first bracket limit)
    // Tax: 300,000 * 0.07 = 21,000
    expect(outputs.annualTax).toBe(21000);
  });
});


