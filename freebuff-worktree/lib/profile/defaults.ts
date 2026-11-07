import type {
  BuyerProfile,
  EducationalProfile,
  EmploymentProfile,
  HouseholdMember,
  IncomeSource,
  PropertyType,
} from "./types";

export function newId(prefix = "id"): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return `${prefix}_${c.randomUUID()}`;
  return `${prefix}_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function defaultBuyerMember(): HouseholdMember {
  return {
    id: "member_buyer",
    role: "buyer",
    isMortgageApplicant: true,
  };
}

export function emptyProfile(id = newId("profile")): BuyerProfile {
  const now = new Date().toISOString();
  return {
    id,
    createdAt: now,
    updatedAt: now,
    onboardingStep: 1,
    completedSteps: [],
    financial: { incomeBasis: "gross" },
    household: { members: [defaultBuyerMember()] },
    incomeSources: [],
    employment: [],
    education: [],
    homeownership: {},
    military: {},
    preferences: { propertyTypes: [], cities: [], accessibilityFeatures: [] },
    assistance: {},
  };
}

type Dict = Record<string, unknown>;

function isDict(value: unknown): value is Dict {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function dict(value: unknown): Dict {
  return isDict(value) ? value : {};
}

function num(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return Math.round(parsed * 100) / 100;
}

function int(value: unknown, min = 0, max = 20): number | undefined {
  const parsed = num(value);
  if (parsed === undefined) return undefined;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function bool(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function str(value: unknown, maxLength = 160): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLength);
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

function listOfStrings(value: unknown, maxItems = 60): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0).slice(0, maxItems)),
  );
}

const PROPERTY_TYPES: readonly PropertyType[] = [
  "single_family",
  "condo",
  "townhouse",
  "duplex",
  "multifamily",
  "manufactured",
  "other",
];

function normalizeMember(value: unknown, index: number): HouseholdMember {
  const raw = dict(value);
  return {
    id: str(raw.id, 80) ?? (index === 0 ? "member_buyer" : newId("member")),
    role: oneOf(raw.role, ["buyer", "co_buyer", "spouse_partner", "dependent", "other_adult"] as const) ?? (index === 0 ? "buyer" : "other_adult"),
    isMortgageApplicant: bool(raw.isMortgageApplicant) ?? index === 0,
    relationship: str(raw.relationship, 60),
    ageRange: oneOf(raw.ageRange, [
      "under_18",
      "18_24",
      "25_34",
      "35_44",
      "45_54",
      "55_64",
      "65_plus",
      "prefer_not_to_say",
    ] as const),
  };
}

function normalizeIncomeSource(value: unknown): IncomeSource | null {
  const raw = dict(value);
  const annualAmount = num(raw.annualAmount);
  if (annualAmount === undefined) return null;
  return {
    id: str(raw.id, 80) ?? newId("income"),
    memberId: str(raw.memberId, 80) ?? "member_buyer",
    type:
      oneOf(raw.type, [
        "employment",
        "self_employment",
        "social_security",
        "pension",
        "disability",
        "child_support",
        "investment",
        "rental",
        "other",
      ] as const) ?? "other",
    label: str(raw.label, 80),
    annualAmount,
    basis: oneOf(raw.basis, ["gross", "net"] as const) ?? "gross",
    recurring: bool(raw.recurring) ?? true,
  };
}

function normalizeEmployment(value: unknown): EmploymentProfile | null {
  const raw = dict(value);
  const memberId = str(raw.memberId, 80);
  if (!memberId) return null;
  return {
    memberId,
    status: oneOf(raw.status, [
      "full_time",
      "part_time",
      "self_employed",
      "independent_contractor",
      "student",
      "working_student",
      "unemployed",
      "retired",
      "unable_to_work",
      "active_duty",
      "veteran",
      "other",
    ] as const),
    occupationTitle: str(raw.occupationTitle, 80),
    occupationCategory: oneOf(raw.occupationCategory, [
      "teacher_educator",
      "healthcare",
      "public_sector",
      "government",
      "first_responder",
      "police",
      "firefighter",
      "military",
      "veteran",
      "nonprofit",
      "university_employee",
      "other",
      "prefer_not_to_say",
    ] as const),
    industry: str(raw.industry, 80),
    employerName: str(raw.employerName, 120),
    employerType: oneOf(raw.employerType, ["private", "public", "nonprofit", "university", "self", "other"] as const),
    employmentCity: str(raw.employmentCity, 80),
    yearsEmployed: num(raw.yearsEmployed),
    annualEmploymentIncome: num(raw.annualEmploymentIncome),
    fullTime: bool(raw.fullTime),
  };
}

function normalizeEducation(value: unknown): EducationalProfile | null {
  const raw = dict(value);
  const memberId = str(raw.memberId, 80);
  if (!memberId) return null;
  return {
    memberId,
    isEnrolled: bool(raw.isEnrolled),
    institutionType: oneOf(raw.institutionType, [
      "community_college",
      "public_university",
      "private_university",
      "graduate_school",
      "vocational",
      "other",
      "none",
    ] as const),
    enrollmentStatus: oneOf(raw.enrollmentStatus, [
      "full_time",
      "part_time",
      "recently_graduated",
      "not_enrolled",
    ] as const),
    expectedGraduation: str(raw.expectedGraduation, 7),
    studentLoanBalance: num(raw.studentLoanBalance),
    monthlyStudentLoanPayment: num(raw.monthlyStudentLoanPayment),
    employedWhileStudent: bool(raw.employedWhileStudent),
    institutionalHousingBenefit: bool(raw.institutionalHousingBenefit),
    institutionalBenefitNotes: str(raw.institutionalBenefitNotes, 300),
  };
}

/**
 * Turns untrusted input (request body or database JSON) into a valid profile.
 * Unknown values are dropped; nothing is invented.
 */
export function normalizeProfile(input: unknown, fallbackId = newId("profile")): BuyerProfile {
  const raw = dict(input);
  const base = emptyProfile(str(raw.id, 80) ?? fallbackId);
  const financial = dict(raw.financial);
  const household = dict(raw.household);
  const homeownership = dict(raw.homeownership);
  const military = dict(raw.military);
  const preferences = dict(raw.preferences);
  const assistance = dict(raw.assistance);

  const membersRaw = Array.isArray(household.members) ? household.members : [];
  const members = membersRaw.map(normalizeMember);
  if (members.length === 0) members.push(defaultBuyerMember());
  if (!members.some((member) => member.isMortgageApplicant)) members[0].isMortgageApplicant = true;

  const incomeSources = (Array.isArray(raw.incomeSources) ? raw.incomeSources : [])
    .map(normalizeIncomeSource)
    .filter((source): source is IncomeSource => source !== null);
  const employment = (Array.isArray(raw.employment) ? raw.employment : [])
    .map(normalizeEmployment)
    .filter((entry): entry is EmploymentProfile => entry !== null);
  const education = (Array.isArray(raw.education) ? raw.education : [])
    .map(normalizeEducation)
    .filter((entry): entry is EducationalProfile => entry !== null);

  return {
    id: base.id,
    createdAt: str(raw.createdAt, 40) ?? base.createdAt,
    updatedAt: new Date().toISOString(),
    onboardingStep: int(raw.onboardingStep, 1, 7) ?? 1,
    completedSteps: Array.isArray(raw.completedSteps)
      ? raw.completedSteps.map((step) => int(step, 1, 7)).filter((step): step is number => step !== undefined)
      : [],
    financial: {
      individualAnnualIncome: num(financial.individualAnnualIncome),
      savings: num(financial.savings),
      downPaymentAvailable: num(financial.downPaymentAvailable),
      closingCostFunds: num(financial.closingCostFunds),
      monthlyDebts: num(financial.monthlyDebts),
      monthlyRent: num(financial.monthlyRent),
      creditScoreRange: oneOf(financial.creditScoreRange, [
        "below_580",
        "580_619",
        "620_659",
        "660_699",
        "700_739",
        "740_799",
        "800_plus",
        "prefer_not_to_say",
      ] as const),
      desiredMonthlyPayment: num(financial.desiredMonthlyPayment),
      maxComfortableHousingPayment: num(financial.maxComfortableHousingPayment),
      maxPurchaseBudget: num(financial.maxPurchaseBudget),
      incomeBasis: oneOf(financial.incomeBasis, ["gross", "net"] as const) ?? "gross",
    },
    household: {
      maritalStatus: oneOf(household.maritalStatus, [
        "single",
        "married",
        "domestic_partnership",
        "divorced",
        "separated",
        "widowed",
        "prefer_not_to_say",
      ] as const),
      adultsCount: int(household.adultsCount, 0, 12),
      dependentsCount: int(household.dependentsCount, 0, 12),
      childrenCount: int(household.childrenCount, 0, 12),
      purchaseType: oneOf(household.purchaseType, ["individual", "joint"] as const),
      spouseCoApplicant: bool(household.spouseCoApplicant),
      multipleEarners: bool(household.multipleEarners),
      singleParent: bool(household.singleParent),
      members,
    },
    incomeSources,
    employment,
    education,
    homeownership: {
      currentHousing: oneOf(homeownership.currentHousing, [
        "renting",
        "with_family",
        "with_friends_roommates",
        "owns_home",
        "temporary",
        "other",
      ] as const),
      yearsAtResidence: num(homeownership.yearsAtResidence),
      monthlyRent: num(homeownership.monthlyRent),
      previouslyOwnedHome: bool(homeownership.previouslyOwnedHome),
      soldPreviousHome: bool(homeownership.soldPreviousHome),
      yearsSinceLastOwned: num(homeownership.yearsSinceLastOwned),
      firstPrimaryResidence: bool(homeownership.firstPrimaryResidence),
      ownsOtherProperty: bool(homeownership.ownsOtherProperty),
      previouslyReceivedAssistance: bool(homeownership.previouslyReceivedAssistance),
    },
    military: {
      status: oneOf(military.status, [
        "none",
        "active_duty",
        "veteran",
        "national_guard_reserve",
        "surviving_spouse",
        "other",
      ] as const),
      currentlyServing: bool(military.currentlyServing),
      serviceEra: str(military.serviceEra, 40),
      vaLoanEntitlement: oneOf(military.vaLoanEntitlement, ["yes", "no", "unsure"] as const),
      preferNotToSay: bool(military.preferNotToSay),
    },
    preferences: {
      propertyTypes: (Array.isArray(preferences.propertyTypes) ? preferences.propertyTypes : []).filter(
        (value): value is PropertyType =>
          typeof value === "string" && (PROPERTY_TYPES as readonly string[]).includes(value),
      ),
      minBeds: int(preferences.minBeds, 0, 10),
      minBaths: num(preferences.minBaths),
      minSqft: num(preferences.minSqft),
      maxHoa: num(preferences.maxHoa),
      parking: oneOf(preferences.parking, ["none", "street", "driveway", "garage", "any"] as const),
      garage: bool(preferences.garage),
      yard: bool(preferences.yard),
      accessibilityFeatures: listOfStrings(preferences.accessibilityFeatures, 20),
      condition: oneOf(preferences.condition, ["new", "existing", "either", "fixer_ok"] as const),
      arrangement: oneOf(preferences.arrangement, [
        "primary_residence",
        "owner_occupied_multifamily",
        "house_hacking",
        "multigenerational",
        "co_purchase",
      ] as const),
      cities: listOfStrings(preferences.cities, 34),
      maxCommuteMinutes: int(preferences.maxCommuteMinutes, 0, 240),
      workplaceCity: str(preferences.workplaceCity, 80),
      schoolCity: str(preferences.schoolCity, 80),
      transitImportance: int(preferences.transitImportance, 1, 5),
      setting: oneOf(preferences.setting, ["urban", "suburban", "rural", "any"] as const),
      flexibleLocation: bool(preferences.flexibleLocation),
    },
    assistance: {
      firstGenerationHomebuyer: bool(assistance.firstGenerationHomebuyer),
      previouslyReceivedHousingAssistance: bool(assistance.previouslyReceivedHousingAssistance),
      participatedInAffordableHousing: bool(assistance.participatedInAffordableHousing),
      targetedGeographicArea: bool(assistance.targetedGeographicArea),
      employerBenefitAvailable: bool(assistance.employerBenefitAvailable),
      employerBenefitKind: oneOf(assistance.employerBenefitKind, [
        "grant",
        "loan",
        "matched_savings",
        "unknown",
      ] as const),
      employerBenefitAmount: num(assistance.employerBenefitAmount),
      employerBenefitNotes: str(assistance.employerBenefitNotes, 300),
      institutionalBenefitAvailable: bool(assistance.institutionalBenefitAvailable),
      institutionalBenefitNotes: str(assistance.institutionalBenefitNotes, 300),
      communityProgramNotes: str(assistance.communityProgramNotes, 300),
    },
  };
}
