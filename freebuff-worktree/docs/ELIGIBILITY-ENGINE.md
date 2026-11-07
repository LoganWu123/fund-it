# How the eligibility engine works

This is the technical companion to the prototype. It covers the data model, the rule types, how a
verdict is reached, and what the engine deliberately refuses to do.

The short version: **every program is a list of independent tests, and a test that cannot be
evaluated returns `unknown`.** There is no universal definition of household, income or first-time
buyer anywhere in the code.

## Files

| File | Purpose |
|---|---|
| `lib/profile/types.ts` | The profile model, including optional and sensitive attributes |
| `lib/profile/defaults.ts` | Empty profile, and normalization of untrusted input |
| `lib/profile/completeness.ts` | Required vs optional fields, and what is missing |
| `lib/eligibility/types.ts` | Program, requirement and match types |
| `lib/eligibility/programs.ts` | The 17-program catalog, each with sources and a verification status |
| `lib/eligibility/engine.ts` | Context building, requirement evaluation, verdicts, benefit estimates |
| `lib/data/ami.ts` | HCD 2026 Orange County median income and percentage helpers |
| `lib/affordability.ts` | P&I, taxes, insurance, HOA, monthly budget, maximum price |
| `lib/recommend.ts` | Property ranking and per-home assistance application |
| `lib/db.ts` | SQLite schema and relational load/save |

## Data model

The profile is stored in relational tables rather than one JSON blob:

| Table | Contents |
|---|---|
| `profiles` | Session id, timestamps, onboarding step, completed steps |
| `financial_profiles` | Income fallback, savings, down payment, closing funds, debts, payment targets, credit range |
| `households` | Marital status, adults, dependents, children, purchase type, co-applicant, multiple earners, single parent |
| `household_members` | Role, mortgage-applicant flag, relationship, age range |
| `household_income_sources` | Member, type, annual amount, gross/net, recurring |
| `employment_profiles` | Status, occupation, category, industry, employer type, years, income |
| `educational_profiles` | Enrollment, institution type, loans, institutional housing benefit |
| `homeownership_history` | Current housing, prior ownership, lookback years, prior assistance |
| `military_profiles` | Service status, VA entitlement, preference not to say |
| `housing_preferences` | Property types, size, HOA, accessibility, arrangement, cities, commute |
| `assistance_eligibility_attributes` | First-generation status, prior assistance, targeted area, employer and institution benefits |

Members and applicants are separate. A spouse can be a household member without being on the
mortgage, and the engine reads the applicant list only where a program's rule is about borrowers.

### Sensitive attributes

Marital status, single-parent status, military service and assistance history live in their own
tables. The profile editor reads them so the user can correct them. The matching route reads them
only to evaluate a program's stated rule, and its response contains the reason or open question,
never the raw value.

This is a **data-model control, not authentication**. The prototype has no accounts; the anonymous
session cookie only separates demo profiles in one browser. A production version would need real
authorization, audit logging and per-field consent.

## Requirement types

Each program lists `requirements`, and each requirement is evaluated on its own:

| Kind | What it tests |
|---|---|
| `income_max_ami` | Household or borrower income against a percentage of Orange County AMI, by household size |
| `income_max` | A fixed dollar limit, only when a source states it |
| `household_size_min` / `max` | Household size |
| `first_time_buyer` | Prior ownership, with an optional program lookback |
| `primary_residence` | Owner occupancy |
| `occupation_in` | Occupation category (teacher, healthcare, public sector, first responder, etc.) |
| `employment_status_in` | Full-time, self-employed, student, retired, etc. |
| `military_status_in` | Active duty, veteran, Guard/Reserve, surviving spouse |
| `student_status_in` | Enrolled, recent graduate, not enrolled |
| `current_housing_in` | Renting, with family, owns, temporary |
| `purchase_price_max` | The home's price |
| `property_type_in` | Condo, single-family, duplex, manufactured, etc. |
| `jurisdiction_in` | A city or list of cities |
| `marital_status_in` | Only where a program explicitly has such a rule |
| `co_applicant_required` | Whether a co-applicant is required |
| `dependent_min` | Minimum dependents |
| `first_generation_homebuyer` | First-generation status |
| `employer_benefit` | A reported employer benefit |
| `institutional_benefit` | A reported institution benefit |
| `targeted_area` | A reported targeted geographic area |
| `manual_review` | A required process step (lender, education, voucher, drawing). Shown as an action, not an eligibility test. |
| `unknown` | A rule the catalog knows exists but cannot evaluate |

### Verdicts

- **likely** — every eligibility requirement returned `pass`. Required process steps may remain;
  they are listed as next steps. This still is not an approval.
- **possible** — no requirement failed, but at least one eligibility test returned `unknown`. The
  unknown reason is shown as a question.
- **unlikely** — at least one requirement failed, and the failing rule is shown.

