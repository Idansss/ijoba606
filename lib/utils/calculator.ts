import { CalcInputs, CalcLineItem, CalcOutputs, PayeRules } from '@/lib/types';

/**
 * Pure function to compute PAYE tax based on configurable rules
 */
export function computeTax(inputs: CalcInputs, rules: PayeRules): CalcOutputs {
  const lineItems: CalcLineItem[] = [];

  // Step 1: Calculate gross income (annualized)
  const isMonthly = inputs.period === 'monthly';
  const multiplier = isMonthly ? 12 : 1;

  const annualBasic = inputs.basic * multiplier;
  const annualHousing = inputs.housing * multiplier;
  const annualTransport = inputs.transport * multiplier;
  const annualOther = inputs.other * multiplier;
  const annualBonus = inputs.bonus * multiplier;

  const grossIncome =
    annualBasic + annualHousing + annualTransport + annualOther + annualBonus;

  lineItems.push({ label: 'Gross Annual Income', amount: grossIncome });

  // Step 2: Calculate deductions
  let totalDeductions = 0;

  // Pension deduction
  if (rules.reliefs.pensionIsDeductible && inputs.pensionPct > 0) {
    const pensionDeduction = grossIncome * (inputs.pensionPct / 100);
    totalDeductions += pensionDeduction;
    lineItems.push({
      label: `Pension (${inputs.pensionPct}%)`,
      amount: pensionDeduction,
      isDeduction: true,
    });
  }

  // NHF deduction
  if (rules.reliefs.nhfIsDeductible && inputs.nhfEnabled) {
    const nhfDeduction = inputs.nhfAmount
      ? inputs.nhfAmount * multiplier
      : grossIncome * 0.025; // 2.5% default
    totalDeductions += nhfDeduction;
    lineItems.push({
      label: 'NHF (2.5%)',
      amount: nhfDeduction,
      isDeduction: true,
    });
  }

  // Life assurance
  if (inputs.lifeAssurance && inputs.lifeAssurance > 0) {
    let lifeAssuranceDeduction = inputs.lifeAssurance * multiplier;
    if (rules.reliefs.lifeAssuranceCap) {
      lifeAssuranceDeduction = Math.min(
        lifeAssuranceDeduction,
        rules.reliefs.lifeAssuranceCap
      );
    }
    totalDeductions += lifeAssuranceDeduction;
    lineItems.push({
      label: 'Life Assurance Premium',
      amount: lifeAssuranceDeduction,
      isDeduction: true,
    });
  }

  // Voluntary contributions
  if (inputs.voluntaryContrib && inputs.voluntaryContrib > 0) {
    const voluntaryDeduction = inputs.voluntaryContrib * multiplier;
    totalDeductions += voluntaryDeduction;
    lineItems.push({
      label: 'Voluntary Contributions',
      amount: voluntaryDeduction,
      isDeduction: true,
    });
  }

  const incomeAfterDeductions = grossIncome - totalDeductions;
  lineItems.push({
    label: 'Total Deductions',
    amount: totalDeductions,
    isDeduction: true,
  });

  // Step 3: Apply personal allowance
  let personalAllowance = 0;
  const { type, value } = rules.personalAllowance;

  if (type === 'fixed') {
    personalAllowance = value;
  } else if (type === 'percentOfGross') {
    personalAllowance = grossIncome * value;
  } else if (type === 'hybrid') {
    // Higher of 20% of gross or 200,000 (Nigerian typical hybrid rule)
    const percentAmount = grossIncome * 0.2;
    const fixedAmount = 200000;
    personalAllowance = Math.max(percentAmount, fixedAmount);
  }

  lineItems.push({
    label: 'Personal Allowance',
    amount: personalAllowance,
    isDeduction: true,
  });

  // Step 4: Calculate taxable income
  const taxableIncome = Math.max(0, incomeAfterDeductions - personalAllowance);
  lineItems.push({ label: 'Taxable Income', amount: taxableIncome });

  // Step 5: Apply progressive tax brackets
  let annualTax = 0;
  let remainingIncome = taxableIncome;

  for (let i = 0; i < rules.brackets.length; i++) {
    const bracket = rules.brackets[i];
    const prevLimit = i > 0 ? rules.brackets[i - 1].upTo : 0;
    const bracketSize = bracket.upTo === Infinity ? Infinity : bracket.upTo - prevLimit;

    if (remainingIncome <= 0) break;

    const taxableInBracket = Math.min(remainingIncome, bracketSize);
    const taxInBracket = taxableInBracket * bracket.rate;
    annualTax += taxInBracket;

    lineItems.push({
      label: `Tax on ${formatCurrency(taxableInBracket)} @ ${(bracket.rate * 100).toFixed(1)}%`,
      amount: taxInBracket,
    });

    remainingIncome -= taxableInBracket;
  }

  const monthlyTax = annualTax / 12;
  const effectiveRate = grossIncome > 0 ? annualTax / grossIncome : 0;

  return {
    annualTax,
    monthlyTax,
    taxableIncome,
    effectiveRate,
    lineItems,
    assumptionsNote: rules.notes,
  };
}

/**
 * Format currency (NGN)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Default PAYE rules for Nigeria (2025)
 */
export const DEFAULT_PAYE_RULES: PayeRules = {
  currency: 'NGN',
  year: 2025,
  reliefs: {
    pensionIsDeductible: true,
    nhfIsDeductible: true,
    lifeAssuranceCap: undefined,
  },
  brackets: [
    { upTo: 300000, rate: 0.07 },     // First 300k @ 7%
    { upTo: 600000, rate: 0.11 },     // Next 300k @ 11%
    { upTo: 1100000, rate: 0.15 },    // Next 500k @ 15%
    { upTo: 1600000, rate: 0.19 },    // Next 500k @ 19%
    { upTo: 3200000, rate: 0.21 },    // Next 1.6M @ 21%
    { upTo: Infinity, rate: 0.24 },   // Above 3.2M @ 24%
  ],
  personalAllowance: {
    type: 'hybrid',
    value: 200000, // Higher of 20% of gross or ₦200,000
  },
  notes:
    'Educational purposes only. Not legal or tax advice. Based on Nigeria PAYE 2025 estimates. Consult a tax professional for your specific situation.',
};


