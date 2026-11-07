/**
 * Assistance program catalog.
 *
 * Rules of this file:
 * - A number appears only when a source states it. Everything else is `null` or
 *   `unknown`, which the engine turns into an open question.
 * - Every program carries its source, the date it was checked, and a verification
 *   status. "verified" means the terms shown were read on the source.
 * - When sources disagree, the disagreement is kept in `openQuestions` instead of
 *   being resolved silently.
 *
 * Nothing here is legal, financial or lending advice.
 */
import type { AssistanceProgram } from "./types";

const CALHFA_PROGRAMS = "https://www.calhfa.ca.gov/homebuyer/programs/";
const CHECKED = "2026-11-06";

export const PROGRAMS: AssistanceProgram[] = [
  {
    id: "calhfa-myhome",
    name: "CalHFA MyHome Assistance",
    administrator: "California Housing Finance Agency (CalHFA)",
    level: "state",
    category: "state",
    summary:
      "A deferred-payment junior loan that can cover down payment and closing costs, used with a CalHFA first mortgage. The CalHFA page states up to 3.5% of price or appraised value with an FHA first loan, or 3% with a conventional first loan. CalHFA's 2026 Orange County income limit for this and its other first and subordinate mortgages is $274,000.",
    assistanceType: "deferred_loan",
    repayment:
      "Second loan. CalHFA describes its subordinate loans as silent seconds with deferred payments, repaid on sale, refinance or payoff. Confirm your specific terms.",
    combinable: "unknown",
    stackingNote:
      "CalHFA's own materials describe MyHome as combinable with ZIP. Other layers must be approved by the first lender.",
    appliesTo: "household",
    availability: "unknown",
    benefit: {
      kind: "percent_range_of_price",
      minPercent: 3,
      maxPercent: 3.5,
      note: "3.5% with an FHA first loan, 3% with a conventional first loan; the lesser of price or appraised value.",
    },
    requirements: [
      { kind: "primary_residence" },
      {
        kind: "first_time_buyer",
        note: "The MyHome page requires a first-time homebuyer. CalHFA publishes its own definition.",
      },
      {
        kind: "income_max",
        amount: 274000,
        basis: "borrower",
        note: "CalHFA's 2026 Orange County limit is $274,000 for all first and subordinate mortgages, effective June 30, 2026. It is a flat county limit, not adjusted for household size.",
      },
      {
        kind: "manual_review",
        note: "Must be originated by a CalHFA-approved lender and paired with a CalHFA first mortgage. CalHFA also requires homebuyer education counseling.",
      },
    ],
    openQuestions: [
      "Will the lender count every borrower's income the way CalHFA does?",
      "Does the 3.5% (FHA) or 3% (conventional) version apply to the first mortgage you can use?",
      "Does the first lender allow additional assistance on top of MyHome?",
    ],
    sources: [
      {
        label: "CalHFA homebuyer programs",
        url: CALHFA_PROGRAMS,
        checkedOn: CHECKED,
        note: "Page excerpt read during the event build.",
      },
      {
        label: "CalHFA MyHome program page",
        url: "https://www.calhfa.ca.gov/homebuyer/programs/myhome.htm",
        checkedOn: "2026-11-07",
        note: "Program description seen via search excerpt, not a full page fetch.",
      },
      {
        label: "CalHFA 2026 Government & Conventional Income Limits (Orange County $274,000)",
        url: "https://www.calhfa.ca.gov/homeownership/limits/income/income.pdf",
        checkedOn: "2026-11-07",
        note: "Effective June 30, 2026; a flat county limit, not size-adjusted.",
      },
      {
        label: "CalHFA lender training deck (October 2025), via California State Treasurer",
        url: "https://treasurer.ca.gov/sites/default/files/2025-10/calhfa-presentation.pdf",
        checkedOn: "2026-11-07",
        note: "Describes MyHome as first-time buyers only and combinable with ZIP.",
      },
    ],
    verification: "verified",
    lastChecked: "2026-11-07",
  },
  {
    id: "calhfa-dream-for-all",
    name: "CalHFA Dream For All Shared Appreciation Loan",
    administrator: "California Housing Finance Agency (CalHFA)",
    level: "state",
    category: "state",
    summary:
      "Down payment and closing cost assistance for first-generation homebuyers, used with the Dream For All conventional first mortgage. The program page describes up to 20% of the purchase price, not to exceed $150,000, through a voucher and randomized drawing.",
    assistanceType: "shared_appreciation",
    repayment:
      "Shared appreciation. The borrower repays the loan plus a share of the home's appreciation. The exact share was not loaded in this build.",
    combinable: "unknown",
    stackingNote: "Availability depends on a voucher round and drawing, not on the buyer alone.",
    appliesTo: "household",
    availability: "limited",
    benefit: {
      kind: "percent_of_price",
      percent: 20,
      cap: 150000,
      note: "Up to 20% of price, not to exceed $150,000, per the program page.",
    },
    requirements: [
      { kind: "primary_residence" },
      { kind: "first_generation_homebuyer" },
      {
        kind: "first_time_buyer",
        note: "The program is described for first-generation homebuyers; confirm the first-time buyer definition used.",
      },
      {
        kind: "income_max",
        amount: 219000,
        basis: "household",
        note: "CalHFA's 2026 Dream For All Orange County limit is $219,000, effective June 30, 2026. The program page says combined household income must meet the county limit.",
      },
      {
        kind: "manual_review",
        note: "Requires a voucher registration and a randomized drawing, plus the Dream For All conventional first mortgage.",
      },
    ],
    openQuestions: [
      "Is a voucher round open right now, and is there a waitlist?",
      "Do all borrowers meet the first-time buyer definition the program uses?",
      "What appreciation share applies at repayment?",
    ],
    sources: [
      {
        label: "CalHFA Dream For All",
        url: "https://calhfa.ca.gov/dream/",
        checkedOn: CHECKED,
        note: "Page reports up to 20%, cap $150,000, voucher registration and a drawing; fund availability not confirmed.",
      },
      {
        label: "CalHFA homebuyer programs",
        url: CALHFA_PROGRAMS,
        checkedOn: "2026-11-07",
        note: "Describes Dream For All as assistance for first-generation homebuyers.",
      },
      {
        label: "CalHFA 2026 Dream For All Income Limits (Orange County $219,000)",
        url: "https://www.calhfa.ca.gov/homeownership/limits/income/income-cadfa.pdf",
        checkedOn: "2026-11-07",
        note: "Effective June 30, 2026.",
      },
    ],
    verification: "verified",
    lastChecked: "2026-11-07",
  },
  {
    id: "calhfa-zip",
    name: "CalHFA Zero Interest Program (ZIP)",
    administrator: "California Housing Finance Agency (CalHFA)",
    level: "state",
    category: "state",
    summary:
      "A zero-interest junior loan used for closing costs with certain CalHFA first mortgages. The program exists on CalHFA's program list; the current amount and terms were not loaded.",
    assistanceType: "deferred_loan",
    repayment: "Deferred junior loan. Terms not loaded in this build.",
    combinable: "unknown",
    appliesTo: "household",
    availability: "unknown",
    benefit: { kind: "unknown", note: "Amount and terms not loaded. Ask a CalHFA-approved lender." },
    requirements: [
      { kind: "primary_residence" },
      {
        kind: "income_max",
        amount: 274000,
        basis: "borrower",
        note: "ZIP is a CalHFA subordinate mortgage, so the 2026 Orange County limit of $274,000 applies, effective June 30, 2026.",
      },
      {
        kind: "manual_review",
        note: "Paired with specific CalHFA first mortgages; confirm which combination is open.",
      },
    ],
    openQuestions: ["What is the current ZIP amount and which first loans can it pair with?"],
    sources: [
      {
        label: "CalHFA homebuyer programs",
        url: CALHFA_PROGRAMS,
        checkedOn: CHECKED,
        note: "Lists ZIP for closing costs; amount not read.",
      },
    ],
    verification: "unverified",
    lastChecked: CHECKED,
  },
  {
    id: "calhfa-mcc",
    name: "CalHFA Mortgage Credit Certificate (MCC)",
    administrator: "CalHFA, with participating lenders",
    level: "state",
    category: "state",
    summary:
      "A federal tax credit for a share of mortgage interest, administered through participating lenders. The program is listed by CalHFA; current credit rate, income limits and availability were not loaded.",
    assistanceType: "tax_credit",
    repayment: "Not a loan. A tax credit claimed annually while the certificate is in effect.",
    combinable: "unknown",
    appliesTo: "household",
    availability: "unknown",
    benefit: { kind: "unknown", note: "Credit rate and limits not loaded." },
    requirements: [
      { kind: "primary_residence" },
      { kind: "first_time_buyer" },
      {
        kind: "income_max_ami",
        percent: null,
        note: "MCC income limits are set separately; not loaded in this build.",
      },
      { kind: "manual_review", note: "Issued through a participating lender." },
    ],
    openQuestions: [
      "Is the MCC currently issued in Orange County?",
      "What income and purchase price limits apply?",
    ],
    sources: [
      {
        label: "CalHFA homebuyer programs",
        url: CALHFA_PROGRAMS,
        checkedOn: CHECKED,
        note: "Lists MCC; terms not read.",
      },
    ],
    verification: "unverified",
    lastChecked: CHECKED,
  },
  {
    id: "calhfa-steap",
    name: "CalHFA School Teacher and Employee Assistance Program",
    administrator: "California Housing Finance Agency (CalHFA)",
    level: "state",
    category: "profession",
    summary:
      "A down payment assistance program described for K-12 public school teachers, administrators, classified employees and staff. Sources disagree on whether it is still open, so this prototype treats it as unconfirmed and does not estimate an amount.",
    assistanceType: "deferred_loan",
    repayment: "Junior loan as described. Terms not confirmed.",
    combinable: "unknown",
    appliesTo: "household",
    availability: "not_confirmed",
    benefit: {
      kind: "unknown",
      note: "Sources conflict: one describes up to 4% of price, another says the separate program ended in 2020. No amount is shown.",
    },
    requirements: [
      { kind: "primary_residence" },
      {
        kind: "occupation_in",
        occupations: ["teacher_educator"],
        note: "Described for teachers, administrators and K-12 public school staff.",
      },
      { kind: "first_time_buyer" },
      {
        kind: "unknown",
        note: "Program status is unconfirmed: a CalHFA 2025 lender deck describes it, while a 2026 guide says the separate program ended. Do not rely on it until CalHFA confirms.",
      },
      {
        kind: "manual_review",
        note: "Confirm directly with CalHFA that the program is open before relying on it.",
      },
    ],
    openQuestions: [
      "Is this program open for new reservations, or was it folded into MyHome?",
      "If open, what is the current assistance amount for Orange County?",
      "Does the school or district have to meet a specific criterion?",
    ],
    sources: [
      {
        label: "CalHFA lender training deck (October 2025), via California State Treasurer",
        url: "https://treasurer.ca.gov/sites/default/files/2025-10/calhfa-presentation.pdf",
        checkedOn: "2026-11-07",
        note: "Slides describe a School Teacher and Employee Assistance Program for K-12 public schools.",
      },
      {
        label: "CalHFA program handbooks index",
        url: "https://www.calhfa.ca.gov/homeownership/programs/index.htm",
        checkedOn: "2026-11-07",
        note: "Index page; program status not stated in the excerpt.",
      },
      {
        label: "Third-party 2026 guide claiming the program ended in 2020",
        url: "https://mycahomeloan.com/home-loans-for-teachers-california-2026",
        checkedOn: "2026-11-07",
        note: "Not an official source. Included because it conflicts with CalHFA's 2025 deck.",
      },
    ],
    verification: "unverified",
    lastChecked: "2026-11-07",
    jurisdictionNote: "K-12 public schools in California, per the CalHFA deck.",
  },
  {
    id: "va-home-loan",
    name: "VA-guaranteed home loan",
    administrator: "U.S. Department of Veterans Affairs, through approved lenders",
    level: "federal",
    category: "veteran",
    summary:
      "A mortgage loan guaranteed by the VA for eligible veterans, active-duty service members, National Guard and Reserve members, and some surviving spouses. CalHFA also offers a VA first mortgage product.",
    assistanceType: "loan",
    repayment: "First mortgage repaid monthly. The guaranty is not a cash grant.",
    combinable: "unknown",
    appliesTo: "household",
    availability: "unknown",
    benefit: {
      kind: "unknown",
      note: "The benefit is a loan guaranty that can reduce the down payment a lender requires. Terms depend on entitlement and lender.",
    },
    requirements: [
      { kind: "primary_residence" },
      {
        kind: "military_status_in",
        statuses: ["active_duty", "veteran", "national_guard_reserve", "surviving_spouse"],
      },
      {
        kind: "unknown",
        note: "VA entitlement, funding fee and lender terms were not loaded. A Certificate of Eligibility decides what the loan looks like.",
      },
      {
        kind: "manual_review",
        note: "Requires a Certificate of Eligibility and a VA-approved lender.",
      },
    ],
    openQuestions: [
      "Do you have a VA Certificate of Eligibility?",
      "What down payment and funding fee would the lender require in your case?",
      "Is the CalHFA VA first mortgage available with the assistance you are using?",
    ],
    sources: [
      {
        label: "VA home loans",
        url: "https://www.va.gov/housing-assistance/home-loans/",
        checkedOn: "2026-11-07",
        note: "Program existence only; detailed terms were not loaded.",
      },
      {
        label: "CalHFA VA loan program",
        url: "https://www.calhfa.ca.gov/homebuyer/programs/va.htm",
        checkedOn: "2026-11-07",
        note: "Listed among CalHFA first mortgage programs.",
      },
    ],
    verification: "unverified",
    lastChecked: "2026-11-07",
  },
  {
    id: "hcd-calhome",
    name: "CalHome",
    administrator: "California Department of Housing and Community Development (HCD)",
    level: "state",
    category: "state",
    summary:
      "State homeownership funding awarded to local agencies and nonprofits for down payment assistance, rehabilitation and self-help housing. A household applies through a participating local organization, not to HCD directly.",
    assistanceType: "loan",
    repayment: "Set by the local administrator. Terms not loaded.",
    combinable: "unknown",
    appliesTo: "household",
    availability: "unknown",
    benefit: {
      kind: "unknown",
      note: "Award amounts and local terms vary. No amount is estimated in this build.",
    },
    requirements: [
      { kind: "primary_residence" },
      {
        kind: "income_max_ami",
        percent: null,
        note: "CalHome income limits follow the program's current table, which was not loaded.",
      },
      {
        kind: "manual_review",
        note: "Must go through a participating local agency or nonprofit. Availability depends on their current award.",
      },
    ],
    openQuestions: [
      "Which Orange County agency or nonprofit currently administers CalHome down payment assistance?",
      "What income limit and loan terms does that administrator use?",
    ],
    sources: [
      {
        label: "HCD CalHome",
        url: "https://www.hcd.ca.gov/grants-and-funding/programs-active/calhome",
        checkedOn: CHECKED,
        note: "Page describes homeownership loans to local agencies and nonprofits.",
      },
    ],
    verification: "partial",
    lastChecked: CHECKED,
  },
  {
    id: "hcd-home",
    name: "HOME Investment Partnerships (state allocation)",
    administrator: "HCD, passed through local agencies",
    level: "federal",
    category: "federal",
    summary:
      "Federal HOME funds allocated by the state for affordable housing, including homebuyer assistance delivered by local partners. Income limits come from the separate State HOME table.",
    assistanceType: "loan",
    repayment: "Set by the local administrator. Terms not loaded.",
    combinable: "unknown",
    appliesTo: "household",
    availability: "unknown",
    benefit: { kind: "unknown", note: "Local terms vary; no amount estimated." },
    requirements: [
      { kind: "primary_residence" },
      {
        kind: "income_max_ami",
        percent: null,
        note: "HCD publishes a separate State HOME income table effective June 1, 2026; it was not loaded in this build.",
      },
      { kind: "manual_review", note: "Delivered by a local agency or nonprofit." },
    ],
    openQuestions: ["Which local HOME-funded homebuyer program serves this household's city?"],
    sources: [
      {
        label: "HCD HOME program",
        url: "https://www.hcd.ca.gov/grants-and-funding/programs-active/home-investment-partnerships-program",
        checkedOn: CHECKED,
      },
      {
        label: "HCD 2026 State HOME income limits",
        url: "https://www.hcd.ca.gov/sites/default/files/docs/grants-and-funding/2026-california-HOME-income-limits_0.pdf",
        checkedOn: CHECKED,
        note: "Exists and is separate from the State Income Limits; not read in this build.",
      },
    ],
    verification: "partial",
    lastChecked: CHECKED,
  },
  {
    id: "hud-cdbg",
    name: "Community Development Block Grant (entitlement city)",
    administrator: "HUD, through entitlement cities",
    level: "federal",
    category: "community",
    summary:
      "Federal funds that cities use for community development, including housing. This is project-level money: it typically funds a developer or program, not an individual buyer's down payment.",
    assistanceType: "unknown",
    repayment: "Depends on the local project. Not a household loan product in this model.",
    combinable: "unknown",
    appliesTo: "project",
    availability: "unknown",
    benefit: { kind: "unknown", note: "Project-level funding; no household benefit is estimated." },
    requirements: [
      {
        kind: "unknown",
        note: "No household-level CDBG homebuyer benefit was confirmed in this build.",
      },
      {
        kind: "manual_review",
        note: "A city housing department or nonprofit sponsor would apply. Ask whether any CDBG-funded homebuyer program exists locally.",
      },
    ],
    openQuestions: ["Does this household's city fund a homebuyer program with CDBG money?"],
    sources: [
      {
        label: "HUD Exchange CDBG Entitlement",
        url: "https://www.hudexchange.info/programs/cdbg-entitlement/",
        checkedOn: CHECKED,
      },
    ],
    verification: "partial",
    lastChecked: CHECKED,
  },
  {
    id: "fhlbsf-wish",
    name: "FHLBank San Francisco WISH",
    administrator: "Federal Home Loan Bank of San Francisco, through member banks",
    level: "federal",
    category: "federal",
    summary:
      "Down payment grants for first-time homebuyers, requested through a participating member bank. The program page confirms it exists; the current grant amount and income limit were not loaded.",
    assistanceType: "grant",
    repayment: "Grant. Repayment rules, if any, were not loaded.",
    combinable: "unknown",
    appliesTo: "household",
    availability: "unknown",
    benefit: { kind: "unknown", note: "Grant amount not loaded. Ask a member bank." },
    requirements: [
      { kind: "primary_residence" },
      { kind: "first_time_buyer" },
      {
        kind: "income_max_ami",
        percent: null,
        note: "The program uses an income limit that was not loaded in this build.",
      },
      {
        kind: "manual_review",
        note: "Must be requested through a participating FHLBank member bank, often with homebuyer education.",
      },
    ],
    openQuestions: [
      "Which member banks in Orange County currently offer WISH?",
      "What is the current grant amount and income limit?",
    ],
    sources: [
      {
        label: "FHLBank San Francisco WISH",
        url: "https://fhlbsf.com/products/community-programs-grants/wish",
        checkedOn: CHECKED,
        note: "Page describes grants for first-time buyer down payment help via member banks.",
      },
    ],
    verification: "partial",
    lastChecked: CHECKED,
  },
  {
    id: "fhlbsf-ahp",
    name: "FHLBank San Francisco Affordable Housing Program (AHP)",
    administrator: "Federal Home Loan Bank of San Francisco",
    level: "federal",
    category: "community",
    summary:
      "Competitive grants and subsidized advances awarded to affordable housing sponsors. Project-level funding, not an individual buyer application.",
    assistanceType: "grant",
    repayment: "Award terms depend on the project.",
    combinable: "unknown",
    appliesTo: "project",
    availability: "unknown",
    benefit: { kind: "unknown", note: "Project-level; no household amount estimated." },
    requirements: [
      {
        kind: "unknown",
        note: "AHP is awarded to a project sponsor, not to a household. Whether a local ownership project has an award is unknown here.",
      },
      {
        kind: "manual_review",
        note: "A nonprofit or developer sponsor applies in a competitive round.",
      },
    ],
    openQuestions: ["Is there an AHP-funded ownership project in this household's target city?"],
    sources: [
      {
        label: "FHLBank San Francisco AHP",
        url: "https://fhlbsf.com/products/community-programs-grants/ahp",
        checkedOn: CHECKED,
      },
    ],
    verification: "partial",
    lastChecked: CHECKED,
  },
  {
    id: "ochft",
    name: "Orange County Housing Finance Trust",
    administrator: "Orange County Housing Finance Trust",
    level: "county",
    category: "county",
    summary:
      "A countywide housing fund that issues funding notices. The home page reviewed does not describe a homeownership program, so this is a lead for a project sponsor, not a confirmed buyer benefit.",
    assistanceType: "unknown",
    repayment: "Not confirmed.",
    combinable: "unknown",
    appliesTo: "project",
    availability: "unknown",
    benefit: { kind: "unknown", note: "No homeownership benefit confirmed." },
    requirements: [
      {
        kind: "unknown",
        note: "No homeownership program was confirmed at the Trust, so a household benefit cannot be evaluated.",
      },
      {
        kind: "manual_review",
        note: "A developer or nonprofit would respond to a funding notice. No household application is confirmed.",
      },
    ],
    openQuestions: ["Has the Trust funded any ownership project, and who sponsors it?"],
    sources: [
      {
        label: "Orange County Housing Finance Trust",
        url: "https://ochft.org/programs",
        checkedOn: CHECKED,
        note: "Programs page loads and shows a funding notice; no homeownership program read.",
      },
    ],
    verification: "unverified",
    lastChecked: CHECKED,
  },
  {
    id: "santa-ana-my-first-home",
    name: "Santa Ana My First Home",
    administrator: "City of Santa Ana",
    level: "city",
    category: "city",
    summary:
      "A city down payment loan program for Santa Ana. The city page confirms the program exists; the loan terms, income limits and current funding were only seen in a search snippet, so they are not modelled here.",
    assistanceType: "loan",
    repayment: "Not loaded. Confirm with the city.",
    combinable: "unknown",
    appliesTo: "household",
    availability: "unknown",
    benefit: { kind: "unknown", note: "Loan amount and terms not loaded." },
    requirements: [
      { kind: "primary_residence" },
      {
        kind: "jurisdiction_in",
        cities: ["Santa Ana"],
        note: "Program is limited to Santa Ana.",
      },
      {
        kind: "income_max_ami",
        percent: null,
        note: "City income limit not loaded.",
      },
      { kind: "manual_review", note: "Confirm current funding and buyer requirements with the city." },
    ],
    openQuestions: [
      "Is the program currently funded and accepting applications?",
      "What are the income limits, loan amount and repayment terms?",
    ],
    sources: [
      {
        label: "City of Santa Ana My First Home",
        url: "https://santa-ana.org/my-first-home",
        checkedOn: CHECKED,
        note: "Page confirms the program; terms came from a search snippet only and are not used.",
      },
    ],
    verification: "unverified",
    lastChecked: CHECKED,
    jurisdictionNote: "Santa Ana only.",
  },
  {
    id: "garden-grove-first-time",
    name: "Garden Grove first-time homebuyer assistance",
    administrator: "City of Garden Grove",
    level: "city",
    category: "city",
    summary:
      "A city first-time homebuyer program with published guidelines. The 2025 guidelines PDF loads but was not read in full; dollar tiers seen in a search snippet are not used.",
    assistanceType: "unknown",
    repayment: "Not loaded.",
    combinable: "unknown",
    appliesTo: "household",
    availability: "unknown",
    benefit: { kind: "unknown", note: "Guidelines not read; no amount estimated." },
    requirements: [
      { kind: "primary_residence" },
      { kind: "jurisdiction_in", cities: ["Garden Grove"] },
      { kind: "first_time_buyer" },
      {
        kind: "income_max_ami",
        percent: null,
        note: "City income limit not loaded.",
      },
      { kind: "manual_review", note: "Read the current guidelines and confirm funding with the city." },
    ],
    openQuestions: [
      "What income limits and assistance amounts are in the current guidelines?",
      "Is funding available this year?",
    ],
    sources: [
      {
        label: "Garden Grove 2025 first-time homebuyer guidelines (PDF)",
        url: "https://ggcity.org/sites/default/files/2025-first-time-homebuyer-guidelines.pdf",
        checkedOn: CHECKED,
        note: "PDF loads (about 22 MB); not read in full.",
      },
    ],
    verification: "unverified",
    lastChecked: CHECKED,
    jurisdictionNote: "Garden Grove only.",
  },
  {
    id: "employer-assisted",
    name: "Employer-assisted housing benefit",
    administrator: "The buyer's employer",
    level: "employer",
    category: "employer",
    summary:
      "Some employers offer a down payment grant, a matched savings contribution or a repayable loan. No verified public list of Orange County employer programs was found, so this entry relies entirely on what the buyer reports.",
    assistanceType: "grant",
    repayment: "Depends on the employer. Some benefits are forgiven over time or require repayment if you leave.",
    combinable: "unknown",
    appliesTo: "household",
    availability: "unknown",
    benefit: {
      kind: "user_reported",
      note: "Uses the amount you entered. Unverified and may have tax or repayment consequences.",
    },
    requirements: [
      { kind: "employer_benefit" },
      { kind: "primary_residence" },
      {
        kind: "unknown",
        note: "No public source verifies this benefit; the amount is what you reported and the terms are unconfirmed.",
      },
      { kind: "manual_review", note: "Confirm the benefit, repayment terms and tax treatment with the employer." },
    ],
    openQuestions: [
      "Is the benefit a grant, a loan or a match, and what happens if you leave the job?",
      "Is it taxable income?",
    ],
    sources: [
      {
        label: "No verified public source found",
        checkedOn: CHECKED,
        note: "The event's data list marks employer-assisted housing examples as NOT FOUND. This program is user-reported only.",
      },
    ],
    verification: "unverified",
    lastChecked: CHECKED,
  },
  {
    id: "institutional-housing",
    name: "University or institutional housing benefit",
    administrator: "The buyer's or household member's institution",
    level: "institution",
    category: "institution",
    summary:
      "Colleges, universities and some large institutions offer homeownership benefits to employees, sometimes including shared-appreciation down payment help. CalHFA's program index shows an employer-based shared appreciation program with one university; no general Orange County list was verified.",
    assistanceType: "unknown",
    repayment: "Depends on the institution.",
    combinable: "unknown",
    appliesTo: "household",
    availability: "unknown",
    benefit: {
      kind: "user_reported",
      note: "Uses only what you report. No institutional amount is assumed.",
    },
    requirements: [
      { kind: "institutional_benefit" },
      { kind: "primary_residence" },
      { kind: "manual_review", note: "Confirm with the institution's housing or HR office." },
    ],
    openQuestions: ["Does the institution run a homebuyer benefit, and who administers it?"],
    sources: [
      {
        label: "CalHFA program handbooks index",
        url: "https://www.calhfa.ca.gov/homeownership/programs/index.htm",
        checkedOn: "2026-11-07",
        note: "Mentions an employer-based shared appreciation program with a university; no general list.",
      },
    ],
    verification: "unverified",
    lastChecked: "2026-11-07",
  },
  {
    id: "irvine-clt",
    name: "Community land trust or shared-equity home",
    administrator: "Local nonprofit (for example, a community land trust)",
    level: "nonprofit",
    category: "nonprofit",
    summary:
      "A community land trust or shared-equity program can lower the price of a home and restrict its resale. An official Irvine Community Land Trust site was not confirmed in the event's data list, so no terms are modelled.",
    assistanceType: "unknown",
    repayment: "Resale restrictions and shared equity depend on the nonprofit.",
    combinable: "unknown",
    appliesTo: "household",
    availability: "unknown",
    benefit: { kind: "unknown", note: "No confirmed program terms." },
    requirements: [
      { kind: "primary_residence" },
      {
        kind: "income_max_ami",
        percent: null,
        note: "Shared-equity programs set their own income limits.",
      },
      {
        kind: "manual_review",
        note: "Ask the city housing office or a HUD-approved housing counselor which CLT serves your area.",
      },
    ],
    openQuestions: [
      "Which community land trust or shared-equity program currently has homes available in Orange County?",
      "What income limits and resale restrictions apply?",
    ],
    sources: [
      {
        label: "City of Irvine",
        url: "https://www.cityofirvine.org/",
        checkedOn: CHECKED,
        note: "Starting point only. No CLT program terms confirmed.",
      },
      {
        label: "Grounded Solutions Network (CLT explainer)",
        url: "https://groundedsolutions.org/strengthening-neighborhoods/community-land-trusts",
        checkedOn: CHECKED,
      },
    ],
    verification: "unverified",
    lastChecked: CHECKED,
  },
];

export function getProgram(id: string): AssistanceProgram | undefined {
  return PROGRAMS.find((program) => program.id === id);
}

/**
 * Programs the catalog deliberately does not model, and why. Shown in the UI so
 * the absence is visible instead of looking like an oversight.
 */
export const NOT_MODELED_NOTES = [
  {
    name: "CalHFA Forgivable Equity Builder",
    note: "No official program page was located, and a 2022 board handout described it as winding down. It is not shown as available.",
  },
  {
    name: "Property-specific incentives",
    note: "No verified property-level incentive was loaded. The engine already supports city, property type and price tests, so a verified incentive can be added as a rule set without code changes.",
  },
  {
    name: "LIHTC",
    note: "Low-Income Housing Tax Credit is a rental housing program and is not a homebuyer benefit.",
  },
];
