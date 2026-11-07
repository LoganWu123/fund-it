import type {
  CurrentHousing,
  EmploymentStatus,
  HouseholdMember,
  MaritalStatus,
  MilitaryStatus,
  OccupationCategory,
  PropertyType,
} from "@/lib/profile/types";

export type ProgramCategory =
  | "federal"
  | "state"
  | "county"
  | "city"
  | "profession"
  | "employer"
  | "institution"
  | "veteran"
  | "nonprofit"
  | "community"
  | "property";

export const PROGRAM_CATEGORY_LABELS: Record<ProgramCategory, string> = {
  federal: "Federal",
  state: "California",
  county: "Orange County",
  city: "City program",
  profession: "Profession-specific",
  employer: "Employer benefit",
  institution: "University or institution",
  veteran: "Veteran and military",
  nonprofit: "Nonprofit or community land trust",
  community: "Community development",
  property: "Property-specific",
};

export type AssistanceType =
  | "grant"
  | "loan"
  | "deferred_loan"
  | "forgivable_loan"
  | "shared_appreciation"
  | "tax_credit"
  | "rate_buy_down"
  | "unknown";

export const ASSISTANCE_TYPE_LABELS: Record<AssistanceType, string> = {
  grant: "Grant",
  loan: "Loan",
  deferred_loan: "Deferred loan",
  forgivable_loan: "Forgivable loan",
  shared_appreciation: "Shared appreciation",
  tax_credit: "Tax credit",
  rate_buy_down: "Rate buy-down",
  unknown: "Type not confirmed",
};

export type Verification = "verified" | "partial" | "unverified";

export interface SourceRef {
  label: string;
  url?: string;
  /** ISO date the source was checked. "Not checked" is stated, never implied. */
  checkedOn?: string;
  note?: string;
}

export type BenefitRule =
  | { kind: "percent_of_price"; percent: number; cap?: number; note?: string }
  | {
      kind: "percent_range_of_price";
      minPercent: number;
      maxPercent: number;
      cap?: number;
      note?: string;
    }
  | { kind: "fixed"; amount: number; note?: string }
  | { kind: "user_reported"; note?: string }
  | { kind: "unknown"; note: string };

/**
 * A requirement is a single, independently evaluated test.
 * A program with `percent: null` (or a "manual_review" test) produces an open
 * question, never a confident yes or no.
 */
export type Requirement =
  | { kind: "primary_residence"; note?: string }
  | { kind: "first_time_buyer"; lookbackYears?: number; note?: string }
  | {
      kind: "income_max_ami";
      percent: number | null;
      basis?: "household" | "borrower";
      note?: string;
    }
  | { kind: "income_max"; amount: number | null; basis?: "household" | "borrower"; note?: string }
  | { kind: "household_size_min"; min: number; note?: string }
  | { kind: "household_size_max"; max: number; note?: string }
  | { kind: "occupation_in"; occupations: OccupationCategory[]; note?: string }
  | { kind: "employment_status_in"; statuses: EmploymentStatus[]; note?: string }
  | { kind: "military_status_in"; statuses: MilitaryStatus[]; note?: string }
  | {
      kind: "student_status_in";
      statuses: ("enrolled" | "recent_graduate" | "not_enrolled")[];
      note?: string;
    }
  | { kind: "current_housing_in"; values: CurrentHousing[]; note?: string }
  | { kind: "purchase_price_max"; amount: number; note?: string }
  | { kind: "property_type_in"; propertyTypes: PropertyType[]; note?: string }
  | { kind: "jurisdiction_in"; cities: string[]; note?: string }
  | { kind: "marital_status_in"; statuses: MaritalStatus[]; note?: string }
  | { kind: "co_applicant_required"; required: boolean; note?: string }
  | { kind: "dependent_min"; min: number; note?: string }
  | { kind: "first_generation_homebuyer"; note?: string }
  | { kind: "employer_benefit"; note?: string }
  | { kind: "institutional_benefit"; note?: string }
  | { kind: "targeted_area"; note?: string }
  | { kind: "manual_review"; note: string }
  | { kind: "unknown"; note: string };

export interface AssistanceProgram {
  id: string;
  name: string;
  administrator: string;
  level: "federal" | "state" | "county" | "city" | "employer" | "institution" | "nonprofit";
  category: ProgramCategory;
  summary: string;
  assistanceType: AssistanceType;
  repayment: string;
  /** Whether the program can be layered with others. "unknown" is a real answer. */
  combinable: "yes" | "no" | "unknown";
  stackingNote?: string;
  /** "project" programs fund a developer or sponsor, not a household's down payment. */
  appliesTo: "household" | "project";
  availability: "open" | "limited" | "not_confirmed" | "unknown";
  benefit: BenefitRule;
  requirements: Requirement[];
  openQuestions: string[];
  sources: SourceRef[];
  verification: Verification;
  lastChecked: string;
  jurisdictionNote?: string;
}

export interface MatchContext {
  profileId: string;
  householdSize: number;
  annualHouseholdIncome: number;
  annualBorrowerIncome: number;
  amiPercentOfIncome: number;
  occupationCategories: OccupationCategory[];
  employmentStatuses: EmploymentStatus[];
  hasEmploymentAnswer: boolean;
  isEnrolled: boolean | undefined;
  hasRecentGraduate: boolean;
  firstTimeBuyer: boolean | undefined;
  yearsSinceLastOwned: number | undefined;
  cityPreferences: string[];
  preferredPropertyTypes: PropertyType[];
  propertyCity: string | undefined;
  propertyType: PropertyType | undefined;
  purchasePrice: number | undefined;
  reportedBenefitAmount: number | undefined;
  members: HouseholdMember[];
}

export type RequirementStatus = "pass" | "fail" | "unknown" | "action";

export interface RequirementResult {
  requirement: Requirement;
  status: RequirementStatus;
  detail: string;
}

export type Verdict = "likely" | "possible" | "unlikely";

export interface BenefitEstimate {
  low: number;
  high: number;
  kind: "estimated" | "range";
  basis: string;
  note?: string;
}

export interface ProgramMatch {
  program: AssistanceProgram;
  verdict: Verdict;
  results: RequirementResult[];
  reasons: string[];
  blockers: string[];
  openQuestions: string[];
  /** Steps the buyer must complete (lender, education, voucher) — not eligibility tests. */
  nextSteps: string[];
  benefit: BenefitEstimate | null;
  benefitNote: string | null;
}
