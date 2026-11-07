"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  BuyerProfile,
  EducationalProfile,
  EmploymentProfile,
  HouseholdMember,
  IncomeSource,
} from "@/lib/profile/types";
import { newId } from "@/lib/profile/defaults";
import { STEPS, computeCompleteness, totalAnnualIncome } from "@/lib/profile/completeness";
import { OC_CITIES } from "@/lib/data/oc";
import {
  ACCESSIBILITY_OPTIONS,
  ARRANGEMENT_OPTIONS,
  CREDIT_RANGE_OPTIONS,
  CURRENT_HOUSING_OPTIONS,
  EMPLOYER_TYPE_OPTIONS,
  EMPLOYMENT_STATUS_OPTIONS,
  ENROLLMENT_OPTIONS,
  INCOME_SOURCE_OPTIONS,
  INSTITUTION_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  MEMBER_ROLE_OPTIONS,
  MILITARY_OPTIONS,
  OCCUPATION_OPTIONS,
  PARKING_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  type Option,
} from "@/lib/profile/options";
import { money } from "@/lib/format";
import {
  ChoiceField,
  MoneyField,
  MultiChoiceField,
  NumberField,
  SelectField,
  TextAreaField,
  TextField,
  YesNoField,
} from "@/components/ui";

interface Props {
  initialProfile: BuyerProfile;
  initialStep: number;
}

const BENEFIT_KIND_OPTIONS: Option<"grant" | "loan" | "matched_savings" | "unknown">[] = [
  { value: "grant", label: "Grant" },
  { value: "loan", label: "Loan" },
  { value: "matched_savings", label: "Matched savings" },
  { value: "unknown", label: "Not sure" },
];

const VA_OPTIONS: Option<"yes" | "no" | "unsure">[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unsure", label: "Not sure" },
];

const TRANSIT_OPTIONS: Option<string>[] = [
  { value: "1", label: "1 — not important" },
  { value: "2", label: "2" },
  { value: "3", label: "3 — nice to have" },
  { value: "4", label: "4" },
  { value: "5", label: "5 — essential" },
];

const CONDITION_OPTIONS: Option<"new" | "existing" | "either" | "fixer_ok">[] = [
  { value: "new", label: "New construction" },
  { value: "existing", label: "Move-in ready" },
  { value: "fixer_ok", label: "A fixer is okay" },
  { value: "either", label: "No preference" },
];

const SETTING_OPTIONS: Option<"urban" | "suburban" | "rural" | "any">[] = [
  { value: "urban", label: "Urban" },
  { value: "suburban", label: "Suburban" },
  { value: "rural", label: "Rural" },
  { value: "any", label: "No preference" },
];

const CITY_OPTIONS: Option<string>[] = OC_CITIES.map((city) => ({ value: city, label: city }));

function memberLabel(member: HouseholdMember, index: number): string {
  switch (member.role) {
    case "buyer":
      return "You";
    case "co_buyer":
      return `Co-buyer ${index}`;
    case "spouse_partner":
      return "Spouse or partner";
    case "dependent":
      return `Dependent ${index}`;
    default:
      return `Household member ${index}`;
  }
}

