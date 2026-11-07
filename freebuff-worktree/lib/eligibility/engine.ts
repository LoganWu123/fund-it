/**
 * Eligibility engine.
 *
 * Design rules:
 * - Every requirement is evaluated independently. There is no universal
 *   definition of "first-time buyer", "income" or "household".
 * - A test that cannot be evaluated returns `unknown` with a question, never a
 *   guess. A program with one failing test is "unlikely"; otherwise unknown
 *   tests make it "possible".
 * - "likely" means every test we can evaluate passed. It is not an approval.
 */
import type { BuyerProfile } from "@/lib/profile/types";
import type { Listing } from "@/lib/data/listings";
import { HCD_2026_OC, amiPercentOf, ocIncomeLimit, ocMedianIncome } from "@/lib/data/ami";
import { labelOf, CURRENT_HOUSING_OPTIONS, EMPLOYMENT_STATUS_OPTIONS, MILITARY_OPTIONS, OCCUPATION_OPTIONS, PROPERTY_TYPE_OPTIONS } from "@/lib/profile/options";
import { householdSize, totalAnnualIncome } from "@/lib/profile/completeness";
import { money, percent } from "@/lib/format";
import type {
  AssistanceProgram,
  BenefitEstimate,
  MatchContext,
  ProgramMatch,
  Requirement,
  RequirementResult,
  Verdict,
} from "./types";
import { PROGRAMS } from "./programs";

export function deriveFirstTimeBuyer(profile: BuyerProfile): boolean | undefined {
  const history = profile.homeownership;
  if (history.ownsOtherProperty === true) return false;
  if (history.previouslyOwnedHome === true) return false;
  if (history.previouslyOwnedHome === false) return true;
  if (history.firstPrimaryResidence === true) return true;
  return undefined;
}

export function buildMatchContext(
  profile: BuyerProfile,
  listing?: Listing,
  priceOverride?: number,
): MatchContext {
  const size = householdSize(profile);
  const income = totalAnnualIncome(profile);
  const applicantIds = profile.household.members
    .filter((member) => member.isMortgageApplicant)
    .map((member) => member.id);

  const applicantSources = profile.incomeSources.filter(
    (source) => source.recurring && applicantIds.includes(source.memberId),
  );
  let borrowerIncome = applicantSources.reduce((sum, source) => sum + source.annualAmount, 0);
  if (borrowerIncome === 0) {
    borrowerIncome = profile.employment
      .filter((entry) => applicantIds.includes(entry.memberId))
      .reduce((sum, entry) => sum + (entry.annualEmploymentIncome ?? 0), 0);
  }

  const occupations = Array.from(
    new Set(
      profile.employment
        .map((entry) => entry.occupationCategory)
        .filter((value): value is NonNullable<typeof value> => Boolean(value)),
    ),
  );

  const employmentStatuses = Array.from(
    new Set(
      profile.employment
        .filter((entry) => applicantIds.includes(entry.memberId))
        .map((entry) => entry.status)
        .filter((value): value is NonNullable<typeof value> => Boolean(value)),
    ),
  );

  const enrolled = profile.education.find((entry) => entry.isEnrolled !== undefined);
  const hasRecentGraduate = profile.education.some(
    (entry) => entry.enrollmentStatus === "recently_graduated",
  );

  return {
    profileId: profile.id,
    householdSize: size,
    annualHouseholdIncome: income,
    annualBorrowerIncome: borrowerIncome || income,
    amiPercentOfIncome: amiPercentOf(income, size),
    occupationCategories: occupations,
    employmentStatuses,
    hasEmploymentAnswer: employmentStatuses.length > 0,
    isEnrolled: enrolled?.isEnrolled,
    hasRecentGraduate,
    firstTimeBuyer: deriveFirstTimeBuyer(profile),
    yearsSinceLastOwned: profile.homeownership.yearsSinceLastOwned,
    cityPreferences: profile.preferences.cities,
    preferredPropertyTypes: profile.preferences.propertyTypes,
    propertyCity: listing?.city,
    propertyType: listing?.propertyType,
    purchasePrice: listing?.price ?? priceOverride,
    reportedBenefitAmount: profile.assistance.employerBenefitAmount ?? undefined,
    members: profile.household.members,
  };
}

interface StatusDetail {
  status: RequirementResult["status"];
  detail: string;
}

function pass(detail: string): StatusDetail {
  return { status: "pass", detail };
}

function fail(detail: string): StatusDetail {
  return { status: "fail", detail };
}

function unknown(detail: string): StatusDetail {
  return { status: "unknown", detail };
}

