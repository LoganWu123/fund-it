/**
 * HCD 2026 State Income Limits — Orange County.
 *
 * Source: California Department of Housing and Community Development,
 * "2026 State Income Limits", memorandum revised June 23, 2026.
 * https://www.hcd.ca.gov/sites/default/files/docs/grants-and-funding/income-limits-2026.pdf
 *
 * The Orange County block in that document reports a 4-person median of
 * $138,600, and the household-size rows below. Only the median row is used here,
 * so that percentage tests are a transparent calculation from a verified figure.
 *
 * IMPORTANT: income limits are program-specific. HCD publishes separate category
 * rows (very low, low, moderate) and a separate State HOME table, and HUD publishes
 * its own limits. A program's own income test in programs.ts is what applies; this
 * table only computes the percentage of area median income. Confirm with the program.
 */
export const HCD_2026_OC = {
  sourceLabel: "HCD 2026 State Income Limits (Orange County)",
  sourceUrl:
    "https://www.hcd.ca.gov/sites/default/files/docs/grants-and-funding/income-limits-2026.pdf",
  effectiveDate: "2026-06-23",
  checkedOn: "2026-11-07",
  fourPersonMedian: 138600,
  medianByHouseholdSize: {
    1: 97000,
    2: 110900,
    3: 124750,
    4: 138600,
    5: 149700,
    6: 160800,
    7: 171850,
    8: 182950,
  } as Record<number, number>,
};

/**
 * Median income for a household size. Above eight people, HCD's published method is:
 * (4-person median x 8%) x (people above 8) + 8-person median, rounded to nearest $50.
 */
export function ocMedianIncome(householdSize: number): number {
  const size = Math.max(1, Math.round(householdSize));
  if (size <= 8) return HCD_2026_OC.medianByHouseholdSize[size];
  const extra = size - 8;
  const raw = HCD_2026_OC.medianByHouseholdSize[8] + HCD_2026_OC.fourPersonMedian * 0.08 * extra;
  return Math.round(raw / 50) * 50;
}

/** Percentage of Orange County AMI for the household size, rounded to the nearest $50. */
export function ocIncomeLimit(householdSize: number, percentOfAmi: number): number {
  return Math.round((ocMedianIncome(householdSize) * percentOfAmi) / 100 / 50) * 50;
}

export function amiPercentOf(annualIncome: number, householdSize: number): number {
  const median = ocMedianIncome(householdSize);
  if (!median) return 0;
  return (annualIncome / median) * 100;
}
