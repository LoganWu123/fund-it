/**
 * Buyer profile model.
 *
 * Field choices are intentionally optional: the onboarding supports a partial
 * profile, and the eligibility engine returns "unknown" rather than guessing.
 * Nothing here is a program rule. Program rules live in lib/eligibility/programs.ts.
 */

export type MaritalStatus =
  | "single"
  | "married"
  | "domestic_partnership"
  | "divorced"
  | "separated"
  | "widowed"
  | "prefer_not_to_say";

export type PurchaseType = "individual" | "joint";

export type EmploymentStatus =
  | "full_time"
  | "part_time"
  | "self_employed"
  | "independent_contractor"
  | "student"
  | "working_student"
  | "unemployed"
  | "retired"
  | "unable_to_work"
  | "active_duty"
  | "veteran"
  | "other";

export type OccupationCategory =
  | "teacher_educator"
  | "healthcare"
  | "public_sector"
  | "government"
  | "first_responder"
  | "police"
  | "firefighter"
  | "military"
  | "veteran"
  | "nonprofit"
  | "university_employee"
  | "other"
  | "prefer_not_to_say";

export type EmployerType = "private" | "public" | "nonprofit" | "university" | "self" | "other";

export type InstitutionType =
  | "community_college"
  | "public_university"
  | "private_university"
  | "graduate_school"
  | "vocational"
  | "other"
  | "none";

export type EnrollmentStatus = "full_time" | "part_time" | "recently_graduated" | "not_enrolled";

export type CurrentHousing =
  | "renting"
  | "with_family"
  | "with_friends_roommates"
  | "owns_home"
  | "temporary"
  | "other";

export type PropertyType =
  | "single_family"
  | "condo"
  | "townhouse"
  | "duplex"
  | "multifamily"
  | "manufactured"
  | "other";

export type HousingArrangement =
  | "primary_residence"
  | "owner_occupied_multifamily"
  | "house_hacking"
  | "multigenerational"
  | "co_purchase";

export type MilitaryStatus =
  | "none"
  | "active_duty"
  | "veteran"
  | "national_guard_reserve"
  | "surviving_spouse"
  | "other";

export type CreditScoreRange =
  | "below_580"
  | "580_619"
  | "620_659"
  | "660_699"
  | "700_739"
  | "740_799"
  | "800_plus"
  | "prefer_not_to_say";

export type IncomeSourceType =
  | "employment"
  | "self_employment"
  | "social_security"
  | "pension"
  | "disability"
  | "child_support"
  | "investment"
  | "rental"
  | "other";

export type MemberRole = "buyer" | "co_buyer" | "spouse_partner" | "dependent" | "other_adult";

export interface HouseholdMember {
  id: string;
  role: MemberRole;
  isMortgageApplicant: boolean;
  /** Free-text relationship label. Optional, and never required. */
  relationship?: string;
  ageRange?: "under_18" | "18_24" | "25_34" | "35_44" | "45_54" | "55_64" | "65_plus" | "prefer_not_to_say";
}

export interface IncomeSource {
  id: string;
  memberId: string;
  type: IncomeSourceType;
  label?: string;
  /** Annualized amount, in dollars. */
  annualAmount: number;
  basis: "gross" | "net";
  /** Recurring income counts toward qualifying income. Nonrecurring does not. */
  recurring: boolean;
}

export interface FinancialProfile {
  /** Optional single figure; used only if no income sources are entered. */
  individualAnnualIncome?: number;
  savings?: number;
  downPaymentAvailable?: number;
  closingCostFunds?: number;
  monthlyDebts?: number;
  monthlyRent?: number;
  creditScoreRange?: CreditScoreRange;
  desiredMonthlyPayment?: number;
  maxComfortableHousingPayment?: number;
  maxPurchaseBudget?: number;
  incomeBasis: "gross" | "net";
}

export interface HouseholdProfile {
  maritalStatus?: MaritalStatus;
  adultsCount?: number;
  dependentsCount?: number;
  childrenCount?: number;
  purchaseType?: PurchaseType;
  spouseCoApplicant?: boolean;
  multipleEarners?: boolean;
  /** Optional and voluntarily disclosed. Some programs are specific to single parents. */
  singleParent?: boolean;
  members: HouseholdMember[];
}

