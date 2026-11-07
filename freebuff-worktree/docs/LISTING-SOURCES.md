# Listing sources for FundIt! OC

**Checked:** November 7, 2026. **Status:** research note, not a data feed.

This note records the listing-level sources checked for the prototype, what each one permits, and
why the demo still uses synthetic homes. It complements the aggregate market sources in
[`lanes/3-fund-it/data/DATA-SOURCES.md`](../lanes/3-fund-it/data/DATA-SOURCES.md).

## Short answer

No free, public, current, feature-complete database of Orange County homes for sale was found.

- **HUD FHA REO open data** is public and reusable, but the 06/2026 snapshot has **two Orange
  County rows**, and it publishes no price, beds, baths, square feet, HOA, property type or
  listing status.
- **Facebook Marketplace** has no public read API. Meta's terms prohibit automated collection
  outside its Platform APIs, and the Marketplace partner program is for approved partners
  publishing their own inventory.
- **Reddit** has an approved Data API, but it is not a structured listing database. Posts are
  sparse, often rentals or questions, and can contain personal information.
- **A licensed MLS/broker export or a commercial API such as RentCast** is the practical way to
  get real active listings.

Until one of those is connected, [`lib/data/listings.ts`](../lib/data/listings.ts) remains
synthetic and is labelled as such in the UI.

## What was checked

| Source | What it provides | Access and terms | Orange County fit | Verdict |
|---|---|---|---|---|
| [HUD FHA Single Family REO open data](https://catalog.data.gov/dataset/fha-single-family-reo-properties-for-sale) ([ArcGIS](https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/SF_REO/FeatureServer/0)) | Address, city, ZIP, case number, coordinates and acquisition dates for FHA REO homes | Public CSV/XLSX/GeoJSON download and REST service; quarterly; coverage 06/2026; last updated 2026-07-21 | **622 rows nationwide, 19 in California, 2 in Orange County** (Brea 92821 and Huntington Beach 92647). No price, beds, baths, square feet, HOA, property type or status | Public and reusable, but too thin and stale to drive affordability. **Not used.** |
| [HUD Home Store](https://www.hudhomestore.gov/) | Current HUD REO search | Public website; `robots.txt` is `User-agent: *` / `Disallow: /` | Current inventory, but no permitted automated access | Do not scrape. Use the open-data snapshot above or check manually. |
| [USDA RD/FSA resales](https://properties.sc.egov.usda.gov/resales/public/home) | Rural REO resales | Public search; downloadable REO dataset dated 2017/2018; no documented API | Rural-only; no Orange County inventory expected | Not a fit. |
| [VA REO / VRM Properties](https://www.vrmproperties.com/) | VA-owned home search | Public map and search; robots allows most paths (disallows `/Auth`, `/Error`, `/User`, `/Lead`); no documented API; site terms still apply | Some California inventory; no feed | Manual lead only; do not automate without permission. |
| [Freddie Mac HomeSteps](https://www.homesteps.com/) | Freddie Mac REO search | Public site; no open data; a third-party index showed about 28 California listings on the check date (not official) | Sparse; not a complete Orange County feed | Manual lead only. |
| [Fannie Mae HomePath](https://homepath.fanniemae.com/) | Fannie Mae REO search | Public site; account and download terms; a third-party index showed about 99 California listings (not official) | Sparse; not a complete Orange County feed | Manual lead only. |
| [GSA Auctions](https://disposal.gsa.gov/), [GovDeals](https://www.govdeals.com/), [Public Surplus](https://www.publicsurplus.com/) | Government surplus auctions | Public auction sites; terms vary | Mostly equipment and land; occasional homes; not a home-search database | Not a listing feed. |
| [Orange County Treasurer-Tax Collector](https://www.octreasurer.com/) / [Bid4Assets](https://www.bid4assets.com/) | Tax-defaulted property auctions | Public, periodic; last auction June 2025; next not posted at check | Mostly land and timeshares; not current for-sale homes | Not a listing feed. |
| [RentCast](https://www.rentcast.io/api) | Active sale and rental listings nationwide | Commercial API; key required; free tier reported at 50 calls per month at check; confirm current terms | Can query Orange County by city or ZIP; coverage not independently verified | **Best turnkey option** if the team creates a key. |
| [ATTOM](https://www.attomdata.com/) | Property and listing data | Commercial; active listings require an MLS license; reported from about $500 per month; confirm quote | Comprehensive with a license | Too expensive for a one-day prototype. |
| [CRMLS](https://www.crmls.org/) | MLS listings | Licensed MLS; data-license agreement; API access through `api@crmls.org` or `licensing@crmls.org` | Comprehensive Orange County inventory | **Best data if a team member has MLS access**, subject to the license. |
| [Zillow Research](https://www.zillow.com/research/data/), [Redfin Data Center](https://www.redfin.com/news/data-center/), [Realtor.com](https://www.realtor.com/) | Aggregate market data; public listing pages | No reuse of listing content; Zillow and Redfin research downloads are aggregate; terms prohibit automated queries | Aggregates only; no listing-level feed | View-only. Use the aggregate downloads already listed in `DATA-SOURCES.md`. |
| [Facebook Marketplace](https://www.facebook.com/marketplace/) | Consumer listings | No public read API. [Meta's automated data collection policy](https://developers.facebook.com/docs/development/terms-and-policies/automated-data-collection) allows programmatic access only through Platform APIs; scripts outside them violate Terms 3.2.3. The [Marketplace Platform](https://developers.facebook.com/docs/marketplace/) partner program is for approved partners publishing their own inventory | Mostly rentals, FSBO and duplicate posts; no MLS status | **Prohibited as a feed. Do not scrape or ingest.** |
| [Reddit](https://www.reddit.com/) | Community posts | [Data API Terms](https://www.redditinc.com/policies/data-api-terms): OAuth, approval, rate limits; free for approved non-commercial use; commercial use needs written approval and a contract; the user-content license is limited to running the app, with deletion obligations. The [Responsible Builder Policy](https://support.reddithelp.com/hc/en-us/articles/42728983564564) prohibits scraping and unapproved commercialization | Unstructured; sparse for-sale posts; possible names and phone numbers (personal information) | **Not a listing feed.** A separate, approved qualitative research use is possible; not used here. |

## Why the demo still uses synthetic listings

- HUD's public dataset has two Orange County rows and no price or property attributes, so it cannot
  drive the affordability calculation.
- Facebook Marketplace is prohibited by Meta's terms and has no public read API.
- Reddit is not a listing database and carries user-content and personal-information risk.
- RentCast and MLS access need a key or a license the team does not have yet.
- Every synthetic listing is labelled in [`lib/data/listings.ts`](../lib/data/listings.ts); no
  address, parcel or APN is invented.

## If a real feed is added

1. Store provenance with every listing: source name, source URL, retrieval date, coverage date,
   license or terms note, and a `synthetic` flag.
2. Fetch server-side only. Keep API keys in environment variables, never in the client bundle or
   git.
3. Respect rate limits, caching rules and display or redistribution limits in the source's terms.
4. Show the source and check date in the UI, and warn when the snapshot is stale.
5. Do not store personal information, and do not collect protected characteristics for ranking or
   steering.
6. Keep synthetic and real listings distinguishable; never mix them silently.

## Sources and check dates

HUD's dataset and fields were fetched November 7, 2026. Meta's automated-data-collection policy,
the Marketplace Platform documentation, Reddit's Data API Terms and the Responsible Builder Policy
were read the same day. RentCast pricing, ATTOM pricing and the third-party REO counts are leads,
not verified contract terms; confirm them before relying on them.