function evaluateRequirement(
  requirement: Requirement,
  ctx: MatchContext,
  profile: BuyerProfile,
): RequirementResult {
  const result = (entry: StatusDetail): RequirementResult => ({
    requirement,
    status: entry.status,
    detail: entry.detail,
  });

  switch (requirement.kind) {
    case "primary_residence": {
      const arrangement = profile.preferences.arrangement;
      if (!arrangement) {
        return result(
          unknown("We do not know yet whether this will be your primary home. Answer the housing-use question."),
        );
      }
      return result(
        pass("The home would be your primary residence, which is what this program is for."),
      );
    }

    case "first_time_buyer": {
      if (ctx.firstTimeBuyer === undefined) {
        return result(
          unknown("Tell us whether you have owned a home before; this program defines first-time buyer its own way."),
        );
      }
      if (ctx.firstTimeBuyer) {
        return result(pass("You have not owned a home recently, so a first-time buyer test is likely met."));
      }
      if (requirement.lookbackYears === undefined) {
        return result(
          unknown(
            "You have owned before. This program defines first-time buyer its own way, so its lookback period needs to be checked.",
          ),
        );
      }
      if (
        ctx.yearsSinceLastOwned !== undefined &&
        ctx.yearsSinceLastOwned >= requirement.lookbackYears
      ) {
        return result(
          pass(
            `It has been at least ${requirement.lookbackYears} years since you owned a home, which meets this program's lookback.`,
          ),
        );
      }
      if (ctx.yearsSinceLastOwned === undefined) {
        return result(
          unknown(`This program uses a ${requirement.lookbackYears}-year lookback. Tell us when you last owned a home.`),
        );
      }
      return result(
        fail(
          `You owned a home within the last ${requirement.lookbackYears} years, which is inside this program's lookback period.`,
        ),
      );
    }

    case "income_max_ami": {
      const basis = requirement.basis ?? "household";
      const income = basis === "borrower" ? ctx.annualBorrowerIncome : ctx.annualHouseholdIncome;
      const median = ocMedianIncome(ctx.householdSize);
      const position = `${money(income)} is ${percent(ctx.amiPercentOfIncome)} of the Orange County AMI for a ${ctx.householdSize}-person household (${money(median)}).`;
      if (requirement.percent === null) {
        return result(
          unknown(
            `This program's income limit table was not loaded. ${position} Ask which table the program uses and what the exact limit is.`,
          ),
        );
      }
      const limit = ocIncomeLimit(ctx.householdSize, requirement.percent);
      if (income <= limit) {
        return result(
          pass(
            `${position} That is at or below ${requirement.percent}% of AMI (${money(limit)}), so this income test appears to pass.`,
          ),
        );
      }
      return result(
        fail(
          `${position} That is above ${requirement.percent}% of AMI (${money(limit)}), so this income test likely does not pass.`,
        ),
      );
    }

    case "income_max": {
      if (requirement.amount === null) {
        return result(unknown("This program's income limit was not loaded. Ask the program for its current limit."));
      }
      const basis = requirement.basis ?? "household";
      const income = basis === "borrower" ? ctx.annualBorrowerIncome : ctx.annualHouseholdIncome;
      return income <= requirement.amount
        ? result(pass(`Household income is at or below the program's ${money(requirement.amount)} limit.`))
        : result(fail(`Household income is above the program's ${money(requirement.amount)} limit.`));
    }

    case "household_size_min":
      if (ctx.householdSize >= requirement.min) {
        return result(pass(`Your household of ${ctx.householdSize} meets the minimum of ${requirement.min}.`));
      }
      return result(fail(`This program requires at least ${requirement.min} people in the household.`));

    case "household_size_max":
      if (ctx.householdSize <= requirement.max) {
        return result(pass(`Your household of ${ctx.householdSize} is within the maximum of ${requirement.max}.`));
      }
      return result(fail(`This program is limited to households of ${requirement.max} or fewer.`));

    case "occupation_in": {
      if (!ctx.hasEmploymentAnswer) {
        return result(unknown("Add your occupation to test this program's profession requirement."));
      }
      if (ctx.occupationCategories.length === 0) {
        return result(unknown("Your occupation is not answered, so this profession test cannot be checked."));
      }
      if (ctx.occupationCategories.includes("prefer_not_to_say")) {
        return result(
          unknown("You preferred not to share your occupation, so this profession test can only be checked directly."),
        );
      }
      const allowed = requirement.occupations;
      const matched = ctx.occupationCategories.filter((occupation) => allowed.includes(occupation));
      if (matched.length > 0) {
        return result(
          pass(
            `Your occupation (${matched
              .map((occupation) => labelOf(OCCUPATION_OPTIONS, occupation))
              .join(", ")}) is one this program describes.`,
          ),
        );
      }
      return result(
        fail(
          `This program is limited to ${allowed.map((occupation) => labelOf(OCCUPATION_OPTIONS, occupation)).join(", ")}, and your occupation is different.`,
        ),
      );
    }

    case "employment_status_in": {
      if (!ctx.hasEmploymentAnswer) {
        return result(unknown("Add your employment status to test this program."));
      }
      const matched = ctx.employmentStatuses.filter((status) => requirement.statuses.includes(status));
      if (matched.length > 0) {
        return result(
          pass(
            `Your employment status (${matched
              .map((status) => labelOf(EMPLOYMENT_STATUS_OPTIONS, status))
              .join(", ")}) is one this program accepts.`,
          ),
        );
      }
      return result(fail("Your employment status does not match this program's requirement."));
    }

    case "military_status_in": {
      const status = profile.military.status;
      if (profile.military.preferNotToSay) {
        return result(unknown("You preferred not to share military status, so this test needs to be checked directly."));
      }
      if (!status) {
        return result(unknown("Military status is a voluntary question. Answer it to test VA and military programs."));
      }
      if (status === "none") {
        return result(fail("You indicated you are not military-affiliated."));
      }
      if (requirement.statuses.includes(status)) {
        return result(
          pass(`Your military status (${labelOf(MILITARY_OPTIONS, status)}) is one this program accepts.`),
        );
      }
      return result(
        fail(`This program accepts ${requirement.statuses.map((item) => labelOf(MILITARY_OPTIONS, item)).join(", ")}.`),
      );
    }

    case "student_status_in": {
      if (ctx.isEnrolled === undefined && !ctx.hasRecentGraduate) {
        return result(unknown("Student status is optional. Answer it to test institutional programs."));
      }
      const derived = ctx.hasRecentGraduate
        ? "recent_graduate"
        : ctx.isEnrolled
          ? "enrolled"
          : "not_enrolled";
      return requirement.statuses.includes(derived)
        ? result(pass("Your student status matches what this program describes."))
        : result(fail("Your student status does not match this program's requirement."));
    }

    case "current_housing_in": {
      const housing = profile.homeownership.currentHousing;
      if (!housing) {
        return result(unknown("Tell us where you live now to test this program."));
      }
      return requirement.values.includes(housing)
        ? result(pass(`Your current housing (${labelOf(CURRENT_HOUSING_OPTIONS, housing)}) matches this program.`))
        : result(fail("Your current housing situation does not match this program's requirement."));
    }

    case "purchase_price_max": {
      if (!ctx.purchasePrice) {
        return result(unknown(`This program limits the purchase price (${money(requirement.amount)}); it depends on the home.`));
      }
      return ctx.purchasePrice <= requirement.amount
        ? result(pass(`${money(ctx.purchasePrice)} is at or below this program's price limit.`))
        : result(fail(`${money(ctx.purchasePrice)} is above this program's ${money(requirement.amount)} price limit.`));
    }

    case "property_type_in": {
      if (ctx.propertyType) {
        return requirement.propertyTypes.includes(ctx.propertyType)
          ? result(pass(`A ${labelOf(PROPERTY_TYPE_OPTIONS, ctx.propertyType)} is an eligible property type.`))
          : result(fail(`This program does not include ${labelOf(PROPERTY_TYPE_OPTIONS, ctx.propertyType)} properties.`));
      }
      if (ctx.preferredPropertyTypes.length === 0) {
        return result(unknown("This program limits property types. Tell us which types you would consider."));
      }
      const outside = ctx.preferredPropertyTypes.filter((type) => !requirement.propertyTypes.includes(type));
      return outside.length === 0
        ? result(pass("All the property types you selected are eligible for this program."))
        : result(
            unknown(
              `This program excludes ${outside
                .map((type) => labelOf(PROPERTY_TYPE_OPTIONS, type))
                .join(", ")}. It applies only to some of the types you selected.`,
            ),
          );
    }

    case "jurisdiction_in": {
      if (ctx.propertyCity) {
        return requirement.cities.includes(ctx.propertyCity)
          ? result(pass(`${ctx.propertyCity} is inside this program's area.`))
          : result(fail(`${ctx.propertyCity} is outside this program's area.`));
      }
      if (ctx.cityPreferences.length === 0) {
        return result(unknown(`This program is limited to ${requirement.cities.join(", ")}. Add your cities to test it.`));
      }
      const inside = ctx.cityPreferences.filter((city) => requirement.cities.includes(city));
      return inside.length > 0
        ? result(pass(`Some of your cities (${inside.join(", ")}) are inside this program's area.`))
        : result(fail(`This program is limited to ${requirement.cities.join(", ")}, which is outside your selected cities.`));
    }

    case "marital_status_in": {
      const status = profile.household.maritalStatus;
      if (!status || status === "prefer_not_to_say") {
        return result(unknown("Marital status is optional and was not shared, so this program's rule needs to be checked directly."));
      }
      return requirement.statuses.includes(status)
        ? result(pass("Your household composition matches this program's stated rule."))
        : result(fail("This program's household composition rule does not match your answer."));
    }

    case "co_applicant_required": {
      const joint =
        profile.household.purchaseType === "joint" ||
        ctx.members.filter((member) => member.isMortgageApplicant).length > 1;
      if (profile.household.purchaseType === undefined) {
        return result(unknown("Tell us whether you are buying alone or jointly to test this rule."));
      }
      if (requirement.required) {
        return joint
          ? result(pass("You are buying jointly, which this program requires."))
          : result(fail("This program requires a co-applicant."));
      }
      return result(pass("This program does not require a co-applicant."));
    }

    case "dependent_min": {
      if (profile.household.dependentsCount === undefined) {
        return result(unknown("Tell us how many dependents live with you to test this program."));
      }
      return profile.household.dependentsCount >= requirement.min
        ? result(pass(`You have ${profile.household.dependentsCount} dependents, meeting the minimum of ${requirement.min}.`))
        : result(fail(`This program requires at least ${requirement.min} dependents.`));
    }

    case "first_generation_homebuyer": {
      const value = profile.assistance.firstGenerationHomebuyer;
      if (value === undefined) {
        return result(
          unknown("This program is for first-generation homebuyers. Answer the optional question to test it."),
        );
      }
      return value
        ? result(pass("You indicated you are a first-generation homebuyer."))
        : result(fail("This program is limited to first-generation homebuyers."));
    }

    case "employer_benefit": {
      const value = profile.assistance.employerBenefitAvailable;
      if (value === undefined) {
        return result(unknown("Tell us whether your employer offers a housing benefit."));
      }
      return value
        ? result(pass("You reported an employer housing benefit."))
        : result(fail("No employer housing benefit was reported."));
    }

    case "institutional_benefit": {
      const value =
        profile.assistance.institutionalBenefitAvailable ??
        (profile.education.some((entry) => entry.institutionalHousingBenefit === true) ? true : undefined);
      if (value === undefined) {
        return result(unknown("Tell us whether your school or institution offers a housing benefit."));
      }
      return value
        ? result(pass("You reported an institutional housing benefit."))
        : result(fail("No institutional housing benefit was reported."));
    }

    case "targeted_area": {
      const value = profile.assistance.targetedGeographicArea;
      if (value === undefined) {
        return result(unknown("Tell us whether the home is in a targeted area; some programs require it."));
      }
      return value
        ? result(pass("You indicated the purchase is in a targeted geographic area."))
        : result(fail("This program requires a targeted geographic area."));
    }

    case "manual_review":
      // A process step, not an eligibility test. It is shown separately and does
      // not make an otherwise-qualifying program look uncertain.
      return result({ status: "action", detail: requirement.note });

    case "unknown":
      return result(unknown(requirement.note));
  }
}

