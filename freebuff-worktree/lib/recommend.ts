import type { BuyerProfile } from "@/lib/profile/types";
import { LISTINGS, type Listing } from "@/lib/data/listings";
import {
  DEFAULT_ASSUMPTIONS,
  availableDownPayment,
  housingCost,
  maxPurchasePrice,
  monthlyBudget,
  type AffordabilityAssumptions,
  type HousingCost,
} from "./affordability";
import { evaluatePrograms, summarizeAssistance, type AssistanceSummary, type ProgramMatch } from "./eligibility/engine";
import type { Verdict } from "./eligibility/types";

export interface PropertyRecommendation {
  listing: Listing;
  cost: HousingCost;
  fitsBudget: boolean;
  surplus: number;
  matches: ProgramMatch[];
  assistance: AssistanceSummary;
  benefitApplied: number;
  fit: "fits" | "stretch" | "out_of_reach";
  preferenceHits: number;
  preferenceMisses: string[];
  notes: string[];
}

export interface RecommendationResult {
  properties: PropertyRecommendation[];
  budget: ReturnType<typeof monthlyBudget>;
  downPayment: number;
  maxPriceOnYourOwn: number;
  assumptions: AffordabilityAssumptions;
  filteredByPreference: boolean;
}

function preferenceScore(profile: BuyerProfile, listing: Listing): { hits: number; misses: string[] } {
  const preferences = profile.preferences;
  const misses: string[] = [];
  let hits = 0;

  if (preferences.cities.length > 0) {
    if (preferences.cities.includes(listing.city)) hits += 2;
    else misses.push(`${listing.city} is outside your selected cities`);
  }
  if (preferences.propertyTypes.length > 0) {
    if (preferences.propertyTypes.includes(listing.propertyType)) hits += 1;
    else misses.push("Property type is not on your list");
  }
  if (preferences.minBeds !== undefined) {
    if (listing.beds >= preferences.minBeds) hits += 1;
    else misses.push(`Only ${listing.beds} bedrooms`);
  }
  if (preferences.minBaths !== undefined) {
    if (listing.baths >= preferences.minBaths) hits += 1;
    else misses.push(`Only ${listing.baths} bathrooms`);
  }
  if (preferences.minSqft !== undefined) {
    if (listing.sqft >= preferences.minSqft) hits += 1;
    else misses.push(`Only ${listing.sqft} square feet`);
  }
  if (preferences.maxHoa !== undefined) {
    if (listing.monthlyHoa <= preferences.maxHoa) hits += 1;
    else misses.push(`HOA of ${listing.monthlyHoa} is above your limit`);
  }
  if (preferences.garage === true) {
    if (listing.garage) hits += 1;
    else misses.push("No garage");
  }
  if (preferences.yard === true) {
    if (listing.yard) hits += 1;
    else misses.push("No yard");
  }
  if (preferences.accessibilityFeatures && preferences.accessibilityFeatures.length > 0) {
    const missingFeatures = preferences.accessibilityFeatures.filter(
      (feature) => !listing.accessibility.includes(feature),
    );
    if (missingFeatures.length === 0) hits += 1;
    else misses.push("Does not list every accessibility feature you asked for");
  }
  if (preferences.condition === "new" && listing.condition !== "new") {
    misses.push("Not new construction");
  }
  if (preferences.condition === "fixer_ok" || preferences.condition === "either") {
    hits += 0;
  }

  return { hits, misses };
}

export function recommendProperties(
  profile: BuyerProfile,
  assumptions: AffordabilityAssumptions = DEFAULT_ASSUMPTIONS,
): RecommendationResult {
  const budget = monthlyBudget(profile, assumptions);
  const downPayment = availableDownPayment(profile);
  const maxPriceOnYourOwn = maxPurchasePrice({
    budget: budget.budget,
    downPayment,
    assumptions,
  });

  const ranked: PropertyRecommendation[] = LISTINGS.map((listing) => {
    const matches = evaluatePrograms(profile, listing);
    const assistance = summarizeAssistance(matches);
    const benefitApplied = assistance.likelyLow;
    const cost = housingCost(listing.price, downPayment + benefitApplied, listing.monthlyHoa, assumptions);
    const surplus = budget.budget - cost.total;
    const preference = preferenceScore(profile, listing);

    const fit: PropertyRecommendation["fit"] =
      budget.budget > 0 && surplus >= 0 ? "fits" : budget.budget > 0 && surplus >= -250 ? "stretch" : "out_of_reach";

    const notes: string[] = [];
    if (benefitApplied > 0) {
      notes.push(
        `Monthly cost shown after ${Math.round(benefitApplied).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })} of assistance that looks likely. Confirm before counting it.`,
      );
    }
    if (assistance.possibleHigh > 0) {
      notes.push("Additional assistance may apply but has open questions.");
    }
    if (listing.synthetic) {
      notes.push("Synthetic listing: not a real home, address or price.");
    }

    return {
      listing,
      cost,
      fitsBudget: surplus >= 0,
      surplus,
      matches,
      assistance,
      benefitApplied,
      fit,
      preferenceHits: preference.hits,
      preferenceMisses: preference.misses,
      notes,
    };
  });

  const cityFiltered =
    profile.preferences.cities.length > 0 && profile.preferences.flexibleLocation !== true
      ? ranked.filter((item) => profile.preferences.cities.includes(item.listing.city))
      : ranked;

  const typeFiltered =
    profile.preferences.propertyTypes.length > 0
      ? cityFiltered.filter((item) => profile.preferences.propertyTypes.includes(item.listing.propertyType))
      : cityFiltered;

  const filteredByPreference = typeFiltered.length > 0;
  const pool = filteredByPreference ? typeFiltered : cityFiltered.length > 0 ? cityFiltered : ranked;

  const sorted = pool.sort((a, b) => {
    const fitRank: Record<PropertyRecommendation["fit"], number> = {
      fits: 0,
      stretch: 1,
      out_of_reach: 2,
    };
    if (fitRank[a.fit] !== fitRank[b.fit]) return fitRank[a.fit] - fitRank[b.fit];
    if (b.preferenceHits !== a.preferenceHits) return b.preferenceHits - a.preferenceHits;
    return a.cost.total - b.cost.total;
  });

  return {
    properties: sorted,
    budget,
    downPayment,
    maxPriceOnYourOwn,
    assumptions,
    filteredByPreference,
  };
}

export function verdictRank(verdict: Verdict): number {
  return verdict === "likely" ? 0 : verdict === "possible" ? 1 : 2;
}
