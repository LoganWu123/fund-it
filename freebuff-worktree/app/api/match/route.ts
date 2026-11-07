import { NextResponse } from "next/server";
import { loadProfile } from "@/lib/db";
import { readSessionId } from "@/lib/session";
import { buildMatchContext, evaluatePrograms, summarizeAssistance } from "@/lib/eligibility/engine";
import { buyingPower } from "@/lib/affordability";
import { LISTINGS } from "@/lib/data/listings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Matching API. Returns derived results only: the stored sensitive attributes
 * are not echoed back, and the profile itself is not included.
 */
export async function GET(request: Request) {
  const sessionId = await readSessionId();
  if (!sessionId) {
    return NextResponse.json({ error: "No profile session on this browser." }, { status: 401 });
  }
  const profile = loadProfile(sessionId);
  if (!profile) {
    return NextResponse.json({ error: "No profile has been saved yet." }, { status: 404 });
  }

  const url = new URL(request.url);
  const listingId = url.searchParams.get("listing");
  const listing = listingId ? LISTINGS.find((item) => item.id === listingId) : undefined;
  if (listingId && !listing) {
    return NextResponse.json({ error: "Unknown synthetic listing id." }, { status: 400 });
  }

  const power = buyingPower(profile);
  const requestedPrice = Number(url.searchParams.get("price"));
  const priceContext =
    Number.isFinite(requestedPrice) && requestedPrice > 0
      ? requestedPrice
      : listing
        ? undefined
        : power.maxPrice > 0
          ? power.maxPrice
          : undefined;

  const context = buildMatchContext(profile, listing, priceContext);
  const matches = evaluatePrograms(profile, listing, priceContext);
  const assistance = summarizeAssistance(matches);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    context: {
      householdSize: context.householdSize,
      annualHouseholdIncome: context.annualHouseholdIncome,
      amiPercentOfIncome: Math.round(context.amiPercentOfIncome * 10) / 10,
      propertyCity: context.propertyCity ?? null,
      propertyType: context.propertyType ?? null,
      purchasePrice: context.purchasePrice ?? null,
    },
    assistance: {
      likelyLow: assistance.likelyLow,
      likelyHigh: assistance.likelyHigh,
      possibleLow: assistance.possibleLow,
      possibleHigh: assistance.possibleHigh,
      programsLikely: assistance.likelyPrograms.length,
      programsPossible: assistance.possiblePrograms.length,
      programsWithoutKnownAmount: assistance.unknownAmountPrograms.length,
      stackingCaveat: assistance.stackingCaveat,
    },
    buyingPower: {
      monthlyBudget: power.budget.budget,
      maxPriceOnYourOwn: power.maxPrice,
      downPayment: power.downPayment,
      interestRate: power.assumptions.interestRate,
      termYears: power.assumptions.termYears,
    },
    matches: matches.map((match) => ({
      id: match.program.id,
      name: match.program.name,
      administrator: match.program.administrator,
      category: match.program.category,
      appliesTo: match.program.appliesTo,
      verification: match.program.verification,
      availability: match.program.availability,
      assistanceType: match.program.assistanceType,
      verdict: match.verdict,
      estimatedBenefit: match.benefit,
      benefitNote: match.benefitNote,
      reasons: match.reasons,
      blockers: match.blockers,
      openQuestions: match.openQuestions,
      nextSteps: match.nextSteps,
      sources: match.program.sources,
    })),
    notes: [
      "Prototype output, not an eligibility determination or lending advice.",
      "Synthetic listings only. No real property, address or parcel data is used.",
    ],
  });
}