`manual_review` returns `action`, not `unknown`. A requirement that the buyer must apply through a
lender, complete homebuyer education, or enter a voucher drawing says nothing about whether they
qualify, so it must not turn a passing program into an uncertain one. Actions are displayed under
"Next step" and included in the JSON API as `nextSteps`.

`unknown` is a first-class outcome. A missing optional answer never becomes a silent "no", and an
unloaded income table never becomes an invented threshold.

### Benefit estimates

| Rule | Behavior |
|---|---|
| `percent_of_price` | Amount = percentage × price, capped if the source states a cap |
| `percent_range_of_price` | A range, e.g. CalHFA MyHome's 3% conventional to 3.5% FHA |
| `fixed` | A stated dollar amount |
| `user_reported` | The amount the buyer entered, labeled as unverified |
| `unknown` | No amount; the program still appears as an open question |

Programs that fund a developer or sponsor are marked `appliesTo: "project"` and excluded from the
household assistance totals.

## Income and AMI

`lib/data/ami.ts` holds the Orange County median-income row from HCD's **2026 State Income Limits,
revised June 23, 2026**:

| Household size | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| Median income | $97,000 | $110,900 | $124,750 | $138,600 | $149,700 | $160,800 | $171,850 | $182,950 |

The row is internally consistent with HCD's published household-size adjustments (70%, 80%, 90%,
100%, 108%, 116%, 124%, 132%, rounded). Above eight people the code uses HCD's published formula.
A percentage test rounds the limit to the nearest $50.

The separate "very low" and "low" category rows, the State HOME table and HUD's limits are **not**
used. A program that relies on one of them is marked with `percent: null` and produces an open
question. This keeps every displayed dollar figure traceable to a row that was actually read.

Household income sums recurring income sources. If a source is entered as net income, the UI warns
that most programs test gross income and the comparison may read low. Nonrecurring income is
excluded. If no sources exist, the single fallback income field is used.

### CalHFA's flat county limits

CalHFA publishes a separate 2026 table that is **not adjusted for household size**:

| Program | Orange County limit | Effective | Source |
|---|---|---|---|
| All CalHFA first and subordinate mortgages (including MyHome and ZIP) | $274,000 | June 30, 2026 | [income.pdf](https://www.calhfa.ca.gov/homeownership/limits/income/income.pdf) |
| Dream For All shared appreciation | $219,000 | June 30, 2026 | [income-cadfa.pdf](https://www.calhfa.ca.gov/homeownership/limits/income/income-cadfa.pdf) |

These are encoded as `income_max` requirements, not `income_max_ami`, because the published limit is
a flat dollar figure. The MyHome test uses borrower income, matching CalHFA's "income of all
borrowers" language; Dream For All uses combined household income, matching its program page.

## Affordability

Monthly budget = the smallest of:

1. 35% of gross monthly income;
2. 45% of gross monthly income minus existing monthly debts;
3. the buyer's own maximum comfortable payment (or desired payment).

The maximum price is found by bisection: the highest price whose principal and interest, property
tax, insurance and HOA fit under that budget after the down payment and any assistance that passed
every check. All assumptions are displayed on the results page with their label (`SOURCE` or
`ASSUMPTION`) and source link.

## Adding a program

Add one object to `lib/eligibility/programs.ts`:

```ts
{
  id: "example-program",
  name: "Example down payment assistance",
  administrator: "Example agency",
  level: "city",
  category: "city",
  summary: "What the source actually says.",
  assistanceType: "loan",
  repayment: "What the source says about repayment.",
  combinable: "unknown",
  appliesTo: "household",
  availability: "unknown",
  benefit: { kind: "percent_of_price", percent: 5, note: "Source-stated percentage." },
  requirements: [
    { kind: "primary_residence" },
    { kind: "jurisdiction_in", cities: ["Santa Ana"] },
    { kind: "income_max_ami", percent: 80 },
  ],
  openQuestions: ["Is funding available?"],
  sources: [{ label: "Program page", url: "https://…", checkedOn: "2026-11-07" }],
  verification: "partial",
  lastChecked: "2026-11-07",
}
```

No engine change is needed. If a rule type is missing, add it to the union in
`lib/eligibility/types.ts` and handle it in `evaluateRequirement`; the switch is exhaustive, so the
compiler will point at the gap.

## Known gaps

- Several catalog entries (city programs, ZIP amount, MCC, VA terms, WISH) confirm existence, not
  current terms. Their verdicts are honest but thin.
- The catalog has no verified property-level incentive, so that category shows a count of zero.
- There is no listings feed; recommendations run on a clearly labeled synthetic file.
- The affordability model is not underwriting: no credit, reserves, mortgage insurance, lender
  overlays or local tax detail.
- There is no authentication and no production authorization boundary.
- No program application can be filed, by design.