export interface EmploymentProfile {
  memberId: string;
  status?: EmploymentStatus;
  occupationTitle?: string;
  occupationCategory?: OccupationCategory;
  industry?: string;
  employerName?: string;
  employerType?: EmployerType;
  employmentCity?: string;
  yearsEmployed?: number;
  annualEmploymentIncome?: number;
  fullTime?: boolean;
}

export interface EducationalProfile {
  memberId: string;
  isEnrolled?: boolean;
  institutionType?: InstitutionType;
  enrollmentStatus?: EnrollmentStatus;
  /** YYYY-MM. Optional. */
  expectedGraduation?: string;
  studentLoanBalance?: number;
  monthlyStudentLoanPayment?: number;
  employedWhileStudent?: boolean;
  institutionalHousingBenefit?: boolean;
  institutionalBenefitNotes?: string;
}

export interface HomeownershipHistory {
  currentHousing?: CurrentHousing;
  yearsAtResidence?: number;
  monthlyRent?: number;
  previouslyOwnedHome?: boolean;
  soldPreviousHome?: boolean;
  /** Years since the last owned home. Used only where a program has a lookback. */
  yearsSinceLastOwned?: number;
  firstPrimaryResidence?: boolean;
  ownsOtherProperty?: boolean;
  previouslyReceivedAssistance?: boolean;
}

export interface MilitaryProfile {
  status?: MilitaryStatus;
  currentlyServing?: boolean;
  serviceEra?: string;
  vaLoanEntitlement?: "yes" | "no" | "unsure";
  preferNotToSay?: boolean;
}

export type ParkingPreference = "none" | "street" | "driveway" | "garage" | "any";

export interface HousingPreferences {
  propertyTypes: PropertyType[];
  minBeds?: number;
  minBaths?: number;
  minSqft?: number;
  maxHoa?: number;
  parking?: ParkingPreference;
  garage?: boolean;
  yard?: boolean;
  accessibilityFeatures?: string[];
  condition?: "new" | "existing" | "either" | "fixer_ok";
  arrangement?: HousingArrangement;
  cities: string[];
  maxCommuteMinutes?: number;
  workplaceCity?: string;
  schoolCity?: string;
  /** 1 = not important, 5 = essential. */
  transitImportance?: number;
  setting?: "urban" | "suburban" | "rural" | "any";
  flexibleLocation?: boolean;
}

/**
 * Purpose-specific assistance attributes. These are stored in their own table and
 * are only read by the eligibility service, not by the general profile read path.
 */
export interface AssistanceAttributes {
  firstGenerationHomebuyer?: boolean;
  previouslyReceivedHousingAssistance?: boolean;
  participatedInAffordableHousing?: boolean;
  targetedGeographicArea?: boolean;
  employerBenefitAvailable?: boolean;
  employerBenefitKind?: "grant" | "loan" | "matched_savings" | "unknown";
  employerBenefitAmount?: number;
  employerBenefitNotes?: string;
  institutionalBenefitAvailable?: boolean;
  institutionalBenefitNotes?: string;
  communityProgramNotes?: string;
}

export interface BuyerProfile {
  id: string;
  createdAt: string;
  updatedAt: string;
  onboardingStep: number;
  completedSteps: number[];
  financial: FinancialProfile;
  household: HouseholdProfile;
  incomeSources: IncomeSource[];
  employment: EmploymentProfile[];
  education: EducationalProfile[];
  homeownership: HomeownershipHistory;
  military: MilitaryProfile;
  preferences: HousingPreferences;
  assistance: AssistanceAttributes;
}

export const SENSITIVE_FIELDS = [
  "household.maritalStatus",
  "household.singleParent",
  "military.status",
  "military.serviceEra",
  "military.vaLoanEntitlement",
  "assistance.firstGenerationHomebuyer",
  "assistance.previouslyReceivedHousingAssistance",
  "assistance.participatedInAffordableHousing",
] as const;

export type StepKey = "financial" | "household" | "employment" | "housing" | "property" | "location" | "assistance";

export interface StepDefinition {
  key: StepKey;
  index: number;
  title: string;
  short: string;
  blurb: string;
}