export default function OnboardingWizard({ initialProfile, initialStep }: Props) {
  const router = useRouter();
  const [profile, setProfile] = useState<BuyerProfile>(initialProfile);
  const [step, setStep] = useState(Math.min(7, Math.max(1, initialStep)));
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const completeness = useMemo(() => computeCompleteness(profile), [profile]);
  const meta = STEPS[step - 1];
  const applicants = useMemo(() => {
    const list = profile.household.members.filter((member) => member.isMortgageApplicant);
    return list.length > 0 ? list : profile.household.members.slice(0, 1);
  }, [profile.household.members]);
  const annualIncome = totalAnnualIncome(profile);

  const updateFinancial = (patch: Partial<BuyerProfile["financial"]>) =>
    setProfile((current) => ({ ...current, financial: { ...current.financial, ...patch } }));
  const updateHousehold = (patch: Partial<BuyerProfile["household"]>) =>
    setProfile((current) => ({ ...current, household: { ...current.household, ...patch } }));
  const updateHomeownership = (patch: Partial<BuyerProfile["homeownership"]>) =>
    setProfile((current) => ({ ...current, homeownership: { ...current.homeownership, ...patch } }));
  const updateMilitary = (patch: Partial<BuyerProfile["military"]>) =>
    setProfile((current) => ({ ...current, military: { ...current.military, ...patch } }));
  const updatePreferences = (patch: Partial<BuyerProfile["preferences"]>) =>
    setProfile((current) => ({ ...current, preferences: { ...current.preferences, ...patch } }));
  const updateAssistance = (patch: Partial<BuyerProfile["assistance"]>) =>
    setProfile((current) => ({ ...current, assistance: { ...current.assistance, ...patch } }));

  const addIncomeSource = () =>
    setProfile((current) => ({
      ...current,
      incomeSources: [
        ...current.incomeSources,
        {
          id: newId("income"),
          memberId: applicants[0]?.id ?? current.household.members[0]?.id ?? "member_buyer",
          type: "employment",
          annualAmount: 0,
          basis: "gross",
          recurring: true,
        },
      ],
    }));

  const updateIncomeSource = (id: string, patch: Partial<IncomeSource>) =>
    setProfile((current) => ({
      ...current,
      incomeSources: current.incomeSources.map((source) =>
        source.id === id ? { ...source, ...patch } : source,
      ),
    }));

  const removeIncomeSource = (id: string) =>
    setProfile((current) => ({
      ...current,
      incomeSources: current.incomeSources.filter((source) => source.id !== id),
    }));

  const updateEmployment = (memberId: string, patch: Partial<EmploymentProfile>) =>
    setProfile((current) => {
      const existing = current.employment.find((entry) => entry.memberId === memberId);
      return {
        ...current,
        employment: existing
          ? current.employment.map((entry) =>
              entry.memberId === memberId ? { ...entry, ...patch } : entry,
            )
          : [...current.employment, { memberId, ...patch }],
      };
    });

  const updateEducation = (memberId: string, patch: Partial<EducationalProfile>) =>
    setProfile((current) => {
      const existing = current.education.find((entry) => entry.memberId === memberId);
      return {
        ...current,
        education: existing
          ? current.education.map((entry) =>
              entry.memberId === memberId ? { ...entry, ...patch } : entry,
            )
          : [...current.education, { memberId, ...patch }],
      };
    });

  const addMember = (role: HouseholdMember["role"]) =>
    setProfile((current) => ({
      ...current,
      household: {
        ...current.household,
        members: [
          ...current.household.members,
          {
            id: newId("member"),
            role,
            isMortgageApplicant: role === "co_buyer" || role === "spouse_partner",
          },
        ],
      },
    }));

  const updateMember = (id: string, patch: Partial<HouseholdMember>) =>
    setProfile((current) => ({
      ...current,
      household: {
        ...current.household,
        members: current.household.members.map((member) =>
          member.id === id ? { ...member, ...patch } : member,
        ),
      },
    }));

  const removeMember = (id: string) =>
    setProfile((current) => {
      if (current.household.members.length <= 1) return current;
      const members = current.household.members.filter((member) => member.id !== id);
      if (!members.some((member) => member.isMortgageApplicant)) {
        members[0] = { ...members[0], isMortgageApplicant: true };
      }
      return {
        ...current,
        household: { ...current.household, members },
        incomeSources: current.incomeSources.filter((source) => source.memberId !== id),
        employment: current.employment.filter((entry) => entry.memberId !== id),
        education: current.education.filter((entry) => entry.memberId !== id),
      };
    });

  async function persist(next: BuyerProfile, nextStep: number): Promise<BuyerProfile | null> {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...next, onboardingStep: nextStep }),
      });
      if (!response.ok) throw new Error(`Save failed with ${response.status}`);
      const data = (await response.json()) as { profile: BuyerProfile };
      setProfile(data.profile);
      setSavedAt(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
      return data.profile;
    } catch {
      setError("We could not save just now. Your answers are still on this screen; try again.");
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function goTo(nextStep: number) {
    const bounded = Math.min(7, Math.max(1, nextStep));
    const completed = Array.from(new Set([...profile.completedSteps, step])).sort((a, b) => a - b);
    const next = { ...profile, completedSteps: completed, onboardingStep: bounded };
    setProfile(next);
    setStep(bounded);
    window.scrollTo({ top: 0, behavior: "smooth" });
    await persist(next, bounded);
  }

  async function finish() {
    const completed = Array.from(new Set([...profile.completedSteps, 7])).sort((a, b) => a - b);
    const next = { ...profile, completedSteps: completed, onboardingStep: 7 };
    const saved = await persist(next, 7);
    if (saved) {
      router.push("/results");
      router.refresh();
    }
  }

  function renderFinancial() {
    return (
      <>
        <div className="section-card">
          <div className="section-card__title">
            <h3>Income, by source</h3>
            <span className="tiny muted">Annual amounts</span>
          </div>
          <p className="section-card__desc">
            Add every recurring source that should count. Programs generally count gross income
            before taxes; tell us which figure you entered so we do not compare the wrong one.
          </p>

          {profile.incomeSources.length === 0 ? (
            <div className="notice notice--info">
              <p>
                No income sources yet. Add at least one, or use the single annual income field
                below. A household with more than one earner should add each source separately.
              </p>
            </div>
          ) : null}

          {profile.incomeSources.map((source) => (
            <div className="repeat-row" key={source.id}>
              <div className="repeat-row__head">
                <span className="repeat-row__title">Income source</span>
                <button
                  type="button"
                  className="btn btn--quiet btn--small"
                  onClick={() => removeIncomeSource(source.id)}
                >
                  Remove
                </button>
              </div>
              <div className="field-grid">
                <SelectField
                  label="Type"
                  options={INCOME_SOURCE_OPTIONS}
                  value={source.type}
                  onChange={(value) => value && updateIncomeSource(source.id, { type: value })}
                />
                <SelectField
                  label="Whose income"
                  options={profile.household.members.map((member, index) => ({
                    value: member.id,
                    label: memberLabel(member, index + 1),
                  }))}
                  value={source.memberId}
                  onChange={(value) => value && updateIncomeSource(source.id, { memberId: value })}
                />
                <MoneyField
                  label="Annual amount"
                  value={source.annualAmount || undefined}
                  onChange={(value) => updateIncomeSource(source.id, { annualAmount: value ?? 0 })}
                  hint="Use an annual figure. For hourly work, estimate from usual hours."
                />
                <SelectField
                  label="Is this gross or net?"
                  options={[
                    { value: "gross", label: "Gross (before taxes)" },
                    { value: "net", label: "Net (take-home)" },
                  ]}
                  value={source.basis}
                  onChange={(value) => value && updateIncomeSource(source.id, { basis: value })}
                  why="Most programs test gross income. Mixing gross and net would understate or overstate what you can afford."
                />
              </div>
              <label className="checkline" style={{ marginBottom: 14 }}>
                <input
                  type="checkbox"
                  checked={source.recurring}
                  onChange={(event) =>
                    updateIncomeSource(source.id, { recurring: event.target.checked })
                  }
                />
                Recurring income (counts toward qualifying income)
              </label>
            </div>
          ))}

          <div className="wizard__actions" style={{ borderTop: 0, paddingTop: 0, marginTop: 0 }}>
            <button type="button" className="btn btn--small" onClick={addIncomeSource}>
              + Add income source
            </button>
            <span className="spacer" />
            <span className="tiny muted">
              Recurring total: <strong>{money(annualIncome)}</strong> per year
            </span>
          </div>

          <div style={{ marginTop: 18 }}>
            <MoneyField
              label="Or: your annual income, if you would rather enter one number"
              optional
              value={profile.financial.individualAnnualIncome}
              onChange={(value) => updateFinancial({ individualAnnualIncome: value })}
              hint="Used only when no income sources are entered."
              why="This is a fallback. If you add sources above, we use those instead so joint income and other income stay distinguishable."
            />
          </div>
        </div>

        <div className="section-card">
          <h3>Cash you could put toward the home</h3>
          <p className="section-card__desc">
            These are your own funds, before any assistance. Assistance is estimated separately and
            is never assumed to be approved.
          </p>
          <div className="field-grid">
            <MoneyField
              label="Savings available"
              optional
              value={profile.financial.savings}
              onChange={(value) => updateFinancial({ savings: value })}
            />
            <MoneyField
              label="Down payment available"
              optional
              value={profile.financial.downPaymentAvailable}
              onChange={(value) => updateFinancial({ downPaymentAvailable: value })}
              why="We use this to estimate the loan amount and the price you can afford. If you leave it blank, we assume $0 down rather than invent a number."
            />
            <MoneyField
              label="Closing-cost funds"
              optional
              value={profile.financial.closingCostFunds}
              onChange={(value) => updateFinancial({ closingCostFunds: value })}
              hint="Some programs can cover part of this; we do not assume they will."
            />
            <MoneyField
              label="Current savings toward reserves"
              optional
              value={profile.financial.savings}
              onChange={(value) => updateFinancial({ savings: value })}
              hint="Lenders often want cash left after closing. We do not require it here."
            />
          </div>
        </div>

        <div className="section-card">
          <h3>Monthly obligations and comfort</h3>
          <p className="section-card__desc">
            We cap the estimate at the lowest of your comfortable payment, a share of income, and a
            total-debt ceiling. We never quietly stretch your number.
          </p>
          <div className="field-grid">
            <MoneyField
              label="Monthly debt payments"
              value={profile.financial.monthlyDebts}
              onChange={(value) => updateFinancial({ monthlyDebts: value })}
              hint="Minimum payments on cars, credit cards, student loans and child support. Enter 0 if none."
              why="Lenders count these against your income. Student loans belong here even if payments are paused."
            />
            <MoneyField
              label="Monthly rent now"
              optional
              value={profile.financial.monthlyRent ?? profile.homeownership.monthlyRent}
              onChange={(value) => updateFinancial({ monthlyRent: value })}
            />
            <MoneyField
              label="Monthly payment you want"
              optional
              value={profile.financial.desiredMonthlyPayment}
              onChange={(value) => updateFinancial({ desiredMonthlyPayment: value })}
            />
            <MoneyField
              label="Maximum comfortable monthly payment"
              optional
              value={profile.financial.maxComfortableHousingPayment}
              onChange={(value) => updateFinancial({ maxComfortableHousingPayment: value })}
              why="This becomes the first limit we test homes against. A number that feels safe matters more than the maximum a lender might allow."
            />
            <MoneyField
              label="Maximum purchase budget"
              optional
              value={profile.financial.maxPurchaseBudget}
              onChange={(value) => updateFinancial({ maxPurchaseBudget: value })}
              hint="A hard ceiling, separate from the monthly payment."
            />
            <SelectField
              label="Credit score range"
              optional
              options={CREDIT_RANGE_OPTIONS}
              value={profile.financial.creditScoreRange}
              onChange={(value) => updateFinancial({ creditScoreRange: value })}
              why="Some loan programs and lenders use it. It never affects which neighborhoods or homes we show."
            />
          </div>
        </div>

        <div className="notice">
          <p>
            <strong>Household total:</strong> {money(annualIncome)} a year from{" "}
            {profile.incomeSources.filter((source) => source.recurring).length} recurring source
            {profile.incomeSources.filter((source) => source.recurring).length === 1 ? "" : "s"}.
            {profile.incomeSources.some((source) => source.basis === "net")
              ? " At least one source is entered as net income; programs usually test gross income, so the income tests below may read lower than reality."
              : ""}
          </p>
        </div>
      </>
    );
  }

  function renderHousehold() {
    return (
      <>
        <div className="section-card">
          <h3>Household composition</h3>
          <p className="section-card__desc">
            Programs define household differently: some count everyone who lives there, some count
            borrowers only. We ask for both and apply each program's own rule.
          </p>
          <ChoiceField
            label="Marital status"
            optional
            options={MARITAL_STATUS_OPTIONS}
            value={profile.household.maritalStatus}
            onChange={(value) => updateHousehold({ maritalStatus: value })}
            why="Marital status does not decide eligibility here. It is used only where a program explicitly has a rule about spouses or co-borrowers."
          />
          <div className="field-grid field-grid--3">
            <NumberField
              label="Adults in household"
              value={profile.household.adultsCount}
              onChange={(value) => updateHousehold({ adultsCount: value })}
              hint="Including you."
            />
            <NumberField
              label="Dependents"
              value={profile.household.dependentsCount}
              onChange={(value) => updateHousehold({ dependentsCount: value })}
              hint="Anyone you support."
            />
            <NumberField
              label="Children"
              optional
              value={profile.household.childrenCount}
              onChange={(value) => updateHousehold({ childrenCount: value })}
              why="Only some programs use this. Household size is the number that changes most income limits."
            />
          </div>
          <div className="field-grid">
            <ChoiceField
              label="Are you buying alone or jointly?"
              options={[
                { value: "individual", label: "Alone" },
                { value: "joint", label: "Jointly" },
              ]}
              value={profile.household.purchaseType}
              onChange={(value) => updateHousehold({ purchaseType: value })}
              columns={2}
            />
            <YesNoField
              label="Will a spouse or partner be a co-applicant?"
              optional
              value={profile.household.spouseCoApplicant}
              onChange={(value) => updateHousehold({ spouseCoApplicant: value })}
              why="Some programs have rules about who must be on the loan. A household member is not automatically an applicant."
            />
          </div>
          <div className="field-grid">
            <YesNoField
              label="More than one person earns income?"
              optional
              value={profile.household.multipleEarners}
              onChange={(value) => updateHousehold({ multipleEarners: value })}
            />
            <YesNoField
              label="Are you a single parent?"
              optional
              value={profile.household.singleParent}
              onChange={(value) => updateHousehold({ singleParent: value })}
              why="Voluntary. A small number of programs are specific to single parents; we never infer this from other answers."
            />
          </div>
        </div>

        <div className="section-card">
          <div className="section-card__title">
            <h3>Who is in the household</h3>
            <span className="tiny muted">Separate from applicants</span>
          </div>
          <p className="section-card__desc">
            Add people so we can tell a household member from a mortgage applicant. Names are not
            needed and should not be entered.
          </p>
          {profile.household.members.map((member, index) => (
            <div className="member-row" key={member.id}>
              <span className="member-row__name">{memberLabel(member, index + 1)}</span>
              <div style={{ minWidth: 190, flex: 1 }}>
                <SelectField
                  label="Role"
                  options={MEMBER_ROLE_OPTIONS}
                  value={member.role}
                  onChange={(value) => value && updateMember(member.id, { role: value })}
                />
              </div>
              <label className="checkline">
                <input
                  type="checkbox"
                  checked={member.isMortgageApplicant}
                  onChange={(event) =>
                    updateMember(member.id, { isMortgageApplicant: event.target.checked })
                  }
                />
                On the loan
              </label>
              {profile.household.members.length > 1 ? (
                <button
                  type="button"
                  className="btn btn--quiet btn--small"
                  onClick={() => removeMember(member.id)}
                >
                  Remove
                </button>
              ) : null}
            </div>
          ))}
          <div className="wizard__actions" style={{ borderTop: 0, paddingTop: 0, marginTop: 12 }}>
            <button type="button" className="btn btn--small" onClick={() => addMember("co_buyer")}>
              + Add co-buyer
            </button>
            <button type="button" className="btn btn--small" onClick={() => addMember("spouse_partner")}>
              + Add spouse or partner
            </button>
            <button type="button" className="btn btn--small" onClick={() => addMember("dependent")}>
              + Add dependent
            </button>
          </div>
        </div>
      </>
    );
  }

  function renderEmployment() {
    return (
      <>
        <div className="notice notice--info">
          <p>
            An occupation does not grant eligibility. Each program has its own occupation rule, and
            we check it individually. Answer what you are comfortable sharing: every field on this
            step is optional.
          </p>
        </div>

        {applicants.map((member, index) => {
          const employment = profile.employment.find((entry) => entry.memberId === member.id);
          const education = profile.education.find((entry) => entry.memberId === member.id);
          return (
            <div className="section-card" key={member.id}>
              <div className="section-card__title">
                <h3>{memberLabel(member, index + 1)}: work</h3>
                <span className="tiny muted">Optional</span>
              </div>
              <div className="field-grid">
                <SelectField
                  label="Employment status"
                  options={EMPLOYMENT_STATUS_OPTIONS}
                  value={employment?.status}
                  onChange={(value) => updateEmployment(member.id, { status: value })}
                  why="Some programs are limited to employees, self-employed workers, students or veterans. We do not assume any of these."
                />
                <WeatherFreeText
                  label="Occupation or job title"
                  value={employment?.occupationTitle}
                  onChange={(value) => updateEmployment(member.id, { occupationTitle: value })}
                  placeholder="For example: elementary school teacher"
                  optional
                />
                <SelectField
                  label="Occupation category"
                  options={OCCUPATION_OPTIONS}
                  value={employment?.occupationCategory}
                  onChange={(value) => updateEmployment(member.id, { occupationCategory: value })}
                  why="This is what profession-specific programs test. Choose 'prefer not to say' and we will mark those programs as open questions instead of guessing."
                />
                <TextField
                  label="Industry"
                  optional
                  value={employment?.industry}
                  onChange={(value) => updateEmployment(member.id, { industry: value })}
                  placeholder="For example: public education"
                />
                <SelectField
                  label="Employer type"
                  optional
                  options={EMPLOYER_TYPE_OPTIONS}
                  value={employment?.employerType}
                  onChange={(value) => updateEmployment(member.id, { employerType: value })}
                  why="Employer type can matter for employer-assisted housing. An employer name is not required."
                />
                <SelectField
                  label="Where you work"
                  optional
                  options={CITY_OPTIONS}
                  value={employment?.employmentCity}
                  onChange={(value) => updateEmployment(member.id, { employmentCity: value })}
                  placeholder="Choose a city"
                />
                <NumberField
                  label="Years with this employer"
                  optional
                  value={employment?.yearsEmployed}
                  onChange={(value) => updateEmployment(member.id, { yearsEmployed: value })}
                />
                <MoneyField
                  label="Annual employment income"
                  optional
                  value={employment?.annualEmploymentIncome}
                  onChange={(value) => updateEmployment(member.id, { annualEmploymentIncome: value })}
                  hint="Descriptive only. The income sources you entered drive the actual calculation."
                />
              </div>
              <YesNoField
                label="Is this full-time?"
                optional
                value={employment?.fullTime}
                onChange={(value) => updateEmployment(member.id, { fullTime: value })}
              />
            </div>
          );
        })}

        {applicants.map((member, index) => {
          const education = profile.education.find((entry) => entry.memberId === member.id);
          return (
            <div className="section-card" key={`edu-${member.id}`}>
              <div className="section-card__title">
                <h3>{memberLabel(member, index + 1)}: school</h3>
                <span className="tiny muted">Optional</span>
              </div>
              <p className="section-card__desc">
                Student status may help identify institutional or employer-related housing
                opportunities. It does not qualify anyone on its own.
              </p>
              <div className="field-grid">
                <YesNoField
                  label="Currently enrolled?"
                  optional
                  value={education?.isEnrolled}
                  onChange={(value) => updateEducation(member.id, { isEnrolled: value })}
                />
                <SelectField
                  label="Institution type"
                  optional
                  options={INSTITUTION_OPTIONS}
                  value={education?.institutionType}
                  onChange={(value) => updateEducation(member.id, { institutionType: value })}
                />
                <SelectField
                  label="Enrollment status"
                  optional
                  options={ENROLLMENT_OPTIONS}
                  value={education?.enrollmentStatus}
                  onChange={(value) => updateEducation(member.id, { enrollmentStatus: value })}
                />
                <TextField
                  label="Expected graduation"
                  optional
                  type="month"
                  value={education?.expectedGraduation}
                  onChange={(value) => updateEducation(member.id, { expectedGraduation: value })}
                />
                <MoneyField
                  label="Student loan balance"
                  optional
                  value={education?.studentLoanBalance}
                  onChange={(value) => updateEducation(member.id, { studentLoanBalance: value })}
                  hint="Balance, not payment. The payment belongs in monthly debts."
                />
                <MoneyField
                  label="Monthly student loan payment"
                  optional
                  value={education?.monthlyStudentLoanPayment}
                  onChange={(value) => updateEducation(member.id, { monthlyStudentLoanPayment: value })}
                />
              </div>
              <div className="field-grid">
                <YesNoField
                  label="Working while enrolled?"
                  optional
                  value={education?.employedWhileStudent}
                  onChange={(value) => updateEducation(member.id, { employedWhileStudent: value })}
                />
                <YesNoField
                  label="Does the school or employer offer a housing benefit?"
                  optional
                  value={education?.institutionalHousingBenefit}
                  onChange={(value) =>
                    updateEducation(member.id, { institutionalHousingBenefit: value })
                  }
                  why="We do not assume any institution offers this. If you say yes, we add it as a user-reported opportunity with open questions."
                />
              </div>
              {education?.institutionalHousingBenefit ? (
                <TextAreaField
                  label="What does the benefit provide?"
                  optional
                  value={education.institutionalBenefitNotes}
                  onChange={(value) => updateEducation(member.id, { institutionalBenefitNotes: value })}
                  placeholder="For example: a down payment grant or a shared-appreciation loan. No names or personal details."
                />
              ) : null}
            </div>
          );
        })}
      </>
    );
  }

  function renderHousing() {
    return (
      <>
        <div className="section-card">
          <h3>Where you live now</h3>
          <p className="section-card__desc">
            First-time buyer rules vary by program, and some use a multi-year lookback. We ask about
            the past instead of inferring it from age or household.
          </p>
          <ChoiceField
            label="Current housing situation"
            options={CURRENT_HOUSING_OPTIONS}
            value={profile.homeownership.currentHousing}
            onChange={(value) => updateHomeownership({ currentHousing: value })}
            columns={2}
          />
          <div className="field-grid">
            <NumberField
              label="Years at this address"
              optional
              value={profile.homeownership.yearsAtResidence}
              onChange={(value) => updateHomeownership({ yearsAtResidence: value })}
            />
            <MoneyField
              label="Monthly rent"
              optional
              value={profile.homeownership.monthlyRent}
              onChange={(value) => updateHomeownership({ monthlyRent: value })}
            />
          </div>
        </div>

        <div className="section-card">
          <h3>Homeownership history</h3>
          <div className="field-grid">
            <YesNoField
              label="Have you owned a home before?"
              value={profile.homeownership.previouslyOwnedHome}
              onChange={(value) => updateHomeownership({ previouslyOwnedHome: value })}
              why="Many programs define first-time buyer as not having owned in a set number of years. We apply each program's own lookback."
            />
            <YesNoField
              label="Did you sell that home?"
              optional
              value={profile.homeownership.soldPreviousHome}
              onChange={(value) => updateHomeownership({ soldPreviousHome: value })}
            />
            <NumberField
              label="Years since you last owned"
              optional
              value={profile.homeownership.yearsSinceLastOwned}
              onChange={(value) => updateHomeownership({ yearsSinceLastOwned: value })}
              hint="Only needed if you owned before."
              why="This is what lets us test a program's lookback instead of assuming you are or are not a first-time buyer."
            />
            <YesNoField
              label="Is this your first primary residence?"
              optional
              value={profile.homeownership.firstPrimaryResidence}
              onChange={(value) => updateHomeownership({ firstPrimaryResidence: value })}
            />
            <YesNoField
              label="Do you own other property?"
              optional
              value={profile.homeownership.ownsOtherProperty}
              onChange={(value) => updateHomeownership({ ownsOtherProperty: value })}
            />
            <YesNoField
              label="Have you received homebuyer assistance before?"
              optional
              value={profile.homeownership.previouslyReceivedAssistance}
              onChange={(value) => updateHomeownership({ previouslyReceivedAssistance: value })}
              why="Some programs limit repeat assistance. Others do not care."
            />
          </div>
        </div>
      </>
    );
  }

  function renderProperty() {
    return (
      <>
        <div className="section-card">
          <h3>What you want to buy</h3>
          <p className="section-card__desc">
            These preferences filter the sample homes and help the engine test property-type rules.
            They do not change your eligibility by themselves.
          </p>
          <MultiChoiceField
            label="Property types you would consider"
            options={PROPERTY_TYPE_OPTIONS}
            values={profile.preferences.propertyTypes}
            onChange={(values) => updatePreferences({ propertyTypes: values })}
            columns={2}
          />
          <div className="field-grid field-grid--3">
            <NumberField
              label="Minimum bedrooms"
              optional
              value={profile.preferences.minBeds}
              onChange={(value) => updatePreferences({ minBeds: value })}
              max={10}
            />
            <NumberField
              label="Minimum bathrooms"
              optional
              value={profile.preferences.minBaths}
              onChange={(value) => updatePreferences({ minBaths: value })}
            />
            <NumberField
              label="Minimum square feet"
              optional
              value={profile.preferences.minSqft}
              onChange={(value) => updatePreferences({ minSqft: value })}
              suffix="sq ft"
            />
          </div>
          <div className="field-grid">
            <MoneyField
              label="Maximum HOA fee per month"
              optional
              value={profile.preferences.maxHoa}
              onChange={(value) => updatePreferences({ maxHoa: value })}
              why="HOA dues count toward the monthly housing cost, so a high HOA lowers the price you can carry."
            />
            <SelectField
              label="Parking"
              optional
              options={PARKING_OPTIONS}
              value={profile.preferences.parking}
              onChange={(value) => updatePreferences({ parking: value })}
            />
          </div>
          <div className="field-grid">
            <YesNoField
              label="Need a garage?"
              optional
              value={profile.preferences.garage}
              onChange={(value) => updatePreferences({ garage: value })}
            />
            <YesNoField
              label="Need a yard?"
              optional
              value={profile.preferences.yard}
              onChange={(value) => updatePreferences({ yard: value })}
            />
          </div>
          <MultiChoiceField
            label="Accessibility needs"
            optional
            options={ACCESSIBILITY_OPTIONS}
            values={profile.preferences.accessibilityFeatures ?? []}
            onChange={(values) => updatePreferences({ accessibilityFeatures: values })}
            columns={2}
          />
          <ChoiceField
            label="Condition"
            options={CONDITION_OPTIONS}
            value={profile.preferences.condition}
            onChange={(value) => updatePreferences({ condition: value })}
            columns={2}
          />
        </div>

        <div className="section-card">
          <h3>How you would hold the home</h3>
          <ChoiceField
            label="Housing arrangement"
            options={ARRANGEMENT_OPTIONS}
            value={profile.preferences.arrangement}
            onChange={(value) => updatePreferences({ arrangement: value })}
            why="Owner-occupied programs usually require this to be your primary residence. House hacking and multigenerational living are still owner-occupied, but some programs have their own rules."
          />
        </div>
      </>
    );
  }

  function renderLocation() {
    return (
      <>
        <div className="section-card">
          <div className="section-card__title">
            <h3>Cities you would consider</h3>
            <span className="tiny muted">{profile.preferences.cities.length} selected</span>
          </div>
          <p className="section-card__desc">
            Some city programs only apply inside that city. Leave this blank to consider all of
            Orange County.
          </p>
          <div className="wizard__actions" style={{ borderTop: 0, paddingTop: 0, marginTop: 0 }}>
            <button
              type="button"
              className="btn btn--small"
              onClick={() => updatePreferences({ cities: [...OC_CITIES] })}
            >
              Select all 34 cities
            </button>
            <button
              type="button"
              className="btn btn--small"
              onClick={() => updatePreferences({ cities: [] })}
            >
              Clear
            </button>
          </div>
          <div style={{ marginTop: 18 }}>
            <MultiChoiceField
              label="Orange County cities"
              options={CITY_OPTIONS}
              values={profile.preferences.cities}
              onChange={(values) => updatePreferences({ cities: values })}
              columns={3}
              hint="Choosing cities narrows the sample homes. It does not change the income limits."
            />
          </div>
          <YesNoField
            label="Are you flexible about location?"
            optional
            value={profile.preferences.flexibleLocation}
            onChange={(value) => updatePreferences({ flexibleLocation: value })}
            why="If you are flexible, we still show homes outside your cities when they fit your budget."
          />
        </div>

        <div className="section-card">
          <h3>Commute and setting</h3>
          <p className="section-card__desc">
            Commute information is a preference, never a ranking factor for neighborhoods. We do
            not use it to steer anyone toward or away from a community.
          </p>
          <div className="field-grid">
            <NumberField
              label="Maximum commute"
              optional
              value={profile.preferences.maxCommuteMinutes}
              onChange={(value) => updatePreferences({ maxCommuteMinutes: value })}
              suffix="minutes"
              max={240}
            />
            <SelectField
              label="Where you work"
              optional
              options={CITY_OPTIONS}
              value={profile.preferences.workplaceCity}
              onChange={(value) => updatePreferences({ workplaceCity: value })}
              placeholder="Choose a city"
            />
            <SelectField
              label="School you or a family member attend"
              optional
              options={CITY_OPTIONS}
              value={profile.preferences.schoolCity}
              onChange={(value) => updatePreferences({ schoolCity: value })}
              placeholder="Choose a city"
            />
            <SelectField
              label="How important is public transit?"
              optional
              options={TRANSIT_OPTIONS}
              value={profile.preferences.transitImportance?.toString()}
              onChange={(value) =>
                updatePreferences({ transitImportance: value ? Number(value) : undefined })
              }
            />
          </div>
          <ChoiceField
            label="Setting"
            options={SETTING_OPTIONS}
            value={profile.preferences.setting}
            onChange={(value) => updatePreferences({ setting: value })}
            columns={2}
          />
        </div>
      </>
    );
  }

  function renderAssistance() {
    return (
      <>
        <div className="notice">
          <p>
            Everything on this page is optional. These questions exist because specific programs
            need them. None of it is used to rank neighborhoods, and we do not collect race,
            religion, national origin, sex, familial status or disability for steering.
          </p>
        </div>

        <div className="section-card">
          <h3>Military service</h3>
          <p className="section-card__desc">
            Military-related programs do not share one eligibility rule. VA loans, state programs
            and local assistance each define service differently.
          </p>
          <ChoiceField
            label="Military status"
            optional
            options={MILITARY_OPTIONS}
            value={profile.military.status}
            onChange={(value) => updateMilitary({ status: value })}
            columns={2}
          />
          <div className="field-grid">
            <YesNoField
              label="Currently serving?"
              optional
              value={profile.military.currentlyServing}
              onChange={(value) => updateMilitary({ currentlyServing: value })}
            />
            <SelectField
              label="Do you have VA loan entitlement?"
              optional
              options={VA_OPTIONS}
              value={profile.military.vaLoanEntitlement}
              onChange={(value) => updateMilitary({ vaLoanEntitlement: value })}
              why="Entitlement affects what a lender can offer. We do not assume you have it, and we do not estimate a VA loan amount."
            />
          </div>
          <YesNoField
            label="Prefer not to answer military questions"
            optional
            value={profile.military.preferNotToSay}
            onChange={(value) => updateMilitary({ preferNotToSay: value })}
            yesLabel="Prefer not to say"
            noLabel="I am comfortable answering"
            unsure={false}
          />
        </div>

        <div className="section-card">
          <h3>Assistance history</h3>
          <div className="field-grid">
            <YesNoField
              label="Are you a first-generation homebuyer?"
              optional
              value={profile.assistance.firstGenerationHomebuyer}
              onChange={(value) => updateAssistance({ firstGenerationHomebuyer: value })}
              why="Some programs, including CalHFA's Dream For All as described on its page, are limited to first-generation homebuyers. This is optional."
            />
            <YesNoField
              label="Have you received housing assistance before?"
              optional
              value={profile.assistance.previouslyReceivedHousingAssistance}
              onChange={(value) => updateAssistance({ previouslyReceivedHousingAssistance: value })}
            />
            <YesNoField
              label="Have you participated in an affordable housing program?"
              optional
              value={profile.assistance.participatedInAffordableHousing}
              onChange={(value) => updateAssistance({ participatedInAffordableHousing: value })}
            />
            <YesNoField
              label="Is the home in a targeted geographic area?"
              optional
              value={profile.assistance.targetedGeographicArea}
              onChange={(value) => updateAssistance({ targetedGeographicArea: value })}
              why="A few programs require a targeted area. We do not know your home's status, so this is only what you report."
            />
          </div>
        </div>

        <div className="section-card">
          <h3>Employer housing benefit</h3>
          <p className="section-card__desc">
            No verified public list of Orange County employer programs was found. If you have one,
            it is recorded as user-reported, with repayment and tax questions to confirm.
          </p>
          <YesNoField
            label="Does an employer offer a housing benefit?"
            optional
            value={profile.assistance.employerBenefitAvailable}
            onChange={(value) => updateAssistance({ employerBenefitAvailable: value })}
          />
          {profile.assistance.employerBenefitAvailable ? (
            <div className="field-grid">
              <SelectField
                label="What kind?"
                options={BENEFIT_KIND_OPTIONS}
                value={profile.assistance.employerBenefitKind}
                onChange={(value) => updateAssistance({ employerBenefitKind: value })}
              />
              <MoneyField
                label="Amount you were told"
                optional
                value={profile.assistance.employerBenefitAmount}
                onChange={(value) => updateAssistance({ employerBenefitAmount: value })}
                hint="Leave blank if you do not know. We will not invent one."
              />
            </div>
          ) : null}
          {profile.assistance.employerBenefitAvailable ? (
            <TextAreaField
              label="Anything else about the benefit?"
              optional
              value={profile.assistance.employerBenefitNotes}
              onChange={(value) => updateAssistance({ employerBenefitNotes: value })}
              placeholder="For example: forgiven after five years, or repaid if I leave."
            />
          ) : null}
        </div>

        <div className="section-card">
          <h3>Institution or community program</h3>
          <div className="field-grid">
            <YesNoField
              label="Does a school or institution offer a housing benefit?"
              optional
              value={profile.assistance.institutionalBenefitAvailable}
              onChange={(value) => updateAssistance({ institutionalBenefitAvailable: value })}
              why="Some universities run employer-based homeownership programs. CalHFA's program index mentions one such partnership; we do not assume a general benefit exists."
            />
            <YesNoField
              label="Are you working with a nonprofit or community program?"
              optional
              value={profile.assistance.communityProgramNotes ? true : undefined}
              onChange={(value) =>
                updateAssistance({ communityProgramNotes: value ? "" : undefined })
              }
              why="A housing counselor or nonprofit may know about local funds that are not published. We do not invent them."
            />
          </div>
          <TextAreaField
            label="Institution benefit details"
            optional
            value={profile.assistance.institutionalBenefitNotes}
            onChange={(value) => updateAssistance({ institutionalBenefitNotes: value })}
            placeholder="What is offered, and who administers it?"
          />
          <TextAreaField
            label="Community program details"
            optional
            value={profile.assistance.communityProgramNotes}
            onChange={(value) => updateAssistance({ communityProgramNotes: value })}
            placeholder="For example: a counselor mentioned a local down payment fund. No names or personal details."
          />
        </div>

        <div className="section-card card--soft">
          <h3>Before you see matches</h3>
          <p className="section-card__desc">
            {completeness.missing.length === 0
              ? "The required fields are answered. Add any optional detail that applies to sharpen the matches."
              : `${completeness.missing.length} required answer${completeness.missing.length === 1 ? " is" : "s are"} still missing. You can continue and come back; incomplete answers become open questions, not guesses.`}
          </p>
          <div className="progress" aria-hidden="true">
            <div className="progress__bar" style={{ width: `${completeness.percent}%` }} />
          </div>
          <p className="small muted" style={{ marginTop: 10 }}>
            Profile completeness: {completeness.percent}%
          </p>
          {completeness.missing.length > 0 ? (
            <ul className="reason-list">
              {completeness.missing.map((item) => (
                <li key={item.label}>
                  {item.label}{" "}
                  <button
                    type="button"
                    className="btn btn--quiet btn--small"
                    onClick={() => goTo(item.step)}
                  >
                    Fix
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </>
    );
  }

  return (
    <div className="container">
      <div className="wizard">
        <aside className="wizard__rail" aria-label="Onboarding steps">
          <span className="wizard__stepcount">Step {step} of 7</span>
          <div className="progress" aria-hidden="true">
            <div className="progress__bar" style={{ width: `${(step / 7) * 100}%` }} />
          </div>
          <ol className="rail-list">
            {STEPS.map((entry) => {
              const done = profile.completedSteps.includes(entry.index);
              return (
                <li key={entry.key}>
                  <button
                    type="button"
                    className={`rail-step${step === entry.index ? " rail-step--active" : ""}${
                      done ? " rail-step--done" : ""
                    }`}
                    onClick={() => goTo(entry.index)}
                    aria-current={step === entry.index ? "step" : undefined}
                  >
                    <span className="rail-step__num">{done ? "✓" : entry.index}</span>
                    <span>{entry.short}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="tiny muted" style={{ marginTop: 16 }}>
            {completeness.percent}% complete
          </p>
        </aside>

        <div className="wizard__main">
          <div className="wizard__head">
            <span className="wizard__stepcount">Part {step} of 7</span>
            <h2>{meta.title}</h2>
            <p className="lede" style={{ fontSize: "1rem" }}>
              {meta.blurb}
            </p>
          </div>

          <div className="progress" aria-hidden="true" style={{ marginBottom: 22 }}>
            <div className="progress__bar" style={{ width: `${(step / 7) * 100}%` }} />
          </div>

          {step === 1 ? renderFinancial() : null}
          {step === 2 ? renderHousehold() : null}
          {step === 3 ? renderEmployment() : null}
          {step === 4 ? renderHousing() : null}
          {step === 5 ? renderProperty() : null}
          {step === 6 ? renderLocation() : null}
          {step === 7 ? renderAssistance() : null}

          <div className="wizard__actions">
            {step > 1 ? (
              <button type="button" className="btn" onClick={() => goTo(step - 1)} disabled={saving}>
                Back
              </button>
            ) : null}
            <Link href="/profile" className="btn btn--ghost" onClick={() => void persist(profile, step)}>
              Save and exit
            </Link>
            <span className="spacer" />
            <span
              className={`wizard__status${error ? " wizard__status--error" : ""}`}
              role="status"
              aria-live="polite"
            >
              {error ?? (saving ? "Saving…" : savedAt ? `Saved ${savedAt}` : "")}
            </span>
            {step < 7 ? (
              <>
                {step >= 3 ? (
                  <button
                    type="button"
                    className="btn btn--quiet"
                    onClick={() => goTo(step + 1)}
                    disabled={saving}
                  >
                    Skip for now
                  </button>
                ) : null}
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => goTo(step + 1)}
                  disabled={saving}
                >
                  Continue
                </button>
              </>
            ) : (
              <button type="button" className="btn btn--primary" onClick={finish} disabled={saving}>
                See my matches
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * A text input with an explicit optional flag. Kept local because the wizard uses
 * it for free-text occupation fields where a label association matters.
 */
function WeatherFreeText({
  label,
  value,
  onChange,
  placeholder,
  optional,
}: {
  label: string;
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  optional?: boolean;
}) {
  return (
    <TextField
      label={label}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      optional={optional}
    />
  );
}