function estimateBenefit(program: AssistanceProgram, ctx: MatchContext): BenefitEstimate | null {
  const price = ctx.purchasePrice;
  const benefit = program.benefit;
  switch (benefit.kind) {
    case "percent_of_price": {
      if (!price) return null;
      const raw = (price * benefit.percent) / 100;
      const amount = Math.min(raw, benefit.cap ?? Number.POSITIVE_INFINITY);
      return {
        low: amount,
        high: amount,
        kind: "estimated",
        basis: `${benefit.percent}% of ${money(price)}${benefit.cap ? `, capped at ${money(benefit.cap)}` : ""}`,
        note: benefit.note,
      };
    }
    case "percent_range_of_price": {
      if (!price) return null;
      const low = (price * benefit.minPercent) / 100;
      const highRaw = (price * benefit.maxPercent) / 100;
      const high = Math.min(highRaw, benefit.cap ?? Number.POSITIVE_INFINITY);
      return {
        low,
        high,
        kind: "range",
        basis: `${benefit.minPercent}% to ${benefit.maxPercent}% of ${money(price)}`,
        note: benefit.note,
      };
    }
    case "fixed":
      return { low: benefit.amount, high: benefit.amount, kind: "estimated", basis: "Fixed amount", note: benefit.note };
    case "user_reported": {
      // The profile collects one reported amount, for an employer benefit. Do not
      // reuse it for an institutional program the buyer said nothing numeric about.
      if (program.category !== "employer") return null;
      const amount = ctx.reportedBenefitAmount;
      if (!amount) return null;
      return {
        low: amount,
        high: amount,
        kind: "estimated",
        basis: "Amount you reported",
        note: benefit.note,
      };
    }
    case "unknown":
      return null;
  }
}

