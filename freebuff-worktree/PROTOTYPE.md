# FundIt! OC

> A complete homebuyer profile, tested program by program and priced against real Orange County
> income limits — so a first-time buyer and their counselor can see which help might actually
> apply, why, and what is still unknown.

**Team:** add your team name and members on the submission form
**Lane:** 3, Fund it
**Built at:** Claude Impact Lab: UCI × SoCal Affordable Housing, November 7, 2026

## The real user

A first-time buyer working with a nonprofit housing counselor in Orange County. They have a
paycheck, some savings and a monthly number that feels safe, but the program list is a stack of
PDFs and each one defines "household", "income" and "first-time buyer" differently. A counselor
has to rebuild the same profile for every program, and the buyer cannot tell which opportunities
were actually checked.

**Before:** a spreadsheet, a folder of program pages, and a guess about which income limit applies.

**After:** one profile, a per-program verdict with the test that produced it, the dollar amount
only where a source states one, and a list of the questions to ask before counting on it.

## What we built

A Next.js prototype with three parts:

1. **A seven-step onboarding profile.** Money, household, work and school, current housing,
   property preferences, location, and optional assistance questions. Optional fields can be
   skipped, every sensitive or unusual question carries a one-line explanation, and the review page
   lists every incomplete field with a link back to it.
2. **A configurable eligibility engine.** Each program is a rule set: income at a percentage of
   area median, first-time buyer with a program-specific lookback, occupation, employment status,
   student status, military service, current housing, property type, city, price, household size,
   and several more. Tests that cannot be evaluated return **unknown**, not a guess.
3. **Property-specific affordability.** The profile's monthly budget, down payment and the
   assistance that passed every check are applied to a home's price, taxes, insurance and HOA.
   Results show the monthly cost, how far it sits from the buyer's own comfort line, and which
   programs apply to that specific home.

The catalog has 17 entries across federal, state, county, city, profession, employer, institution,
veteran, nonprofit and community-development categories. Eleven categories are represented; the
property-specific category is deliberately empty because no property-level incentive was verified.

**Demo video:** add the link on the hub
**Live demo:** optional

## How Claude is used

- The prototype, program catalog, rules engine, schema and copy were built in one session with
  Claude, against the event's ground rules.
- **At runtime the tool sends nothing to an AI model.** Eligibility is deterministic and
  inspectable: the same answers produce the same verdict, and every test prints its reasoning.
  That was a deliberate choice for a tool that touches housing eligibility.
- A person still checks every program against its source. The tool marks exactly where that check
  is needed.

## Try it

Requires **Node.js 24 or newer** (the app uses the built-in `node:sqlite` module). No API keys and
no environment variables.

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. The local database is created at `.data/fundit.db` and is ignored
by git.

Production check:

```bash
npm run typecheck
npm run build
npm start
```

The matching API is available at `GET /api/match`; add `?listing=syn-01` to evaluate one synthetic
home.

## Sources and assumptions

