import type { BuyerProfile, StepDefinition } from "./types";

export const STEPS: StepDefinition[] = [
  {
    key: "financial",
    index: 1,
    title: "Money and monthly budget",
    short: "Money",
    blurb: "What comes in, what goes out, and what feels comfortable each month.",
  },
  {
    key: "household",
    index: 2,
    title: "Who lives with you",
    short: "Household",
    blurb: "Household size changes the income limits many programs use.",
  },
  {
    key: "employment",
    index: 3,
    title: "Work and school",
    short: "Work & school",
    blurb: "Some assistance is tied to a job, an employer or a school.",
  },
  {
    key: "housing",
    index: 4,
    title: "Where you live now",
    short: "Housing now",
    blurb: "First-time buyer rules differ by program, so we ask instead of assuming.",
  },
  {
    key: "property",
    index: 5,
    title: "What you want to buy",
    short: "Property",
    blurb: "Property type and condition affect which homes and programs fit.",
  },
  {
    key: "location",
    index: 6,
    title: "Where you want to live",
    short: "Location",
    blurb: "Some city programs only apply inside that city.",
  },
  {
    key: "assistance",
    index: 7,
    title: "Other help you may have",
    short: "Assistance",
    blurb: "Optional questions that unlock additional funding categories.",
  },
];

export interface MissingItem {
  step: number;
  label: string;
  optional: boolean;
}

export interface Completeness {
  percent: number;
  missing: MissingItem[];
  optionalMissing: MissingItem[];
  requiredTotal: number;
  requiredDone: number;
}

export function totalAnnualIncome(profile: BuyerProfile): number {
  const fromSources = profile.incomeSources
    .filter((source) => source.recurring)
    .reduce((sum, source) => sum + source.annualAmount, 0);
  if (fromSources > 0) return fromSources;
  return profile.financial.individualAnnualIncome ?? 0;
}

export function householdSize(profile: BuyerProfile): number {
  const declared = (profile.household.adultsCount ?? 0) + (profile.household.dependentsCount ?? 0);
  if (declared > 0) return Math.max(1, declared);
  return Math.max(1, profile.household.members.length);
}

export function computeCompleteness(profile: BuyerProfile): Completeness {
  const hasIncome = totalAnnualIncome(profile) > 0;
  const hasEmployment = profile.employment.some((entry) => Boolean(entry.status));
  const checks: MissingItem[] = [
    { step: 1, label: "Your household income", optional: false },
    { step: 1, label: "Monthly debt payments (enter 0 if none)", optional: false },
    { step: 2, label: "Number of adults in the household", optional: false },
    { step: 2, label: "Buying alone or jointly", optional: false },
    { step: 3, label: "Your employment status", optional: false },
    { step: 4, label: "Where you live now", optional: false },
    { step: 4, label: "Whether you have owned a home before", optional: false },
    { step: 1, label: "Down payment you have available", optional: true },
    { step: 1, label: "Monthly payment that feels comfortable", optional: true },
    { step: 2, label: "Dependents in the household", optional: true },
    { step: 3, label: "Occupation category (unlocks profession programs)", optional: true },
    { step: 3, label: "Student status (unlocks institutional programs)", optional: true },
    { step: 5, label: "Property types you would consider", optional: true },
    { step: 6, label: "Cities you would consider", optional: true },
    { step: 7, label: "Military or veteran status (unlocks VA programs)", optional: true },
    { step: 7, label: "Employer housing benefit", optional: true },
  ];

  const answered = new Set<string>();
  if (hasIncome) answered.add("Your household income");
  if (profile.financial.monthlyDebts !== undefined) answered.add("Monthly debt payments (enter 0 if none)");
  if (profile.household.adultsCount !== undefined) answered.add("Number of adults in the household");
  if (profile.household.purchaseType) answered.add("Buying alone or jointly");
  if (hasEmployment) answered.add("Your employment status");
  if (profile.homeownership.currentHousing) answered.add("Where you live now");
  if (profile.homeownership.previouslyOwnedHome !== undefined)
    answered.add("Whether you have owned a home before");
  if (profile.financial.downPaymentAvailable !== undefined) answered.add("Down payment you have available");
  if (
    profile.financial.maxComfortableHousingPayment !== undefined ||
    profile.financial.desiredMonthlyPayment !== undefined
  )
    answered.add("Monthly payment that feels comfortable");
  if (profile.household.dependentsCount !== undefined) answered.add("Dependents in the household");
  if (profile.employment.some((entry) => entry.occupationCategory))
    answered.add("Occupation category (unlocks profession programs)");
  if (profile.education.some((entry) => entry.isEnrolled !== undefined))
    answered.add("Student status (unlocks institutional programs)");
  if (profile.preferences.propertyTypes.length > 0) answered.add("Property types you would consider");
  if (profile.preferences.cities.length > 0) answered.add("Cities you would consider");
  if (profile.military.status) answered.add("Military or veteran status (unlocks VA programs)");
  if (profile.assistance.employerBenefitAvailable !== undefined) answered.add("Employer housing benefit");

  const required = checks.filter((item) => !item.optional);
  const optional = checks.filter((item) => item.optional);
  const requiredDone = required.filter((item) => answered.has(item.label)).length;

  return {
    percent: required.length === 0 ? 0 : Math.round((requiredDone / required.length) * 100),
    missing: required.filter((item) => !answered.has(item.label)),
    optionalMissing: optional.filter((item) => !answered.has(item.label)),
    requiredTotal: required.length,
    requiredDone,
  };
}

export function stepIsComplete(profile: BuyerProfile, step: number): boolean {
  return !computeCompleteness(profile).missing.some((item) => item.step === step);
}
