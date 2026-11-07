/**
 * Affordability math.
 *
 * Everything in ASSUMPTION_NOTES is an input assumption, not a program rule and
 * not a lending decision. Rates change; the UI shows the values used.
 */
import type { BuyerProfile } from "@/lib/profile/types";
import { totalAnnualIncome } from "@/lib/profile/completeness";

export interface AffordabilityAssumptions {
  /** Annual interest rate as a decimal, e.g. 0.0718. */
  interestRate: number;
  termYears: number;
  propertyTaxRate: number;
  insuranceRate: number;
  /** Share of gross monthly income allowed for housing. */
  housingRatioCap: number;
  /** Total debt-to-income ceiling, including housing. */
  backEndDtiCap: number;
}

export const DEFAULT_ASSUMPTIONS: AffordabilityAssumptions = {
  interestRate: 0.0718,
  termYears: 30,
  propertyTaxRate: 0.01,
  insuranceRate: 0.0035,
  housingRatioCap: 0.35,
  backEndDtiCap: 0.45,
};

export const ASSUMPTION_NOTES = [
  {
    label: "30-year fixed rate: 7.18%",
    kind: "SOURCE",
    detail:
      "Freddie Mac PMMS / FRED MORTGAGE30US, observed 2026-11-05 as recorded in lanes/3-fund-it/data/DATA-SOURCES.md. Rates move daily; a lender's quote is what counts.",
    url: "https://fred.stlouisfed.org/series/MORTGAGE30US",
  },
  {
    label: "Property tax: 1.0% of price per year",
    kind: "ASSUMPTION",
    detail:
      "The event data list says to use about 1% plus local assessments as an assumption and say so. Local rates, assessments and the homeowner exemption change the real bill.",
    url: "https://tax.ocgov.com",
  },
  {
    label: "Homeowners insurance: 0.35% of price per year",
    kind: "ASSUMPTION",
    detail:
      "No Orange County premium was verified. Wildfire and FAIR Plan exposure can make the real number much higher.",
    url: "https://www.insurance.ca.gov/01-consumers/200-wrr/",
  },
  {
    label: "Housing payment: 30–35% of gross income; total debt: 45%",
    kind: "ASSUMPTION (orientation)",
    detail:
      "California's affordable-cost definition in Health and Safety Code 50052.5 uses cost-to-income percentages; the 30–35% range is orientation, not the statute's exact table, which is program-specific. The 45% total-debt ceiling is a modeling assumption.",
    url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=HSC&sectionNum=50052.5",
  },
];

export interface MonthlyBudget {
  monthlyIncome: number;
  housingRatioBudget: number;
  dtiBudget: number;
  comfortBudget: number | null;
  budget: number;
  bindingReason: string;
  hasIncome: boolean;
}

export function monthlyBudget(
  profile: BuyerProfile,
  assumptions: AffordabilityAssumptions = DEFAULT_ASSUMPTIONS,
): MonthlyBudget {
  const annual = totalAnnualIncome(profile);
  const monthlyIncome = annual / 12;
  const housingRatioBudget = monthlyIncome * assumptions.housingRatioCap;
  const monthlyDebts = profile.financial.monthlyDebts ?? 0;
  const dtiBudget = Math.max(0, monthlyIncome * assumptions.backEndDtiCap - monthlyDebts);
  const comfort =
    profile.financial.maxComfortableHousingPayment ??
    profile.financial.desiredMonthlyPayment ??
    null;
  const comfortBudget = comfort !== null && comfort > 0 ? comfort : null;

  const candidates: { value: number; reason: string }[] = [
    { value: housingRatioBudget, reason: `35% of gross income (${Math.round(assumptions.housingRatioCap * 100)}% cap)` },
    { value: dtiBudget, reason: "45% total-debt ceiling minus your monthly debts" },
  ];
  if (comfortBudget !== null) {
    candidates.push({ value: comfortBudget, reason: "the monthly payment you said feels comfortable" });
  }

  const positive = candidates.filter((candidate) => candidate.value > 0);
  if (positive.length === 0) {
    return {
      monthlyIncome,
      housingRatioBudget,
      dtiBudget,
      comfortBudget,
      budget: 0,
      bindingReason: "We need an income and a monthly payment target before we can estimate.",
      hasIncome: annual > 0,
    };
  }

  const binding = positive.reduce((lowest, candidate) =>
    candidate.value < lowest.value ? candidate : lowest,
  );

  return {
    monthlyIncome,
    housingRatioBudget,
    dtiBudget,
    comfortBudget,
    budget: Math.max(0, Math.floor(binding.value)),
    bindingReason: `Limited by ${binding.reason}.`,
    hasIncome: annual > 0,
  };
}

