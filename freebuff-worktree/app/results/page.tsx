import Link from "next/link";
import { redirect } from "next/navigation";
import { loadProfile } from "@/lib/db";
import { readSessionId } from "@/lib/session";
import { computeCompleteness, totalAnnualIncome } from "@/lib/profile/completeness";
import {
  amiContext,
  evaluatePrograms,
  summarizeAssistance,
  type AssistanceSummary,
} from "@/lib/eligibility/engine";
import type { ProgramMatch, Verdict } from "@/lib/eligibility/types";
import {
  ASSISTANCE_TYPE_LABELS,
  PROGRAM_CATEGORY_LABELS,
} from "@/lib/eligibility/types";
import { NOT_MODELED_NOTES } from "@/lib/eligibility/programs";
import { ASSUMPTION_NOTES, buyingPower } from "@/lib/affordability";
import { LISTINGS_NOTICE } from "@/lib/data/listings";
import { PROPERTY_TYPE_LABELS } from "@/lib/data/listings";
import { recommendProperties, type PropertyRecommendation } from "@/lib/recommend";
import { money, percent, shortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const VERDICT_COPY: Record<Verdict, string> = {
  likely: "Meets every test we can check",
  possible: "Worth checking",
  unlikely: "Does not fit your answers",
};

const VERIFICATION_COPY = {
  verified: "Terms read at the source",
  partial: "Partly verified",
  unverified: "Unverified",
} as const;

function BenefitLine({ match }: { match: ProgramMatch }) {
  if (match.benefit) {
    const { low, high, basis, note } = match.benefit;
    return (
      <div className="benefit">
        <span className="benefit__amount">{low === high ? money(low) : `${money(low)} – ${money(high)}`}</span>
        <span className="benefit__basis">
          estimated · {basis}
          {note ? ` · ${note}` : ""}
        </span>
      </div>
    );
  }
  return (
    <p className="tiny muted" style={{ marginTop: 10 }}>
      {match.benefitNote ?? "No amount is estimated for this program."}
    </p>
  );
}

function ProgramCard({ match }: { match: ProgramMatch }) {
  const { program } = match;
  return (
    <article className={`program${match.verdict === "unlikely" ? " program--unlikely" : ""}`}>
      <div className="program__head">
        <div>
          <h3 className="program__name">{program.name}</h3>
          <div className="program__admin">{program.administrator}</div>
        </div>
        <span className={`verdict verdict--${match.verdict}`}>{VERDICT_COPY[match.verdict]}</span>
      </div>

      <div className="badge-row">
        <span className="badge">{PROGRAM_CATEGORY_LABELS[program.category]}</span>
        <span className="badge">{ASSISTANCE_TYPE_LABELS[program.assistanceType]}</span>
        <span className={`badge badge--${program.verification}`}>
          {VERIFICATION_COPY[program.verification]}
        </span>
        {program.availability === "limited" ? <span className="badge">Limited or waitlist</span> : null}
        {program.availability === "not_confirmed" ? <span className="badge">Availability not confirmed</span> : null}
        {program.appliesTo === "project" ? <span className="badge">Project-level, not your down payment</span> : null}
      </div>

      <p className="program__summary">{program.summary}</p>
      <BenefitLine match={match} />

      {match.reasons.length > 0 ? (
        <div className="program__section">
          <h4>Why it showed up</h4>
          <ul className="reason-list">
            {match.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {match.nextSteps.length > 0 ? (
        <div className="program__section">
          <h4>Next step</h4>
          <ul className="reason-list">
            {match.nextSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {match.blockers.length > 0 ? (
        <div className="program__section">
          <h4>What rules it out</h4>
          <ul className="reason-list">
            {match.blockers.map((blocker) => (
              <li key={blocker}>{blocker}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="program__section">
        <h4>Ask before counting on it</h4>
        {match.openQuestions.length === 0 ? (
          <p className="small muted" style={{ margin: 0 }}>
            No open questions recorded. The program still makes the final decision.
          </p>
        ) : (
          <ul className="question-list">
            {match.openQuestions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        )}
      </div>

      <details>
        <summary>All {match.results.length} tests and the repayment terms</summary>
        <ul className="reason-list">
          {match.results.map((result, index) => (
            <li key={`${result.requirement.kind}-${index}`}>
              <strong>
                {result.status === "pass"
                  ? "Pass"
                  : result.status === "fail"
                    ? "Fail"
                    : result.status === "action"
                      ? "Action"
                      : "Unknown"}:
              </strong>{" "}
              {result.detail}
            </li>
          ))}
        </ul>
        <p className="small muted" style={{ marginTop: 10 }}>
          <strong>Repayment:</strong> {program.repayment}
        </p>
        <p className="small muted">
          <strong>Stacking:</strong>{" "}
          {program.combinable === "yes"
            ? "The program is described as combinable."
            : program.combinable === "no"
              ? "This program is not combinable with other assistance."
              : "Whether it can be combined is not confirmed."}{" "}
          {program.stackingNote ?? ""}
        </p>
      </details>

      <details>
        <summary>Sources</summary>
        <ul className="source-list">
          {program.sources.map((source) => (
            <li key={`${source.label}-${source.url ?? "none"}`}>
              {source.url ? (
                <a href={source.url} target="_blank" rel="noreferrer">
                  {source.label}
                </a>
              ) : (
                <span>{source.label}</span>
              )}
              {source.checkedOn ? ` · checked ${shortDate(source.checkedOn)}` : ""}
              {source.note ? <span className="muted"> — {source.note}</span> : null}
            </li>
          ))}
        </ul>
      </details>
    </article>
  );
}

function AssistanceTotals({
  summary,
  price,
}: {
  summary: AssistanceSummary;
  price: number;
}) {
  const hasAmounts =
    summary.likelyLow > 0 || summary.possibleLow > 0 || summary.unknownAmountPrograms.length > 0;

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div className="section-card__title">
        <h3>{price > 0 ? `Estimated assistance at a ${money(price)} home` : "Estimated assistance"}</h3>
        <span className="badge">Estimate, not an approval</span>
      </div>
      <p className="section-card__desc">
        A program is added to these totals only when it passed every test we can check and its
        amount is stated by a source. Programs with open questions are counted separately.
      </p>
      {hasAmounts ? (
        <div className="stat-grid" style={{ margin: "10px 0 0" }}>
          <div className="stat">
            <div className="stat__label">Likely programs</div>
            <div className="stat__value" style={{ fontSize: "1.35rem" }}>
              {money(summary.likelyLow)} – {money(summary.likelyHigh)}
            </div>
            <div className="stat__note">
              {summary.likelyPrograms.length} program
              {summary.likelyPrograms.length === 1 ? "" : "s"} passed every check we can run.
            </div>
          </div>
          <div className="stat">
            <div className="stat__label">If open questions resolve</div>
            <div className="stat__value" style={{ fontSize: "1.35rem" }}>
              {money(summary.possibleLow)} – {money(summary.possibleHigh)}
            </div>
            <div className="stat__note">
              {summary.possiblePrograms.length} more program
              {summary.possiblePrograms.length === 1 ? "" : "s"} cannot be checked from your answers.
            </div>
          </div>
          <div className="stat">
            <div className="stat__label">Amount unknown</div>
            <div className="stat__value" style={{ fontSize: "1.35rem" }}>
              {summary.unknownAmountPrograms.length}
            </div>
            <div className="stat__note">
              Program{summary.unknownAmountPrograms.length === 1 ? "" : "s"} where the terms were not
              loaded and no dollar figure is invented.
            </div>
          </div>
        </div>
      ) : (
        <p className="small muted">
          No program in the catalog both passed every test and stated a dollar amount for this
          price. That is an honest zero, not a claim that no help exists.
        </p>
      )}
      <p className="tiny muted" style={{ marginTop: 14, marginBottom: 0 }}>
        {summary.stackingCaveat}
      </p>
    </div>
  );
}

function PropertyCard({ item }: { item: PropertyRecommendation }) {
  const { listing, cost, assistance } = item;
  const statusClass =
    item.fit === "fits"
      ? "property__status--fits"
      : item.fit === "stretch"
        ? "property__status--stretch"
        : "property__status--out";
  const statusLabel =
    item.fit === "fits" ? "Fits your budget" : item.fit === "stretch" ? "Slightly over" : "Over budget";

  return (
    <article className="property">
      <div className="property__head">
        <div>
          <div className="property__price">{money(listing.price)}</div>
          <div className="property__place">
            {listing.city} · {PROPERTY_TYPE_LABELS[listing.propertyType]}
          </div>
        </div>
        <span className={`property__status ${statusClass}`}>{statusLabel}</span>
      </div>

      <div className="property__facts">
        <span className="pill">{listing.beds} bd</span>
        <span className="pill">{listing.baths} ba</span>
        <span className="pill">{listing.sqft.toLocaleString("en-US")} sq ft</span>
        <span className="pill">
          {listing.monthlyHoa > 0 ? `${money(listing.monthlyHoa)}/mo HOA` : "No HOA"}
        </span>
        <span className="pill">Synthetic</span>
      </div>

      <div className="property__rows">
        <div className="property__row">
          <span>Monthly housing cost</span>
          <span>{money(cost.total)}</span>
        </div>
        <div className="property__row">
          <span>Monthly budget</span>
          <span>{money(cost.total + item.surplus)}</span>
        </div>
        <div className="property__row">
          <span>{item.surplus >= 0 ? "Room left" : "Over budget"}</span>
          <span>{money(Math.abs(item.surplus))}</span>
        </div>
        {item.benefitApplied > 0 ? (
          <div className="property__row">
            <span>Assistance applied</span>
            <span>{money(item.benefitApplied)}</span>
          </div>
        ) : null}
      </div>

      <p className="tiny muted" style={{ margin: 0 }}>
        {money(cost.principalAndInterest)} principal and interest · {money(cost.taxes)} taxes ·{" "}
        {money(cost.insurance)} insurance · {money(cost.hoa)} HOA
      </p>

      {assistance.likelyPrograms.length > 0 ? (
        <div className="pills">
          {assistance.likelyPrograms.slice(0, 3).map((match) => (
            <span className="pill" key={match.program.id}>
              {match.program.name}
            </span>
          ))}
          {assistance.likelyPrograms.length > 3 ? (
            <span className="pill">+{assistance.likelyPrograms.length - 3} more</span>
          ) : null}
        </div>
      ) : (
        <p className="tiny muted" style={{ margin: 0 }}>
          No program passed every check we can run for this home. Open the full list above for the
          ones that depend on a question.
        </p>
      )}

      <details>
        <summary>Why this home, and what is still open</summary>
        <ul className="reason-list">
          {item.preferenceMisses.length > 0 ? (
            item.preferenceMisses.map((miss) => <li key={miss}>{miss}</li>)
          ) : (
            <li>It matches every preference you entered.</li>
          )}
          {item.assistance.possiblePrograms.length > 0 ? (
            <li>
              {item.assistance.possiblePrograms.length} program
              {item.assistance.possiblePrograms.length === 1 ? " has" : "s have"} open questions at
              this price.
            </li>
          ) : null}
          {item.assistance.projectPrograms.length > 0 ? (
            <li>
              {item.assistance.projectPrograms.length} project-level funding source is separate from
              your down payment.
            </li>
          ) : null}
        </ul>
        {item.notes.map((note) => (
          <p className="tiny muted" key={note}>
            {note}
          </p>
        ))}
      </details>
    </article>
  );
}

export default async function ResultsPage() {
  const sessionId = await readSessionId();
  if (!sessionId) redirect("/onboarding");
  const profile = loadProfile(sessionId);
  if (!profile) redirect("/onboarding");

  const completeness = computeCompleteness(profile);
  const income = totalAnnualIncome(profile);
  const power = buyingPower(profile);
  const ami = amiContext(profile);

  if (income <= 0) {
    return (
      <div className="container" style={{ paddingTop: 48, paddingBottom: 60 }}>
        <span className="eyebrow">Matches</span>
        <h1 style={{ fontSize: "clamp(1.9rem, 3.4vw, 2.7rem)" }}>One number first</h1>
        <div className="empty">
          <h3>Add your income to see matches</h3>
          <p className="small muted">
            The engine needs at least one recurring income source before it can compare you with an
            income limit or estimate a monthly payment. Nothing has been guessed in the meantime.
          </p>
          <Link href="/onboarding?step=1" className="btn btn--primary" style={{ marginTop: 12 }}>
            Add income
          </Link>
        </div>
      </div>
    );
  }

  const priceContext = power.maxPrice > 0 ? power.maxPrice : 0;
  const matches = evaluatePrograms(profile, undefined, priceContext || undefined);
  const summary = summarizeAssistance(matches);
  const recommendations = recommendProperties(profile);

  const householdMatches = matches.filter((match) => match.program.appliesTo === "household");
  const projectMatches = matches.filter((match) => match.program.appliesTo === "project");
  const likely = householdMatches.filter((match) => match.verdict === "likely");
  const possible = householdMatches.filter((match) => match.verdict === "possible");
  const unlikely = householdMatches.filter((match) => match.verdict === "unlikely");
  const topProperties = recommendations.properties.slice(0, 6);

  return (
    <div className="container">
      <div className="page-head">
        <span className="eyebrow">Matches</span>
        <h1 style={{ fontSize: "clamp(1.9rem, 3.4vw, 2.7rem)" }}>What may pencil, and what to ask</h1>
        <p className="lede">
          Built from your profile, the published Orange County income table, and each program's own
          stated rules. Every dollar below is an estimate; every unread rule is a question.
        </p>
        <div className="pills" style={{ marginTop: 14 }}>
          <span className="pill">Household of {ami.householdSize}</span>
          <span className="pill">
            {percent(ami.percentOfAmi, 0)} of Orange County AMI ({money(ami.median)})
          </span>
          <span className="pill">{completeness.percent}% profile complete</span>
          <span className="pill">Rate {(power.assumptions.interestRate * 100).toFixed(2)}%</span>
        </div>
      </div>

      {completeness.missing.length > 0 ? (
        <div className="notice notice--warn">
          <p>
            <strong>{completeness.missing.length} required answer{completeness.missing.length === 1 ? " is" : "s are"} missing.</strong>{" "}
            Programs that depend on them will show as open questions instead of a yes or no.{" "}
            <Link href="/profile">Review the list</Link> and add what you want to share.
          </p>
        </div>
      ) : null}

      <div className="stat-grid">
        <div className="stat">
          <div className="stat__label">Monthly housing budget</div>
          <div className="stat__value">{money(power.budget.budget)}</div>
          <div className="stat__note">{power.budget.bindingReason}</div>
        </div>
        <div className="stat">
          <div className="stat__label">Price on your own</div>
          <div className="stat__value">{money(power.maxPrice)}</div>
          <div className="stat__note">
            With {money(power.downPayment)} down, before assistance. Taxes and insurance assumed.
          </div>
        </div>
        <div className="stat">
          <div className="stat__label">Likely assistance</div>
          <div className="stat__value">
            {summary.likelyHigh > 0 ? `${money(summary.likelyLow)}–${money(summary.likelyHigh)}` : "Depends"}
          </div>
          <div className="stat__note">
            {priceContext > 0 ? `At a ${money(priceContext)} home. ` : ""}
            {summary.likelyPrograms.length} program
            {summary.likelyPrograms.length === 1 ? "" : "s"} passed every check we can run.
          </div>
        </div>
      </div>

      <details style={{ marginBottom: 26 }}>
        <summary>Rates, taxes, insurance and the income table behind these numbers</summary>
        <div className="assumptions">
          {ASSUMPTION_NOTES.map((note) => (
            <div className="assumption" key={note.label}>
              <div>
                <div className="assumption__label">{note.label}</div>
                <span
                  className={`assumption__kind${note.kind === "SOURCE" ? " assumption__kind--source" : ""}`}
                >
                  {note.kind}
                </span>
              </div>
              <div className="small muted">
                {note.detail}{" "}
                {note.url ? (
                  <a href={note.url} target="_blank" rel="noreferrer">
                    Source
                  </a>
                ) : null}
              </div>
            </div>
          ))}
          <div className="assumption">
            <div>
              <div className="assumption__label">Orange County median income</div>
              <span className="assumption__kind assumption__kind--source">SOURCE</span>
            </div>
            <div className="small muted">
              {ami.source.sourceLabel}: {money(ami.median)} for a {ami.householdSize}-person
              household. Percentages are computed from the published median row, rounded to the
              nearest $50. Programs that use their own table are marked as open questions.{" "}
              <a href={ami.source.sourceUrl} target="_blank" rel="noreferrer">
                HCD 2026 limits
              </a>
              , checked {shortDate(ami.source.checkedOn)}.
            </div>
          </div>
        </div>
      </details>

      <AssistanceTotals summary={summary} price={priceContext} />

      <div className="section-head">
        <div>
          <h2>Programs that look like a fit</h2>
          <p className="small muted" style={{ margin: 0 }}>
            Each program is tested on its own. “Likely” never means approved.
          </p>
        </div>
      </div>

      {likely.length === 0 ? (
        <div className="empty" style={{ marginBottom: 26 }}>
          <h3>No program passed every check yet</h3>
          <p className="small muted">
            That can mean an answer is missing, an income limit was not loaded, or the program truly
            does not fit. The “worth checking” list below shows which.
          </p>
        </div>
      ) : (
        likely.map((match) => <ProgramCard key={match.program.id} match={match} />)
      )}

      <div className="section-head" style={{ marginTop: 34 }}>
        <div>
          <h2>Worth checking</h2>
          <p className="small muted" style={{ margin: 0 }}>
            At least one test could not be evaluated from your answers or from a loaded source.
          </p>
        </div>
      </div>

      {possible.length === 0 ? (
        <p className="small muted">Nothing is in this bucket right now.</p>
      ) : (
        possible.map((match) => <ProgramCard key={match.program.id} match={match} />)
      )}

      {projectMatches.length > 0 ? (
        <details style={{ marginTop: 26 }}>
          <summary>
            Project-level funding ({projectMatches.length}) — not your down payment
          </summary>
          <p className="small muted" style={{ marginTop: 12 }}>
            These fund a developer, nonprofit or city program. They matter when a sponsor is
            building the home, not when you are buying an existing one.
          </p>
          {projectMatches.map((match) => (
            <ProgramCard key={match.program.id} match={match} />
          ))}
        </details>
      ) : null}

      {unlikely.length > 0 ? (
        <details style={{ marginTop: 26 }}>
          <summary>Programs that do not fit your answers ({unlikely.length})</summary>
          <p className="small muted" style={{ marginTop: 12 }}>
            Shown for transparency. A program appears here only when a rule it states is failed by
            an answer you gave.
          </p>
          {unlikely.map((match) => (
            <ProgramCard key={match.program.id} match={match} />
          ))}
        </details>
      ) : null}

      <div className="section-head" style={{ marginTop: 40 }}>
        <div>
          <span className="eyebrow">Homes</span>
          <h2>What the budget buys</h2>
          <p className="small muted" style={{ margin: 0 }}>
            {recommendations.filteredByPreference
              ? "Filtered to the cities and property types you chose."
              : "No sample home matched every preference, so the closest ones are shown."}
          </p>
        </div>
      </div>

      <div className="notice notice--warn">
        <p>
          <strong>These listings are synthetic.</strong> {LISTINGS_NOTICE} They exist only to test
          the math and the program stacking. Cities are real Orange County cities; every home,
          price, size and address is invented, and no address is shown.
        </p>
      </div>

      <div className="property-grid">
        {topProperties.map((item) => (
          <PropertyCard key={item.listing.id} item={item} />
        ))}
      </div>

      <div className="notice" style={{ marginTop: 30 }}>
        <p>
          <strong>What we did not use.</strong> Race, religion, national origin, sex, familial
          status and disability are never collected for property ranking or neighborhood steering.
          The only place a sensitive attribute is read is a program's own stated eligibility rule,
          and the output shows the reason, not the underlying value.
        </p>
      </div>

      <details style={{ marginTop: 18 }}>
        <summary>Programs this catalog deliberately does not model</summary>
        <ul className="reason-list">
          {NOT_MODELED_NOTES.map((note) => (
            <li key={note.name}>
              <strong>{note.name}:</strong> {note.note}
            </li>
          ))}
        </ul>
      </details>

      <div className="wizard__actions" style={{ marginBottom: 50 }}>
        <Link href="/onboarding" className="btn btn--primary">
          Edit profile
        </Link>
        <Link href="/profile" className="btn">
          Review every answer
        </Link>
        <span className="spacer" />
        <span className="tiny muted">Generated {shortDate(new Date().toISOString())}</span>
      </div>
    </div>
  );
}