| Item | Source or assumption | Date checked |
|---|---|---|
| Orange County median income ($138,600 for 4; $97,000–$182,950 by household size) | HCD 2026 State Income Limits, revised June 23, 2026, [PDF](https://www.hcd.ca.gov/sites/default/files/docs/grants-and-funding/income-limits-2026.pdf) | Nov 7, 2026 |
| Income tests at 80%/120% of AMI | Computed from the published Orange County median row, rounded to $50. Each program still uses its own table; where the table was not loaded the test is unknown. | Nov 7, 2026 |
| 30-year fixed rate 7.18% | Freddie Mac PMMS / FRED `MORTGAGE30US`, observation 2026-11-05, as recorded in the event data list | Nov 6, 2026 |
| CalHFA MyHome: up to 3.5% (FHA) / 3% (conventional) | [CalHFA programs](https://www.calhfa.ca.gov/homebuyer/programs/), [MyHome page](https://www.calhfa.ca.gov/homebuyer/programs/myhome.htm), 2025 lender deck | Nov 6–7, 2026 |
| CalHFA Dream For All: up to 20%, cap $150,000, voucher + drawing, first-generation buyers | [CalHFA Dream For All](https://calhfa.ca.gov/dream/) | Nov 6, 2026 |
| CalHFA 2026 income limits: Orange County **$274,000** (all first and subordinate mortgages) and **$219,000** (Dream For All) | [First/subordinate limits](https://www.calhfa.ca.gov/homeownership/limits/income/income.pdf), [Dream For All limits](https://www.calhfa.ca.gov/homeownership/limits/income/income-cadfa.pdf), effective June 30, 2026 | Nov 7, 2026 |
| CalHFA ZIP, MCC, CalHome, state HOME, CDBG, WISH, AHP | Program pages listed in [`lanes/3-fund-it/data/DATA-SOURCES.md`](lanes/3-fund-it/data/DATA-SOURCES.md); existence confirmed, terms not loaded | Nov 6, 2026 |
| Santa Ana My First Home; Garden Grove first-time buyer program | City pages; only existence confirmed. Dollar tiers seen in search snippets are **not** used. | Nov 6, 2026 |
| VA home loan | [VA home loans](https://www.va.gov/housing-assistance/home-loans/); existence only, terms not loaded | Nov 7, 2026 |
| Property tax 1.0% of price per year | **ASSUMPTION**, following the event data list's guidance to use about 1% plus local assessments and label it | Nov 6, 2026 |
| Homeowners insurance 0.35% of price per year | **ASSUMPTION**. No Orange County premium was verified. | Nov 7, 2026 |
| Housing cost capped at 30–35% of gross income; total debt at 45% | **ASSUMPTION (orientation)**. H&SC 50052.5 uses program-specific percentages; the exact table was not read. | Nov 7, 2026 |
| $0 down when the buyer leaves the down payment blank | **ASSUMPTION**, stated on screen rather than inventing a down payment | Nov 7, 2026 |
| Every listing price, size, HOA and year | **SYNTHETIC**. Not a real home, address, parcel or market price. | Nov 7, 2026 |

### A conflict we show instead of resolving

CalHFA's October 2025 lender-training deck describes a **School Teacher and Employee Assistance
Program** for K-12 public school staff, while a 2026 third-party guide says the separate teacher
program ended in 2020 and was folded into MyHome. The catalog keeps the program as
**unverified / availability not confirmed**, shows no dollar amount, and tells the user to confirm
with CalHFA. It does not quietly pick a side.

## What is real and what is mocked

| Part | Status |
|---|---|
| Seven-step onboarding, skip paths, save/resume, incomplete-field review | Working |
| Relational profile schema (12 tables) and session-scoped persistence | Working |
| Eligibility engine with per-requirement verdicts and open questions | Working |
| HCD 2026 Orange County median-income table and AMI computation | Working, sourced |
| CalHFA MyHome / Dream For All terms, caps and Orange County income limits | Working, sourced |
| Other program terms (city loan amounts, WISH grants, VA, ZIP, MCC) | Not loaded: shown as unknown |
| Affordability math (P&I, taxes, insurance, HOA, max price) | Working, assumptions labeled |
| Property recommendations | Working, but against **synthetic** listings |
| Real listings feed or MLS integration | Not built. Public listing sources were checked; see [docs/LISTING-SOURCES.md](docs/LISTING-SOURCES.md). |
| Accounts, login, production authorization | Not built (anonymous browser session only) |
| Application submission, emails, city contact | Deliberately not built |

## Where it gets things wrong

- **Program rules are incomplete.** Most catalog entries confirm that a program exists, not its
  current income limit, loan amount or availability. The engine says so instead of filling gaps.
- **The income table is one table.** HCD publishes separate category rows and a separate State HOME
  table; HUD publishes its own limits. Using the median row keeps the percentage test transparent,
  but a program's own table is what governs.
- **The CalHFA limits are flat county limits, not size-adjusted.** $274,000 and $219,000 apply to
  the whole county as published; they are not multiplied by household size. Programs with their
  own size-adjusted tables are still open questions here.
- **First-time buyer definitions vary.** Without a program's lookback, a prior owner gets
  "unknown", not a false yes or no.
- **Affordability is not underwriting.** It ignores credit, reserves, lender overlays, mortgage
  insurance, HOA special assessments and local tax nuances.
- **The listings are invented.** The math is real; the homes are not. No address, parcel or APN is
  used anywhere. See [docs/LISTING-SOURCES.md](docs/LISTING-SOURCES.md) for why a public feed was
  not connected.
- **No AI at runtime.** That is a feature for auditability, not a limitation we are hiding.

## Next steps

- Load each program's current income table and loan terms as a dated, versioned record, and show a
  staleness warning when a round closes.
- Replace the synthetic listings file with a licensed or keyed feed (an MLS/broker export or
  RentCast) and keep the same per-home evaluation. See
  [docs/LISTING-SOURCES.md](docs/LISTING-SOURCES.md).
- Add a counselor view: one screen that prints the tests, sources and open questions for a client.
- Add Spanish-language copy and a plain-language mode.
- Wire a "call script" that drafts the questions to ask each administrator — without sending it.

## Data and privacy

This project uses only public or provided data. It contains no personal information about real
tenants, buyers or residents. The onboarding warns users not to enter real personal or financial
information. It does not file applications, send messages, or contact any city or person. The
anonymous session cookie exists only to keep one demo profile separate from another on the same
browser; it is not authentication.

## License

MIT, see [`LICENSE`](LICENSE).