export function monthlyPrincipalAndInterest(
  loanAmount: number,
  annualRate: number = DEFAULT_ASSUMPTIONS.interestRate,
  termYears: number = DEFAULT_ASSUMPTIONS.termYears,
): number {
  if (loanAmount <= 0) return 0;
  const monthlyRate = annualRate / 12;
  const payments = termYears * 12;
  if (monthlyRate === 0) return loanAmount / payments;
  return (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -payments));
}

export interface HousingCost {
  price: number;
  downPayment: number;
  loanAmount: number;
  principalAndInterest: number;
  taxes: number;
  insurance: number;
  hoa: number;
  total: number;
}

export function housingCost(
  price: number,
  downPayment: number,
  monthlyHoa: number,
  assumptions: AffordabilityAssumptions = DEFAULT_ASSUMPTIONS,
): HousingCost {
  const appliedDown = Math.min(Math.max(0, downPayment), price);
  const loanAmount = Math.max(0, price - appliedDown);
  const principalAndInterest = monthlyPrincipalAndInterest(
    loanAmount,
    assumptions.interestRate,
    assumptions.termYears,
  );
  const taxes = (price * assumptions.propertyTaxRate) / 12;
  const insurance = (price * assumptions.insuranceRate) / 12;
  return {
    price,
    downPayment: appliedDown,
    loanAmount,
    principalAndInterest,
    taxes,
    insurance,
    hoa: Math.max(0, monthlyHoa),
    total: principalAndInterest + taxes + insurance + Math.max(0, monthlyHoa),
  };
}

export interface MaxPriceInput {
  budget: number;
  downPayment: number;
  monthlyHoa?: number;
  assistanceAtPrice?: (price: number) => number;
  assumptions?: AffordabilityAssumptions;
}

/** Highest price whose monthly housing cost is at or below the monthly budget. */
export function maxPurchasePrice(input: MaxPriceInput): number {
  const assumptions = input.assumptions ?? DEFAULT_ASSUMPTIONS;
  const hoa = input.monthlyHoa ?? 0;
  const cost = (price: number) => {
    const assistance = input.assistanceAtPrice?.(price) ?? 0;
    return housingCost(price, input.downPayment + assistance, hoa, assumptions).total;
  };

  if (input.budget <= 0) return 0;
  if (cost(0) > input.budget) return 0;

  let low = 0;
  let high = 5_000_000;
  for (let index = 0; index < 80; index += 1) {
    const mid = (low + high) / 2;
    if (cost(mid) <= input.budget) low = mid;
    else high = mid;
  }
  return Math.floor(low / 1000) * 1000;
}

export function availableDownPayment(profile: BuyerProfile): number {
  return profile.financial.downPaymentAvailable ?? 0;
}

export interface BuyingPower {
  budget: MonthlyBudget;
  downPayment: number;
  maxPrice: number;
  assumptions: AffordabilityAssumptions;
}

export function buyingPower(
  profile: BuyerProfile,
  assumptions: AffordabilityAssumptions = DEFAULT_ASSUMPTIONS,
): BuyingPower {
  const budget = monthlyBudget(profile, assumptions);
  const downPayment = availableDownPayment(profile);
  const maxPrice = maxPurchasePrice({ budget: budget.budget, downPayment, assumptions });
  return { budget, downPayment, maxPrice, assumptions };
}