export function evaluateProgram(
  program: AssistanceProgram,
  ctx: MatchContext,
  profile: BuyerProfile,
): ProgramMatch {
  const results = program.requirements.map((requirement) =>
    evaluateRequirement(requirement, ctx, profile),
  );

  const blockers = results.filter((entry) => entry.status === "fail").map((entry) => entry.detail);
  const unanswered = results.filter((entry) => entry.status === "unknown").map((entry) => entry.detail);
  const reasons = results.filter((entry) => entry.status === "pass").map((entry) => entry.detail);
  const nextSteps = results.filter((entry) => entry.status === "action").map((entry) => entry.detail);

  const verdict: Verdict =
    blockers.length > 0 ? "unlikely" : unanswered.length > 0 ? "possible" : "likely";

  const benefit = verdict === "unlikely" ? null : estimateBenefit(program, ctx);
  const benefitNote = benefit
    ? null
    : program.benefit.kind === "unknown" || program.benefit.kind === "user_reported"
      ? (program.benefit.note ?? null)
      : ctx.purchasePrice
        ? "The estimated amount could not be calculated."
        : "The estimated amount depends on the home's price.";

  const openQuestions = Array.from(new Set([...unanswered, ...program.openQuestions]));

  return {
    program,
    verdict,
    results,
    reasons,
    blockers,
    openQuestions,
    nextSteps,
    benefit,
    benefitNote,
  };
}

