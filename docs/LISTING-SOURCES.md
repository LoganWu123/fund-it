# Listing sources for Fund it.

**Checked:** November 7, 2026. **Status:** source review, not a live feed.

The local listing import in this repository uses the **RealEstateDataset Orange County CSV**.
The importer and its query caveats are documented in [`data/README.md`](../data/README.md); this
note records the source choice and the other listing sources that were checked.

## Source used

| Item | Detail |
|---|---|
| Publisher page | [realestatedataset.com/california/orange-county](https://realestatedataset.com/california/orange-county) |
| Edition | October 2026, downloaded November 7, 2026 |
| License | [CC0 1.0 public domain](https://realestatedataset.com/license), checked November 7, 2026 |
| Coverage | Orange County, county FIPS 06059 |
| Records in downloaded CSV | 925,083 |
| Records retained | 12,995 active, positive-price, complete-identity candidates |
| Refresh | `python3 scripts/refresh_listings.py`; importer `scripts/import_listings.py` |
| Static export | `python3 scripts/export_site_data.py` writes `dist/listings.js` for the static site. |
| Not a live feed | Publisher describes monthly releases lagging live data by about 30–60 days |
| Availability | `unverified_snapshot`; the source claims `active`, which is not the same as verified current availability |

The importer keeps the source's status and listing type instead of inferring tenure. It does not
copy photos or marketing descriptions, and it imports no buyer, owner, demographic or
protected-characteristic data. `listings.sqlite` is local only. The static site reads a generated `dist/listings.js` snapshot; it does not query SQLite at runtime.

## Why this source

- It is a free, downloadable, explicitly CC0-licensed file. No scraping, login, API key or
  subscription is involved.
- It has the listing-level fields the prototype needs: address, city, ZIP, price, beds, baths,
  square feet, year built, HOA, property type and coordinates.
- The filter is conservative: California county 06059, `status=active`, positive price, complete
  identity. Sold, pending, other, off-market and coming-soon records are excluded.
- Historical import runs and observations are retained. A record absent from a new snapshot is
  marked `not_in_latest_snapshot`, not silently deleted.

## Other sources checked

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
| [RentCast](https://www.rentcast.io/api) | Active sale and rental listings nationwide | Commercial API; key required; free tier reported at 50 calls per month at check; confirm current terms | Can query Orange County by city or ZIP; coverage not independently verified | A possible keyed next step, not used for this import. |
| [ATTOM](https://www.attomdata.com/) | Property and listing data | Commercial; active listings require an MLS license; reported from about $500 per month; confirm quote | Comprehensive with a license | Too expensive for a one-day prototype. |
| [CRMLS](https://www.crmls.org/) | MLS listings | Licensed MLS; data-license agreement; API access through `api@crmls.org` or `licensing@crmls.org` | Comprehensive Orange County inventory | Best data if a team member has MLS access, subject to the license. |
| [Zillow Research](https://www.zillow.com/research/data/), [Redfin Data Center](https://www.redfin.com/news/data-center/), [Realtor.com](https://www.realtor.com/) | Aggregate market data; public listing pages | No reuse of listing content; Zillow and Redfin research downloads are aggregate; terms prohibit automated queries | Aggregates only; no listing-level feed | View-only. Not used for listing records. |
| [Facebook Marketplace](https://www.facebook.com/marketplace/) | Consumer listings | No public read API. [Meta's automated data collection policy](https://developers.facebook.com/docs/development/terms-and-policies/automated-data-collection) allows programmatic access only through Platform APIs; scripts outside them violate Terms 3.2.3. The [Marketplace Platform](https://developers.facebook.com/docs/marketplace/) partner program is for approved partners publishing their own inventory | Mostly rentals, FSBO and duplicate posts; no MLS status | **Prohibited as a feed. Do not scrape or ingest.** |
| [Reddit](https://www.reddit.com/) | Community posts | [Data API Terms](https://www.redditinc.com/policies/data-api-terms): OAuth, approval, rate limits; free for approved non-commercial use; commercial use needs written approval and a contract; the user-content license is limited to running the app, with deletion obligations. The [Responsible Builder Policy](https://support.reddithelp.com/hc/en-us/articles/42728983564564) prohibits scraping and unapproved commercialization | Unstructured; sparse for-sale posts; possible names and phone numbers (personal information) | **Not a listing feed.** A separate, approved qualitative research use is possible; not used here. |

## Caveats in the current import

- The dataset is a monthly snapshot, not a live MLS feed. It lags by roughly 30–60 days.
- `status=active` is the publisher's claim, not verified current availability. The database stores
  it as `unverified_snapshot`.
- The source has no reliable explicit sale/rent field, and `listing_type` is not tenure.
- Unknown HOA is `NULL`, never assumed zero.
- Four retained records have prices below $10,000; treat them as anomalies, not affordable homes.
- Land, auction, foreclosure, new-construction, FSBO and bank-owned records remain identifiable;
  they are not all verified residential sale listings.
- Prices are list prices, not sale prices. Last-sold price and date are historical.
- The source does not provide a property-specific public listing URL, photos or marketing
  descriptions.

## If another source is added

1. Record the source name, URL, license, edition or coverage date, retrieval date and SHA-256.
2. Keep a stable source ID and an availability status; never infer "active" from a stale row.
3. Fetch server-side only. Keep API keys in environment variables, never in the client bundle or
   git.
4. Respect robots.txt, rate limits and display or redistribution limits.
5. Show the source and check date in the Sources view, and warn when the snapshot is stale.
6. Do not import personal information, owner identity or protected characteristics, and do not use
   them for ranking or steering.
7. Keep the source's own status and listing type distinguishable from a verified sale listing.

## License check

The [RealEstateDataset license page](https://realestatedataset.com/license) states that the
dataset is CC0 1.0 public domain and free to download, use, modify and redistribute, including
commercially. It was checked on November 7, 2026. CC0 requires no attribution; the publisher page
and license URL are recorded anyway.

HUD's open-data page, Meta's automated-data-collection policy, the Marketplace Platform
documentation, Reddit's Data API Terms and the Responsible Builder Policy were checked on
November 7, 2026. RentCast pricing, ATTOM pricing and the third-party REO counts are leads, not
verified contract terms; confirm them before relying on them.
