import { CalcInputs, CalcLineItem, CalcOutputs, PayeRules } from '@/lib/types';

/**
 * Pure function to compute Personal Income Tax based on configurable rules
 */
export function computeTax(inputs: CalcInputs, rules: PayeRules): CalcOutputs {
  const lineItems: CalcLineItem[] = [];

  // Step 1: Calculate gross income (annualized)
  let grossIncome = 0;

  if (inputs.earnerType === 'non-salary') {
    // For non-salary earners, grossIncome is always annual (no monthly/annual conversion)
    grossIncome = inputs.grossIncome || 0;
  } else {
    // For salary earners, sum up all components
    const isMonthly = inputs.period === 'monthly';
    const multiplier = isMonthly ? 12 : 1;
    const annualBasic = (inputs.basic || 0) * multiplier;
    const annualHousing = (inputs.housing || 0) * multiplier;
    const annualTransport = (inputs.transport || 0) * multiplier;
    const annualOther = (inputs.other || 0) * multiplier;
    const annualBonus = (inputs.bonus || 0) * multiplier;

    grossIncome =
      annualBasic + annualHousing + annualTransport + annualOther + annualBonus;
  }

  lineItems.push({ label: 'Income Amount', amount: grossIncome });

  // Step 2: Calculate deductions
  let totalDeductions = 0;

  if (inputs.earnerType === 'non-salary' && inputs.reliefs && inputs.reliefs.length > 0) {
    // Process reliefs for non-salary earners
    inputs.reliefs.forEach((relief) => {
      let reliefAmount = relief.amount || 0;
      let reliefLabel = '';

      switch (relief.type) {
        case 'pension':
          reliefLabel = 'Pension Contribution (PFA)';
          break;
        case 'nhis':
          reliefLabel = 'National Health Insurance Scheme (NHIS)';
          break;
        case 'nhf':
          reliefLabel = 'National Housing Fund (NHF)';
          break;
        case 'housing_interest':
          reliefLabel = 'Interest on Housing Loan';
          break;
        case 'life_insurance':
          reliefLabel = 'Life Insurance Premium';
          break;
        case 'rent_relief':
          // Rent is 20% of annual rent, capped at ₦500,000
          if (relief.annualRent) {
            reliefAmount = Math.min(relief.annualRent * 0.2, 500000);
          }
          reliefLabel = 'Rent (20% of annual rent, max ₦500,000)';
          break;
        case 'gifts':
          reliefLabel = 'Gifts (Exempt)';
          break;
        case 'pension_funds':
          reliefLabel = 'Pension Funds & Assets (PRA)';
          break;
        case 'retirement_benefits':
          reliefLabel = 'Retirement Benefits (PRA)';
          break;
        case 'employment_compensation':
          // Compensation capped at ₦50 million
          reliefAmount = Math.min(relief.amount, 50000000);
          reliefLabel = 'Employment Compensation (max ₦50 million)';
          break;
        case 'owner_occupied_house':
          reliefLabel = 'Sale of Owner-Occupied House (Exempt)';
          break;
        case 'personal_effects':
          // Personal effects capped at ₦5 million
          reliefAmount = Math.min(relief.amount, 5000000);
          reliefLabel = 'Personal Effects/Chattels (max ₦5 million)';
          break;
        case 'private_vehicles':
          reliefLabel = 'Sale of Private Vehicles (up to 2 per year, Exempt)';
          break;
        case 'share_gains':
          // Share gains: below ₦150M/year OR gains up to ₦10M (both exempt)
          // If amount is <= ₦10M, fully exempt; if > ₦10M but <= ₦150M, also exempt
          if (relief.amount <= 10000000 || relief.amount <= 150000000) {
            reliefAmount = relief.amount;
            reliefLabel = relief.amount <= 10000000 
              ? 'Share Gains (up to ₦10M, Exempt)'
              : 'Share Gains (below ₦150M/year, Exempt)';
          } else {
            // Above ₦150M - only ₦150M is exempt
            reliefAmount = 150000000;
            reliefLabel = 'Share Gains (₦150M exempt portion)';
          }
          break;
        case 'share_gains_reinvested':
          reliefLabel = 'Share Gains (Reinvested, Exempt)';
          break;
        case 'charity_religious':
          reliefLabel = 'Charity/Religious Institution Income (Exempt)';
          break;
      }

      if (reliefAmount > 0) {
        totalDeductions += reliefAmount;
        lineItems.push({
          label: reliefLabel,
          amount: reliefAmount,
          isDeduction: true,
        });
      }
    });
  } else if (inputs.earnerType === 'salary') {
    const isMonthly = inputs.period === 'monthly';
    const multiplier = isMonthly ? 12 : 1;
    
    // Pension deduction
    if (rules.reliefs.pensionIsDeductible && (inputs.pensionPct || 0) > 0) {
      const pensionDeduction = grossIncome * ((inputs.pensionPct || 0) / 100);
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
  }

  const incomeAfterDeductions = grossIncome - totalDeductions;
  if (totalDeductions > 0) {
    lineItems.push({
      label: 'Total Deductions',
      amount: totalDeductions,
      isDeduction: true,
    });
  }

  // Step 3: Calculate taxable income (personal allowance removed - not applied)
  // Personal allowance is not included in the calculation
  const taxableIncome = incomeAfterDeductions;
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
      label: `Tax on ${formatCurrency(taxableInBracket)} @ ${(bracket.rate * 100).toFixed(0)}%`,
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
 * Default Personal Income Tax rules for Nigeria (2025)
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
    { upTo: 800000, rate: 0.00 },      // First NGN 800,000 @ 0%
    { upTo: 3000000, rate: 0.15 },     // Next NGN 2,200,000 @ 15%
    { upTo: 12000000, rate: 0.18 },    // Next NGN 9,000,000 @ 18%
    { upTo: 25000000, rate: 0.21 },    // Next NGN 13,000,000 @ 21%
    { upTo: 50000000, rate: 0.23 },    // Next NGN 25,000,000 @ 23%
    { upTo: Infinity, rate: 0.25 },    // Above NGN 50,000,000 @ 25%
  ],
  personalAllowance: {
    type: 'hybrid',
    value: 200000, // Higher of 20% of gross or ₦200,000
  },
  notes:
    'Educational purposes only. Not legal or tax advice. Based on Nigeria Personal Income Tax 2025 rates. Consult a tax professional for your specific situation.',
};


