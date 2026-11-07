import Link from "next/link";
import { redirect } from "next/navigation";
import { loadProfile } from "@/lib/db";
import { readSessionId } from "@/lib/session";
import { computeCompleteness, totalAnnualIncome } from "@/lib/profile/completeness";
import { labelOf } from "@/lib/profile/options";
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
  MILITARY_OPTIONS,
  OCCUPATION_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  PARKING_OPTIONS,
} from "@/lib/profile/options";
import { money, shortDate } from "@/lib/format";
import ResetProfileButton from "@/components/ResetProfileButton";

export const dynamic = "force-dynamic";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="review-row">
      <span className="review-row__label">{label}</span>
      <span className="review-row__value">{value}</span>
    </div>
  );
}

function valueOr(value: string | number | undefined | null, suffix = ""): string {
  if (value === undefined || value === null || value === "") return "Not answered";
  return `${value}${suffix}`;
}

function boolLabel(value: boolean | undefined): string {
  if (value === undefined) return "Not answered";
  return value ? "Yes" : "No";
}

export default async function ProfilePage() {
  const sessionId = await readSessionId();
  if (!sessionId) redirect("/onboarding");
  const profile = loadProfile(sessionId);
  if (!profile) redirect("/onboarding");

  const completeness = computeCompleteness(profile);
  const applicants = profile.household.members.filter((member) => member.isMortgageApplicant);
  const education = profile.education[0];
  const incomeTotal = totalAnnualIncome(profile);

  return (
    <div className="container">
      <div className="page-head">
        <span className="eyebrow">Your profile</span>
        <h1 style={{ fontSize: "clamp(1.9rem, 3.4vw, 2.7rem)" }}>What the engine knows</h1>
        <p className="lede">
          This is the complete profile used for matching, including the optional answers. You can
          correct anything, skip what you do not want to share, and see exactly which fields are
          still incomplete.
        </p>
        <div className="pills" style={{ marginTop: 14 }}>
          <span className="pill">Profile created {shortDate(profile.createdAt)}</span>
          <span className="pill">Last saved {shortDate(profile.updatedAt)}</span>
          <span className="pill">{completeness.percent}% complete</span>
        </div>
        <div className="progress" style={{ maxWidth: 420 }}>
          <div className="progress__bar" style={{ width: `${completeness.percent}%` }} />
        </div>
      </div>

      {completeness.missing.length > 0 || completeness.optionalMissing.length > 0 ? (
        <div className="grid grid--2" style={{ marginBottom: 28 }}>
          <div className="card">
            <h3>Required answers still missing</h3>
            {completeness.missing.length === 0 ? (
              <p className="small muted">None. Every required field is answered.</p>
            ) : (
              <ul className="reason-list">
                {completeness.missing.map((item) => (
                  <li key={item.label}>
                    {item.label}{" "}
                    <Link href={`/onboarding?step=${item.step}`} className="edit-link">
                      Fix
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="card card--soft">
            <h3>Optional answers that sharpen matches</h3>
            {completeness.optionalMissing.length === 0 ? (
              <p className="small muted">All optional questions are answered.</p>
            ) : (
              <ul className="reason-list">
                {completeness.optionalMissing.slice(0, 6).map((item) => (
                  <li key={item.label}>
                    {item.label}{" "}
                    <Link href={`/onboarding?step=${item.step}`} className="edit-link">
                      Add
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      <div className="review-section">
        <div className="review-section__head">
          <h3>Money</h3>
          <Link href="/onboarding?step=1" className="edit-link">
            Edit
          </Link>
        </div>
        <div className="review-list">
          <Row label="Household income (recurring)" value={money(incomeTotal)} />
          <Row
            label="Income sources"
            value={
              profile.incomeSources.length === 0
                ? "No itemized sources"
                : profile.incomeSources
                    .map(
                      (source) =>
                        `${labelOf(INCOME_SOURCE_OPTIONS, source.type)}: ${money(source.annualAmount)} ${
                          source.basis === "gross" ? "gross" : "net"
                        }${source.recurring ? "" : " (nonrecurring)"}`,
                    )
                    .join(" · ")
            }
          />
          <Row label="Savings" value={profile.financial.savings !== undefined ? money(profile.financial.savings) : "Not answered"} />
          <Row
            label="Down payment available"
            value={
              profile.financial.downPaymentAvailable !== undefined
                ? money(profile.financial.downPaymentAvailable)
                : "Not answered (assumed $0)"
            }
          />
          <Row label="Closing-cost funds" value={profile.financial.closingCostFunds !== undefined ? money(profile.financial.closingCostFunds) : "Not answered"} />
          <Row label="Monthly debts" value={profile.financial.monthlyDebts !== undefined ? money(profile.financial.monthlyDebts) : "Not answered"} />
          <Row label="Monthly rent now" value={profile.financial.monthlyRent !== undefined ? money(profile.financial.monthlyRent) : "Not answered"} />
          <Row label="Desired monthly payment" value={profile.financial.desiredMonthlyPayment !== undefined ? money(profile.financial.desiredMonthlyPayment) : "Not answered"} />
          <Row
            label="Maximum comfortable payment"
            value={
              profile.financial.maxComfortableHousingPayment !== undefined
                ? money(profile.financial.maxComfortableHousingPayment)
                : "Not answered"
            }
          />
          <Row label="Maximum purchase budget" value={profile.financial.maxPurchaseBudget !== undefined ? money(profile.financial.maxPurchaseBudget) : "Not answered"} />
          <Row label="Credit score range" value={profile.financial.creditScoreRange ? labelOf(CREDIT_RANGE_OPTIONS, profile.financial.creditScoreRange) : "Not answered"} />
        </div>
      </div>

      <div className="review-section">
        <div className="review-section__head">
          <h3>Household</h3>
          <Link href="/onboarding?step=2" className="edit-link">
            Edit
          </Link>
        </div>
        <div className="review-list">
          <Row label="Marital status" value={profile.household.maritalStatus ? labelOf(MARITAL_STATUS_OPTIONS, profile.household.maritalStatus) : "Not answered"} />
          <Row label="Adults" value={valueOr(profile.household.adultsCount)} />
          <Row label="Dependents" value={valueOr(profile.household.dependentsCount)} />
          <Row label="Children" value={valueOr(profile.household.childrenCount)} />
          <Row label="Buying" value={profile.household.purchaseType === "joint" ? "Jointly" : profile.household.purchaseType === "individual" ? "Alone" : "Not answered"} />
          <Row label="Spouse or partner co-applicant" value={boolLabel(profile.household.spouseCoApplicant)} />
          <Row label="Multiple earners" value={boolLabel(profile.household.multipleEarners)} />
          <Row label="Single parent (voluntary)" value={boolLabel(profile.household.singleParent)} />
          <Row
            label="Household members"
            value={
              profile.household.members.length === 0
                ? "None listed"
                : profile.household.members
                    .map(
                      (member) =>
                        `${member.role.replace(/_/g, " ")}${member.isMortgageApplicant ? " (on the loan)" : ""}`,
                    )
                    .join(" · ")
            }
          />
          <Row label="Mortgage applicants" value={`${applicants.length}`} />
        </div>
      </div>

      <div className="review-section">
        <div className="review-section__head">
          <h3>Work and school</h3>
          <Link href="/onboarding?step=3" className="edit-link">
            Edit
          </Link>
        </div>
        <div className="review-list">
          {profile.employment.length === 0 ? (
            <Row label="Employment" value="Not answered" />
          ) : (
            profile.employment.map((entry, index) => (
              <Row
                key={`${entry.memberId}-${index}`}
                label={`Employment ${index + 1}`}
                value={[
                  entry.status ? labelOf(EMPLOYMENT_STATUS_OPTIONS, entry.status) : null,
                  entry.occupationTitle,
                  entry.occupationCategory ? labelOf(OCCUPATION_OPTIONS, entry.occupationCategory) : null,
                  entry.employerType ? labelOf(EMPLOYER_TYPE_OPTIONS, entry.employerType) : null,
                  entry.yearsEmployed !== undefined ? `${entry.yearsEmployed} years` : null,
                  entry.annualEmploymentIncome !== undefined ? money(entry.annualEmploymentIncome) : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || "Not answered"}
              />
            ))
          )}
          <Row
            label="Student status"
            value={
              education === undefined
                ? "Not answered"
                : [
                    boolLabel(education.isEnrolled),
                    education.institutionType ? labelOf(INSTITUTION_OPTIONS, education.institutionType) : null,
                    education.enrollmentStatus ? labelOf(ENROLLMENT_OPTIONS, education.enrollmentStatus) : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")
            }
          />
          <Row
            label="Student loans"
            value={
              education?.studentLoanBalance !== undefined
                ? `${money(education.studentLoanBalance)} balance; ${money(education.monthlyStudentLoanPayment ?? 0)} monthly`
                : "Not answered"
            }
          />
          <Row label="Institutional housing benefit" value={boolLabel(education?.institutionalHousingBenefit)} />
        </div>
      </div>

      <div className="review-section">
        <div className="review-section__head">
          <h3>Housing now</h3>
          <Link href="/onboarding?step=4" className="edit-link">
            Edit
          </Link>
        </div>
        <div className="review-list">
          <Row
            label="Current situation"
            value={
              profile.homeownership.currentHousing
                ? labelOf(CURRENT_HOUSING_OPTIONS, profile.homeownership.currentHousing)
                : "Not answered"
            }
          />
          <Row label="Years at this address" value={valueOr(profile.homeownership.yearsAtResidence)} />
          <Row label="Monthly rent" value={profile.homeownership.monthlyRent !== undefined ? money(profile.homeownership.monthlyRent) : "Not answered"} />
          <Row label="Owned a home before" value={boolLabel(profile.homeownership.previouslyOwnedHome)} />
          <Row label="Sold a previous home" value={boolLabel(profile.homeownership.soldPreviousHome)} />
          <Row label="Years since last owned" value={valueOr(profile.homeownership.yearsSinceLastOwned)} />
          <Row label="First primary residence" value={boolLabel(profile.homeownership.firstPrimaryResidence)} />
          <Row label="Owns other property" value={boolLabel(profile.homeownership.ownsOtherProperty)} />
          <Row label="Previously received assistance" value={boolLabel(profile.homeownership.previouslyReceivedAssistance)} />
        </div>
      </div>

      <div className="review-section">
        <div className="review-section__head">
          <h3>Property preferences</h3>
          <Link href="/onboarding?step=5" className="edit-link">
            Edit
          </Link>
        </div>
        <div className="review-list">
          <Row
            label="Property types"
            value={
              profile.preferences.propertyTypes.length === 0
                ? "No preference"
                : profile.preferences.propertyTypes.map((type) => labelOf(PROPERTY_TYPE_OPTIONS, type)).join(", ")
            }
          />
          <Row
            label="Minimum size"
            value={[
              profile.preferences.minBeds !== undefined ? `${profile.preferences.minBeds} bed` : null,
              profile.preferences.minBaths !== undefined ? `${profile.preferences.minBaths} bath` : null,
              profile.preferences.minSqft !== undefined ? `${profile.preferences.minSqft} sq ft` : null,
            ]
              .filter(Boolean)
              .join(" · ") || "Not answered"}
          />
          <Row label="Maximum HOA" value={profile.preferences.maxHoa !== undefined ? `${money(profile.preferences.maxHoa)}/mo` : "Not answered"} />
          <Row label="Parking" value={profile.preferences.parking ? labelOf(PARKING_OPTIONS, profile.preferences.parking) : "Not answered"} />
          <Row label="Garage" value={boolLabel(profile.preferences.garage)} />
          <Row label="Yard" value={boolLabel(profile.preferences.yard)} />
          <Row
            label="Accessibility"
            value={
              profile.preferences.accessibilityFeatures?.length
                ? profile.preferences.accessibilityFeatures
                    .map((feature) => labelOf(ACCESSIBILITY_OPTIONS, feature))
                    .join(", ")
                : "Not answered"
            }
          />
          <Row label="Condition" value={valueOr(profile.preferences.condition)} />
          <Row
            label="Housing arrangement"
            value={
              profile.preferences.arrangement
                ? labelOf(ARRANGEMENT_OPTIONS, profile.preferences.arrangement)
                : "Not answered"
            }
          />
        </div>
      </div>

      <div className="review-section">
        <div className="review-section__head">
          <h3>Location</h3>
          <Link href="/onboarding?step=6" className="edit-link">
            Edit
          </Link>
        </div>
        <div className="review-list">
          <Row
            label="Cities"
            value={
              profile.preferences.cities.length === 0
                ? "Anywhere in Orange County"
                : profile.preferences.cities.join(", ")
            }
          />
          <Row label="Maximum commute" value={profile.preferences.maxCommuteMinutes !== undefined ? `${profile.preferences.maxCommuteMinutes} minutes` : "Not answered"} />
          <Row label="Workplace city" value={valueOr(profile.preferences.workplaceCity)} />
          <Row label="School city" value={valueOr(profile.preferences.schoolCity)} />
          <Row label="Transit importance" value={profile.preferences.transitImportance !== undefined ? `${profile.preferences.transitImportance} of 5` : "Not answered"} />
          <Row label="Setting" value={valueOr(profile.preferences.setting)} />
          <Row label="Flexible about location" value={boolLabel(profile.preferences.flexibleLocation)} />
        </div>
      </div>

      <div className="review-section">
        <div className="review-section__head">
          <h3>Assistance eligibility and military service</h3>
          <Link href="/onboarding?step=7" className="edit-link">
            Edit
          </Link>
        </div>
        <div className="review-list">
          <Row label="Military status" value={profile.military.status ? labelOf(MILITARY_OPTIONS, profile.military.status) : "Not answered"} />
          <Row label="Currently serving" value={boolLabel(profile.military.currentlyServing)} />
          <Row label="VA entitlement" value={valueOr(profile.military.vaLoanEntitlement)} />
          <Row label="First-generation homebuyer" value={boolLabel(profile.assistance.firstGenerationHomebuyer)} />
          <Row label="Previously received housing assistance" value={boolLabel(profile.assistance.previouslyReceivedHousingAssistance)} />
          <Row label="Participated in affordable housing" value={boolLabel(profile.assistance.participatedInAffordableHousing)} />
          <Row label="Targeted geographic area" value={boolLabel(profile.assistance.targetedGeographicArea)} />
          <Row label="Employer benefit" value={boolLabel(profile.assistance.employerBenefitAvailable)} />
          <Row
            label="Employer benefit amount"
            value={
              profile.assistance.employerBenefitAmount !== undefined
                ? money(profile.assistance.employerBenefitAmount)
                : "Not reported"
            }
          />
          <Row label="Institutional benefit" value={boolLabel(profile.assistance.institutionalBenefitAvailable)} />
          <Row label="Community program notes" value={valueOr(profile.assistance.communityProgramNotes)} />
        </div>
      </div>

      <div className="notice">
        <p>
          <strong>How sensitive answers are handled.</strong> Marital status, single-parent status,
          military service and the assistance-history answers are stored in separate tables from the
          rest of the profile. The matching service reads them only to test a program's stated rule,
          and the matching output returns a reason or an open question, not the raw value. This
          prototype has no accounts or login, so that separation is a data-model control, not
          production-grade authorization. Do not enter real personal information.
        </p>
      </div>

      <div className="wizard__actions" style={{ marginBottom: 48 }}>
        <Link href="/onboarding" className="btn btn--primary">
          Continue editing
        </Link>
        <Link href="/results" className="btn">
          See matches
        </Link>
        <span className="spacer" />
        <ResetProfileButton />
      </div>
    </div>
  );
}