export function evaluatePrograms(
  profile: BuyerProfile,
  listing?: Listing,
  priceOverride?: number,
): ProgramMatch[] {
  const ctx = buildMatchContext(profile, listing, priceOverride);
  return PROGRAMS.map((program) => evaluateProgram(program, ctx, profile)).sort((a, b) => {
    const rank: Record<Verdict, number> = { likely: 0, possible: 1, unlikely: 2 };
    if (rank[a.verdict] !== rank[b.verdict]) return rank[a.verdict] - rank[b.verdict];
    return (b.benefit?.high ?? 0) - (a.benefit?.high ?? 0);
  });
}

export interface AssistanceSummary {
  likelyLow: number;
  likelyHigh: number;
  possibleLow: number;
  possibleHigh: number;
  likelyPrograms: ProgramMatch[];
  possiblePrograms: ProgramMatch[];
  unknownAmountPrograms: ProgramMatch[];
  projectPrograms: ProgramMatch[];
  stackingCaveat: string;
}

export function summarizeAssistance(matches: ProgramMatch[]): AssistanceSummary {
  const household = matches.filter((match) => match.program.appliesTo === "household");
  const likelyPrograms = household.filter((match) => match.verdict === "likely");
  const possiblePrograms = household.filter((match) => match.verdict === "possible");
  const projectPrograms = matches.filter((match) => match.program.appliesTo === "project");
  const sum = (programs: ProgramMatch[], key: "low" | "high") =>
    programs.reduce((total, match) => total + (match.benefit?.[key] ?? 0), 0);

  return {
    likelyLow: sum(likelyPrograms, "low"),
    likelyHigh: sum(likelyPrograms, "high"),
    possibleLow: sum(possiblePrograms, "low"),
    possibleHigh: sum(possiblePrograms, "high"),
    likelyPrograms,
    possiblePrograms,
    unknownAmountPrograms: household.filter(
      (match) => match.verdict !== "unlikely" && match.benefit === null,
    ),
    projectPrograms,
    stackingCaveat:
      "Each program sets its own stacking rules. The totals below add programs together only as a rough ceiling, not as a promise that they can be combined. Ask each administrator before counting on more than one layer.",
  };
}

export function amiContext(profile: BuyerProfile) {
  const size = householdSize(profile);
  const income = totalAnnualIncome(profile);
  return {
    householdSize: size,
    annualIncome: income,
    median: ocMedianIncome(size),
    percentOfAmi: amiPercentOf(income, size),
    source: HCD_2026_OC,
  };
}

export type { ProgramMatch };
