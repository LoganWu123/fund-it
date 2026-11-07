import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import type { BuyerProfile } from "./profile/types";
import { emptyProfile, normalizeProfile } from "./profile/defaults";

/**
 * SQLite persistence (node:sqlite, no native dependency).
 *
 * The profile is stored in relational tables rather than one JSON blob. The API
 * assembles the nested shape for the editor. The assistance attributes live in
 * their own table: they are read by the profile editor and the eligibility
 * service, and are never included in the matching response.
 */

const globalForDb = globalThis as unknown as { __funditDb?: DatabaseSync };

const SCHEMA = `
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  onboarding_step INTEGER NOT NULL DEFAULT 1,
  completed_steps TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS financial_profiles (
  profile_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  individual_annual_income REAL,
  savings REAL,
  down_payment_available REAL,
  closing_cost_funds REAL,
  monthly_debts REAL,
  monthly_rent REAL,
  credit_score_range TEXT,
  desired_monthly_payment REAL,
  max_comfortable_payment REAL,
  max_purchase_budget REAL,
  income_basis TEXT
);

CREATE TABLE IF NOT EXISTS households (
  profile_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  marital_status TEXT,
  adults_count INTEGER,
  dependents_count INTEGER,
  children_count INTEGER,
  purchase_type TEXT,
  spouse_co_applicant INTEGER,
  multiple_earners INTEGER,
  single_parent INTEGER
);

CREATE TABLE IF NOT EXISTS household_members (
  id TEXT NOT NULL,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  is_mortgage_applicant INTEGER NOT NULL DEFAULT 0,
  relationship TEXT,
  age_range TEXT,
  PRIMARY KEY (profile_id, id)
);

CREATE TABLE IF NOT EXISTS household_income_sources (
  id TEXT NOT NULL,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL,
  type TEXT NOT NULL,
  label TEXT,
  annual_amount REAL NOT NULL,
  basis TEXT NOT NULL,
  recurring INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (profile_id, id)
);

CREATE TABLE IF NOT EXISTS employment_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL,
  status TEXT,
  occupation_title TEXT,
  occupation_category TEXT,
  industry TEXT,
  employer_name TEXT,
  employer_type TEXT,
  employment_city TEXT,
  years_employed REAL,
  annual_employment_income REAL,
  full_time INTEGER
);

CREATE TABLE IF NOT EXISTS educational_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL,
  is_enrolled INTEGER,
  institution_type TEXT,
  enrollment_status TEXT,
  expected_graduation TEXT,
  student_loan_balance REAL,
  monthly_student_loan_payment REAL,
  employed_while_student INTEGER,
  institutional_housing_benefit INTEGER,
  institutional_benefit_notes TEXT
);

CREATE TABLE IF NOT EXISTS homeownership_history (
  profile_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  current_housing TEXT,
  years_at_residence REAL,
  monthly_rent REAL,
  previously_owned_home INTEGER,
  sold_previous_home INTEGER,
  years_since_last_owned REAL,
  first_primary_residence INTEGER,
  owns_other_property INTEGER,
  previously_received_assistance INTEGER
);

CREATE TABLE IF NOT EXISTS military_profiles (
  profile_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT,
  currently_serving INTEGER,
  service_era TEXT,
  va_loan_entitlement TEXT,
  prefer_not_to_say INTEGER
);

CREATE TABLE IF NOT EXISTS housing_preferences (
  profile_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  property_types TEXT NOT NULL DEFAULT '[]',
  min_beds INTEGER,
  min_baths REAL,
  min_sqft REAL,
  max_hoa REAL,
  parking TEXT,
  garage INTEGER,
  yard INTEGER,
  accessibility_features TEXT NOT NULL DEFAULT '[]',
  condition TEXT,
  arrangement TEXT,
  cities TEXT NOT NULL DEFAULT '[]',
  max_commute_minutes INTEGER,
  workplace_city TEXT,
  school_city TEXT,
  transit_importance INTEGER,
  setting TEXT,
  flexible_location INTEGER
);

CREATE TABLE IF NOT EXISTS assistance_eligibility_attributes (
  profile_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  first_generation_homebuyer INTEGER,
  previously_received_housing_assistance INTEGER,
  participated_in_affordable_housing INTEGER,
  targeted_geographic_area INTEGER,
  employer_benefit_available INTEGER,
  employer_benefit_kind TEXT,
  employer_benefit_amount REAL,
  employer_benefit_notes TEXT,
  institutional_benefit_available INTEGER,
  institutional_benefit_notes TEXT,
  community_program_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_members_profile ON household_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_income_profile ON household_income_sources(profile_id);
CREATE INDEX IF NOT EXISTS idx_employment_profile ON employment_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_education_profile ON educational_profiles(profile_id);
`;

