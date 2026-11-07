import Link from "next/link";
import { loadProfile } from "@/lib/db";
import { readSessionId } from "@/lib/session";
import { computeCompleteness, totalAnnualIncome } from "@/lib/profile/completeness";
import { amiContext, evaluatePrograms, summarizeAssistance } from "@/lib/eligibility/engine";
import { PROGRAMS } from "@/lib/eligibility/programs";
import { PROGRAM_CATEGORY_LABELS, type ProgramCategory } from "@/lib/eligibility/types";
import { buyingPower } from "@/lib/affordability";
import { money, percent } from "@/lib/format";

export const dynamic = "force-dynamic";

const CATEGORY_ORDER: ProgramCategory[] = [
  "federal",
  "state",
  "county",
  "city",
  "profession",
  "employer",
  "institution",
  "veteran",
  "nonprofit",
  "community",
  "property",
];

export default async function HomePage() {
  const sessionId = await readSessionId();
  const profile = sessionId ? loadProfile(sessionId) : null;
  const hasIncome = profile ? totalAnnualIncome(profile) > 0 : false;
  const completeness = profile ? computeCompleteness(profile) : null;
  const power = profile ? buyingPower(profile) : null;
  const matches = profile && hasIncome ? evaluatePrograms(profile) : [];
  const summary = profile && hasIncome ? summarizeAssistance(matches) : null;
  const ami = profile && hasIncome ? amiContext(profile) : null;

  const categoryCounts = PROGRAMS.reduce<Record<string, number>>((counts, program) => {
    counts[program.category] = (counts[program.category] ?? 0) + 1;
    return counts;
  }, {});

  return (
    <>
      <section className="hero">
        <div className="container hero__grid">
          <div>
            <span className="eyebrow">Orange County homebuyer prototype</span>
            <h1>Find the help before you find the house.</h1>
            <p className="lede">
              Most assistance is missed because the profile was too thin to see it. Build a full
              picture once, then price every home against the programs you may actually qualify
              for — with the reason, the amount, and the question still open.
            </p>
            <div className="hero__actions">
              <Link href={profile ? "/onboarding" : "/onboarding"} className="btn btn--primary">
                {profile ? "Continue your profile" : "Build your profile"}
              </Link>
              <Link href="/results" className="btn">
                See matches
              </Link>
            </div>
            <p className="hero__fineprint">
              Prototype only. Not legal, financial or lending advice, and not an eligibility
              determination. Use made-up information: do not enter real personal or financial
              details about anyone.
            </p>
          </div>

          <aside className="equation" aria-label="The affordable home equation">
            <span className="equation__label">The equation this serves</span>
            <p className="equation__body">
              What the family can pay <strong>+</strong> public subsidies <strong>+</strong>{" "}
              fundraising <strong>−</strong> the cost to create the home <strong>= $0</strong>
            </p>
            <p className="equation__note">
              In Orange County the cost side usually wins by six figures. This tool works on the
              family's side of the equation: finding every legitimate layer of help before a home is
              chosen. It does not create subsidy, and it does not decide who qualifies.
            </p>
          </aside>
        </div>
      </section>

      {profile && completeness && power ? (
        <section className="band band--tight">
          <div className="container">
            <div className="section-head">
              <div>
                <span className="eyebrow">Your snapshot</span>
                <h2>Where the numbers stand</h2>
              </div>
              <Link href="/results" className="edit-link">
                Open matches
              </Link>
            </div>
            <div className="stat-grid">
              <div className="stat">
                <div className="stat__label">Monthly housing budget</div>
                <div className="stat__value">{hasIncome ? money(power.budget.budget) : "—"}</div>
                <div className="stat__note">{power.budget.bindingReason}</div>
              </div>
              <div className="stat">
                <div className="stat__label">Price on your own</div>
                <div className="stat__value">{hasIncome ? money(power.maxPrice) : "—"}</div>
                <div className="stat__note">
                  Before assistance, at the rate and assumptions shown in matches.
                </div>
              </div>
              <div className="stat">
                <div className="stat__label">Programs to look at</div>
                <div className="stat__value">
                  {hasIncome && summary
                    ? `${summary.likelyPrograms.length} likely · ${summary.possiblePrograms.length} to check`
                    : "—"}
                </div>
                <div className="stat__note">
                  “Likely” means every test we could evaluate passed. It is not an approval.
                </div>
              </div>
            </div>
            <div className="pills">
              <span className="pill">Profile {completeness.percent}% complete</span>
              {ami ? (
                <span className="pill">
                  Household income at {percent(ami.percentOfAmi, 0)} of Orange County AMI
                </span>
              ) : null}
              <span className="pill">{PROGRAMS.length} programs in the catalog</span>
              {completeness.missing.length > 0 ? (
                <span className="pill">{completeness.missing.length} required answers missing</span>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <section className="band">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">How it works</span>
              <h2>Three moves, in order</h2>
            </div>
          </div>
          <div className="grid grid--3">
            <div className="card">
              <span className="card__index">1</span>
              <h3>Build the profile</h3>
              <p className="small muted">
                Seven short steps: money, household, work and school, current housing, property
                preferences, location, and the optional questions that unlock specific programs.
                Skip anything optional. Come back later.
              </p>
            </div>
            <div className="card">
              <span className="card__index">2</span>
              <h3>Test each program, separately</h3>
              <p className="small muted">
                No universal definition of “first-time buyer” or “household income.” Every program
                is a rule set with its own tests and its own source. A test we cannot evaluate
                becomes a question, not a guess.
              </p>
            </div>
            <div className="card">
              <span className="card__index">3</span>
              <h3>Price the home</h3>
              <p className="small muted">
                Assistance is applied to the monthly cost of a specific home, alongside taxes,
                insurance and HOA. The result is what you would actually pay each month — and how
                far over or under your comfort line it lands.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Coverage</span>
              <h2>Eleven funding categories, one profile</h2>
              <p className="lede" style={{ fontSize: "0.98rem" }}>
                Every entry carries a source, the date it was checked, and a verification status.
                Programs whose terms were not read are labeled unverified rather than guessed.
              </p>
            </div>
          </div>
          <div className="grid grid--3">
            {CATEGORY_ORDER.map((category) => (
              <div className="card card--soft" key={category}>
                <div className="section-card__title">
                  <h3 style={{ fontSize: "1rem" }}>{PROGRAM_CATEGORY_LABELS[category]}</h3>
                  <span className="badge">{categoryCounts[category] ?? 0}</span>
                </div>
                <p className="tiny muted" style={{ marginBottom: 0 }}>
                  {category === "property"
                    ? "No verified property-level incentive is loaded. The engine supports price, property-type and jurisdiction tests so one can be added as a rule set."
                    : `${categoryCounts[category] ?? 0} program${(categoryCounts[category] ?? 0) === 1 ? "" : "s"} in the catalog.`}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="band">
        <div className="container">
          <div className="grid grid--2">
            <div className="card card--accent">
              <h2 style={{ fontSize: "1.4rem" }}>What this tool does</h2>
              <ul className="reason-list">
                <li>Turns a partial profile into a list of specific tests it can and cannot check.</li>
                <li>Shows the income limit table and the date behind every income test.</li>
                <li>Estimates assistance only where a source states the percentage or amount.</li>
                <li>Prices synthetic sample homes against your own monthly comfort line.</li>
                <li>Shows every program's open questions before you count on it.</li>
              </ul>
            </div>
            <div className="card">
              <h2 style={{ fontSize: "1.4rem" }}>What it refuses to do</h2>
              <ul className="reason-list">
                <li>Invent a statute, income limit, fee, deadline, address or parcel fact.</li>
                <li>Treat one program's definition as universal.</li>
                <li>Collect protected characteristics to rank neighborhoods or steer a buyer.</li>
                <li>File an application, send a message, or change any real system.</li>
                <li>Call an estimate an approval, or replace a housing counselor or lender.</li>
              </ul>
            </div>
          </div>

          <div className="notice notice--warn" style={{ marginTop: 26 }}>
            <p>
              <strong>Read the labels.</strong> The catalog mixes programs whose terms were read
              from the source, programs where only existence was confirmed, and leads where sources
              disagree. Each card shows which one it is. Funds run out, programs close, and income
              limits are revised during the year.
            </p>
          </div>

          <div className="pills" style={{ marginTop: 18 }}>
            <span className="pill">HCD 2026 State Income Limits (June 23, 2026 revision)</span>
            <span className="pill">Freddie Mac PMMS 7.18% (Nov 5, 2026 observation)</span>
            <span className="pill">CalHFA, HCD, HUD, FHLBank SF and city program pages</span>
            <span className="pill">Synthetic listings only</span>
          </div>
        </div>
      </section>
    </>
  );
}