function connect(): DatabaseSync {
  if (globalForDb.__funditDb) return globalForDb.__funditDb;
  const dataDir = process.env.DATA_DIR ?? path.join(process.cwd(), ".data");
  fs.mkdirSync(dataDir, { recursive: true });
  const db = new DatabaseSync(path.join(dataDir, "fundit.db"));
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(SCHEMA);
  globalForDb.__funditDb = db;
  return db;
}

type SqlValue = string | number | null;

function b(value: boolean | undefined): number | null {
  return value === undefined ? null : value ? 1 : 0;
}

function n(value: number | undefined): number | null {
  return value === undefined ? null : value;
}

function s(value: string | undefined): string | null {
  return value === undefined ? null : value;
}

function j(value: string[] | undefined): string {
  return JSON.stringify(value ?? []);
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asBool(value: unknown): boolean | undefined {
  if (value === 1 || value === 0) return value === 1;
  if (typeof value === "boolean") return value;
  return undefined;
}

function asArray(value: unknown): string[] {
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === "string") : [];
  } catch {
    return [];
  }
}

export function loadProfile(id: string): BuyerProfile | null {
  const db = connect();
  const row = db.prepare("SELECT * FROM profiles WHERE id = ?").get(id);
  if (!row) return null;

  const financial = (db
    .prepare("SELECT * FROM financial_profiles WHERE profile_id = ?")
    .get(id) ?? {}) as Record<string, unknown>;
  const household = (db
    .prepare("SELECT * FROM households WHERE profile_id = ?")
    .get(id) ?? {}) as Record<string, unknown>;
  const members = db
    .prepare("SELECT * FROM household_members WHERE profile_id = ? ORDER BY rowid")
    .all(id);
  const incomeSources = db
    .prepare("SELECT * FROM household_income_sources WHERE profile_id = ? ORDER BY rowid")
    .all(id);
  const employment = db
    .prepare("SELECT * FROM employment_profiles WHERE profile_id = ? ORDER BY id")
    .all(id);
  const education = db
    .prepare("SELECT * FROM educational_profiles WHERE profile_id = ? ORDER BY id")
    .all(id);
  const history = (db
    .prepare("SELECT * FROM homeownership_history WHERE profile_id = ?")
    .get(id) ?? {}) as Record<string, unknown>;
  const military = (db
    .prepare("SELECT * FROM military_profiles WHERE profile_id = ?")
    .get(id) ?? {}) as Record<string, unknown>;
  const preferences = (db
    .prepare("SELECT * FROM housing_preferences WHERE profile_id = ?")
    .get(id) ?? {}) as Record<string, unknown>;
  const assistance = (db
    .prepare("SELECT * FROM assistance_eligibility_attributes WHERE profile_id = ?")
    .get(id) ?? {}) as Record<string, unknown>;

  const raw = {
    id,
    createdAt: asString(row.created_at),
    updatedAt: asString(row.updated_at),
    onboardingStep: asNumber(row.onboarding_step),
    completedSteps: (() => {
      try {
        const parsed = JSON.parse(asString(row.completed_steps) ?? "[]");
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    })(),
    financial: {
      individualAnnualIncome: asNumber(financial.individual_annual_income),
      savings: asNumber(financial.savings),
      downPaymentAvailable: asNumber(financial.down_payment_available),
      closingCostFunds: asNumber(financial.closing_cost_funds),
      monthlyDebts: asNumber(financial.monthly_debts),
      monthlyRent: asNumber(financial.monthly_rent),
      creditScoreRange: asString(financial.credit_score_range),
      desiredMonthlyPayment: asNumber(financial.desired_monthly_payment),
      maxComfortableHousingPayment: asNumber(financial.max_comfortable_payment),
      maxPurchaseBudget: asNumber(financial.max_purchase_budget),
      incomeBasis: asString(financial.income_basis) ?? "gross",
    },
    household: {
      maritalStatus: asString(household.marital_status),
      adultsCount: asNumber(household.adults_count),
      dependentsCount: asNumber(household.dependents_count),
      childrenCount: asNumber(household.children_count),
      purchaseType: asString(household.purchase_type),
      spouseCoApplicant: asBool(household.spouse_co_applicant),
      multipleEarners: asBool(household.multiple_earners),
      singleParent: asBool(household.single_parent),
      members: members.map((member) => ({
        id: asString(member.id) ?? "",
        role: asString(member.role) ?? "buyer",
        isMortgageApplicant: asBool(member.is_mortgage_applicant) ?? false,
        relationship: asString(member.relationship),
        ageRange: asString(member.age_range),
      })),
    },
    incomeSources: incomeSources.map((source) => ({
      id: asString(source.id) ?? "",
      memberId: asString(source.member_id) ?? "",
      type: asString(source.type) ?? "other",
      label: asString(source.label),
      annualAmount: asNumber(source.annual_amount) ?? 0,
      basis: asString(source.basis) ?? "gross",
      recurring: asBool(source.recurring) ?? true,
    })),
    employment: employment.map((entry) => ({
      memberId: asString(entry.member_id) ?? "",
      status: asString(entry.status),
      occupationTitle: asString(entry.occupation_title),
      occupationCategory: asString(entry.occupation_category),
      industry: asString(entry.industry),
      employerName: asString(entry.employer_name),
      employerType: asString(entry.employer_type),
      employmentCity: asString(entry.employment_city),
      yearsEmployed: asNumber(entry.years_employed),
      annualEmploymentIncome: asNumber(entry.annual_employment_income),
      fullTime: asBool(entry.full_time),
    })),
    education: education.map((entry) => ({
      memberId: asString(entry.member_id) ?? "",
      isEnrolled: asBool(entry.is_enrolled),
      institutionType: asString(entry.institution_type),
      enrollmentStatus: asString(entry.enrollment_status),
      expectedGraduation: asString(entry.expected_graduation),
      studentLoanBalance: asNumber(entry.student_loan_balance),
      monthlyStudentLoanPayment: asNumber(entry.monthly_student_loan_payment),
      employedWhileStudent: asBool(entry.employed_while_student),
      institutionalHousingBenefit: asBool(entry.institutional_housing_benefit),
      institutionalBenefitNotes: asString(entry.institutional_benefit_notes),
    })),
    homeownership: {
      currentHousing: asString(history.current_housing),
      yearsAtResidence: asNumber(history.years_at_residence),
      monthlyRent: asNumber(history.monthly_rent),
      previouslyOwnedHome: asBool(history.previously_owned_home),
      soldPreviousHome: asBool(history.sold_previous_home),
      yearsSinceLastOwned: asNumber(history.years_since_last_owned),
      firstPrimaryResidence: asBool(history.first_primary_residence),
      ownsOtherProperty: asBool(history.owns_other_property),
      previouslyReceivedAssistance: asBool(history.previously_received_assistance),
    },
    military: {
      status: asString(military.status),
      currentlyServing: asBool(military.currently_serving),
      serviceEra: asString(military.service_era),
      vaLoanEntitlement: asString(military.va_loan_entitlement),
      preferNotToSay: asBool(military.prefer_not_to_say),
    },
    preferences: {
      propertyTypes: asArray(preferences.property_types),
      minBeds: asNumber(preferences.min_beds),
      minBaths: asNumber(preferences.min_baths),
      minSqft: asNumber(preferences.min_sqft),
      maxHoa: asNumber(preferences.max_hoa),
      parking: asString(preferences.parking),
      garage: asBool(preferences.garage),
      yard: asBool(preferences.yard),
      accessibilityFeatures: asArray(preferences.accessibility_features),
      condition: asString(preferences.condition),
      arrangement: asString(preferences.arrangement),
      cities: asArray(preferences.cities),
      maxCommuteMinutes: asNumber(preferences.max_commute_minutes),
      workplaceCity: asString(preferences.workplace_city),
      schoolCity: asString(preferences.school_city),
      transitImportance: asNumber(preferences.transit_importance),
      setting: asString(preferences.setting),
      flexibleLocation: asBool(preferences.flexible_location),
    },
    assistance: {
      firstGenerationHomebuyer: asBool(assistance.first_generation_homebuyer),
      previouslyReceivedHousingAssistance: asBool(assistance.previously_received_housing_assistance),
      participatedInAffordableHousing: asBool(assistance.participated_in_affordable_housing),
      targetedGeographicArea: asBool(assistance.targeted_geographic_area),
      employerBenefitAvailable: asBool(assistance.employer_benefit_available),
      employerBenefitKind: asString(assistance.employer_benefit_kind),
      employerBenefitAmount: asNumber(assistance.employer_benefit_amount),
      employerBenefitNotes: asString(assistance.employer_benefit_notes),
      institutionalBenefitAvailable: asBool(assistance.institutional_benefit_available),
      institutionalBenefitNotes: asString(assistance.institutional_benefit_notes),
      communityProgramNotes: asString(assistance.community_program_notes),
    },
  };

  return normalizeProfile(raw, id);
}

export function saveProfile(profile: BuyerProfile): BuyerProfile {
  const db = connect();
  const normalized = normalizeProfile(profile, profile.id);
  const id = profile.id;

  db.exec("BEGIN");
  try {
    db.prepare(
      `INSERT INTO profiles (id, created_at, updated_at, onboarding_step, completed_steps)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET updated_at = excluded.updated_at,
         onboarding_step = excluded.onboarding_step, completed_steps = excluded.completed_steps`,
    ).run(
      id,
      normalized.createdAt,
      normalized.updatedAt,
      normalized.onboardingStep,
      JSON.stringify(normalized.completedSteps),
    );

    const f = normalized.financial;
    db.prepare(
      `INSERT INTO financial_profiles (profile_id, individual_annual_income, savings, down_payment_available,
        closing_cost_funds, monthly_debts, monthly_rent, credit_score_range, desired_monthly_payment,
        max_comfortable_payment, max_purchase_budget, income_basis)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(profile_id) DO UPDATE SET
        individual_annual_income = excluded.individual_annual_income, savings = excluded.savings,
        down_payment_available = excluded.down_payment_available, closing_cost_funds = excluded.closing_cost_funds,
        monthly_debts = excluded.monthly_debts, monthly_rent = excluded.monthly_rent,
        credit_score_range = excluded.credit_score_range, desired_monthly_payment = excluded.desired_monthly_payment,
        max_comfortable_payment = excluded.max_comfortable_payment, max_purchase_budget = excluded.max_purchase_budget,
        income_basis = excluded.income_basis`,
    ).run(
      id,
      n(f.individualAnnualIncome),
      n(f.savings),
      n(f.downPaymentAvailable),
      n(f.closingCostFunds),
      n(f.monthlyDebts),
      n(f.monthlyRent),
      s(f.creditScoreRange),
      n(f.desiredMonthlyPayment),
      n(f.maxComfortableHousingPayment),
      n(f.maxPurchaseBudget),
      f.incomeBasis,
    );

    const h = normalized.household;
    db.prepare(
      `INSERT INTO households (profile_id, marital_status, adults_count, dependents_count, children_count,
        purchase_type, spouse_co_applicant, multiple_earners, single_parent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(profile_id) DO UPDATE SET
        marital_status = excluded.marital_status, adults_count = excluded.adults_count,
        dependents_count = excluded.dependents_count, children_count = excluded.children_count,
        purchase_type = excluded.purchase_type, spouse_co_applicant = excluded.spouse_co_applicant,
        multiple_earners = excluded.multiple_earners, single_parent = excluded.single_parent`,
    ).run(
      id,
      s(h.maritalStatus),
      n(h.adultsCount),
      n(h.dependentsCount),
      n(h.childrenCount),
      s(h.purchaseType),
      b(h.spouseCoApplicant),
      b(h.multipleEarners),
      b(h.singleParent),
    );

    db.prepare("DELETE FROM household_members WHERE profile_id = ?").run(id);
    for (const member of h.members) {
      db.prepare(
        `INSERT INTO household_members (id, profile_id, role, is_mortgage_applicant, relationship, age_range)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(member.id, id, member.role, b(member.isMortgageApplicant), s(member.relationship), s(member.ageRange));
    }

    db.prepare("DELETE FROM household_income_sources WHERE profile_id = ?").run(id);
    for (const source of normalized.incomeSources) {
      db.prepare(
        `INSERT INTO household_income_sources (id, profile_id, member_id, type, label, annual_amount, basis, recurring)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        source.id,
        id,
        source.memberId,
        source.type,
        s(source.label),
        source.annualAmount,
        source.basis,
        b(source.recurring),
      );
    }

    db.prepare("DELETE FROM employment_profiles WHERE profile_id = ?").run(id);
    for (const entry of normalized.employment) {
      db.prepare(
        `INSERT INTO employment_profiles (profile_id, member_id, status, occupation_title, occupation_category,
          industry, employer_name, employer_type, employment_city, years_employed, annual_employment_income, full_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        id,
        entry.memberId,
        s(entry.status),
        s(entry.occupationTitle),
        s(entry.occupationCategory),
        s(entry.industry),
        s(entry.employerName),
        s(entry.employerType),
        s(entry.employmentCity),
        n(entry.yearsEmployed),
        n(entry.annualEmploymentIncome),
        b(entry.fullTime),
      );
    }

    db.prepare("DELETE FROM educational_profiles WHERE profile_id = ?").run(id);
    for (const entry of normalized.education) {
      db.prepare(
        `INSERT INTO educational_profiles (profile_id, member_id, is_enrolled, institution_type, enrollment_status,
          expected_graduation, student_loan_balance, monthly_student_loan_payment, employed_while_student,
          institutional_housing_benefit, institutional_benefit_notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        id,
        entry.memberId,
        b(entry.isEnrolled),
        s(entry.institutionType),
        s(entry.enrollmentStatus),
        s(entry.expectedGraduation),
        n(entry.studentLoanBalance),
        n(entry.monthlyStudentLoanPayment),
        b(entry.employedWhileStudent),
        b(entry.institutionalHousingBenefit),
        s(entry.institutionalBenefitNotes),
      );
    }

    const history = normalized.homeownership;
    db.prepare(
      `INSERT INTO homeownership_history (profile_id, current_housing, years_at_residence, monthly_rent,
        previously_owned_home, sold_previous_home, years_since_last_owned, first_primary_residence,
        owns_other_property, previously_received_assistance)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(profile_id) DO UPDATE SET
        current_housing = excluded.current_housing, years_at_residence = excluded.years_at_residence,
        monthly_rent = excluded.monthly_rent, previously_owned_home = excluded.previously_owned_home,
        sold_previous_home = excluded.sold_previous_home, years_since_last_owned = excluded.years_since_last_owned,
        first_primary_residence = excluded.first_primary_residence, owns_other_property = excluded.owns_other_property,
        previously_received_assistance = excluded.previously_received_assistance`,
    ).run(
      id,
      s(history.currentHousing),
      n(history.yearsAtResidence),
      n(history.monthlyRent),
      b(history.previouslyOwnedHome),
      b(history.soldPreviousHome),
      n(history.yearsSinceLastOwned),
      b(history.firstPrimaryResidence),
      b(history.ownsOtherProperty),
      b(history.previouslyReceivedAssistance),
    );

    const m = normalized.military;
    db.prepare(
      `INSERT INTO military_profiles (profile_id, status, currently_serving, service_era, va_loan_entitlement, prefer_not_to_say)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(profile_id) DO UPDATE SET
        status = excluded.status, currently_serving = excluded.currently_serving,
        service_era = excluded.service_era, va_loan_entitlement = excluded.va_loan_entitlement,
        prefer_not_to_say = excluded.prefer_not_to_say`,
    ).run(id, s(m.status), b(m.currentlyServing), s(m.serviceEra), s(m.vaLoanEntitlement), b(m.preferNotToSay));

    const p = normalized.preferences;
    db.prepare(
      `INSERT INTO housing_preferences (profile_id, property_types, min_beds, min_baths, min_sqft, max_hoa,
        parking, garage, yard, accessibility_features, condition, arrangement, cities, max_commute_minutes,
        workplace_city, school_city, transit_importance, setting, flexible_location)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(profile_id) DO UPDATE SET
        property_types = excluded.property_types, min_beds = excluded.min_beds, min_baths = excluded.min_baths,
        min_sqft = excluded.min_sqft, max_hoa = excluded.max_hoa, parking = excluded.parking,
        garage = excluded.garage, yard = excluded.yard, accessibility_features = excluded.accessibility_features,
        condition = excluded.condition, arrangement = excluded.arrangement, cities = excluded.cities,
        max_commute_minutes = excluded.max_commute_minutes, workplace_city = excluded.workplace_city,
        school_city = excluded.school_city, transit_importance = excluded.transit_importance,
        setting = excluded.setting, flexible_location = excluded.flexible_location`,
    ).run(
      id,
      j(p.propertyTypes),
      n(p.minBeds),
      n(p.minBaths),
      n(p.minSqft),
      n(p.maxHoa),
      s(p.parking),
      b(p.garage),
      b(p.yard),
      j(p.accessibilityFeatures),
      s(p.condition),
      s(p.arrangement),
      j(p.cities),
      n(p.maxCommuteMinutes),
      s(p.workplaceCity),
      s(p.schoolCity),
      n(p.transitImportance),
      s(p.setting),
      b(p.flexibleLocation),
    );

    const a = normalized.assistance;
    db.prepare(
      `INSERT INTO assistance_eligibility_attributes (profile_id, first_generation_homebuyer,
        previously_received_housing_assistance, participated_in_affordable_housing, targeted_geographic_area,
        employer_benefit_available, employer_benefit_kind, employer_benefit_amount, employer_benefit_notes,
        institutional_benefit_available, institutional_benefit_notes, community_program_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(profile_id) DO UPDATE SET
        first_generation_homebuyer = excluded.first_generation_homebuyer,
        previously_received_housing_assistance = excluded.previously_received_housing_assistance,
        participated_in_affordable_housing = excluded.participated_in_affordable_housing,
        targeted_geographic_area = excluded.targeted_geographic_area,
        employer_benefit_available = excluded.employer_benefit_available,
        employer_benefit_kind = excluded.employer_benefit_kind,
        employer_benefit_amount = excluded.employer_benefit_amount,
        employer_benefit_notes = excluded.employer_benefit_notes,
        institutional_benefit_available = excluded.institutional_benefit_available,
        institutional_benefit_notes = excluded.institutional_benefit_notes,
        community_program_notes = excluded.community_program_notes`,
    ).run(
      id,
      b(a.firstGenerationHomebuyer),
      b(a.previouslyReceivedHousingAssistance),
      b(a.participatedInAffordableHousing),
      b(a.targetedGeographicArea),
      b(a.employerBenefitAvailable),
      s(a.employerBenefitKind),
      n(a.employerBenefitAmount),
      s(a.employerBenefitNotes),
      b(a.institutionalBenefitAvailable),
      s(a.institutionalBenefitNotes),
      s(a.communityProgramNotes),
    );

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  return loadProfile(id) ?? normalized;
}

export function ensureProfile(id: string): BuyerProfile {
  return loadProfile(id) ?? saveProfile(emptyProfile(id));
}

export function deleteProfile(id: string): void {
  const db = connect();
  db.prepare("DELETE FROM profiles WHERE id = ?").run(id);
}

export function databasePath(): string {
  const dataDir = process.env.DATA_DIR ?? path.join(process.cwd(), ".data");
  return path.join(dataDir, "fundit.db");
}

export type { SqlValue };
