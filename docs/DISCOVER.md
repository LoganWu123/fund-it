# Discover Homes, local agents and map

Branch: `codex/discover-homes`. The existing dashboard, calculator, funding, buyer profiles and listings remain available.

## Run and rebuild

The checked-in `dist/` is self-contained application code. Serve it with `python3 -m http.server 8010 --bind 127.0.0.1 --directory dist` and open `http://127.0.0.1:8010/#discover`. Photos, map tiles and web fonts require internet access.

Magic UI was installed using the requested shadcn registry commands for `@magicui/text-animate` and `@magicui/icon-cloud`, plus `@magicui/globe` from the supplied screenshot. Sources are in `ui/src/components/ui/`. `ui/src/main.tsx` mounts React islands into the static dashboard; esbuild emits `dist/enhancements.js` and scoped CSS. No framework migration is required. Node 22+ and pnpm are needed only to rebuild: `cd ui && pnpm install --frozen-lockfile && pnpm run build`. The lockfile is tracked; node_modules is ignored. `pnpm-workspace.yaml` explicitly allows esbuild's install script.

## Homes and saved collections

- Seven distinct homes have exact-address source photographs. Galleries are enabled when multiple photos were checked. Failed photos remove the home from the current deck instead of substituting another property or a graphic house.
- Swipe left/pass, swipe right/save, or use buttons and focused-card arrow keys. Undo reverses the last swipe. Homes and real agents share Saved; choices persist in browser localStorage. Map saves use the same collection.
- Filters: city, budget, minimum beds and baths, home type and maximum monthly HOA. Budget/city/beds/baths/type restrict the deck; HOA influences the preference score so unknown HOA is not treated as zero. Existing buyer-profile preferences can be applied.
- Residential candidates are deduplicated by address, with photo-backed records preferred. Auction/foreclosure/bank-owned records, prices below $50,000 and researched sold/off-market properties are excluded from Discover. Source facts and tenure still require confirmation.
- Home details retain affordability assumptions and official program research links. Opening the calculator resets committed subsidy to zero so an unconfirmed award does not reduce the gap.
- No emails, texts, applications or agent inquiries are sent.

## Exact-property photos

Observed November 7, 2026. All enabled image URLs returned HTTP 200 with image content types during verification. `dist/property-photos.js` records the complete direct URLs, galleries, attribution, address matching and source links. These are listing photographs of the named property, not stock or generated homes.

| Property | Source |
| --- | --- |
| 306 Orange Blossom, Irvine | [Active Realty / CRMLS](https://www.activerealty.com/property-search/detail/10/NP26164643/306-orange-blossom-irvine-ca-92618/) |
| 146 Orchard, Irvine | [LuxurySoCalRealty / CRMLS](https://www.luxurysocalrealty.com/idx/146-orchard-irvine-ca-92618/1807026406_spid/) |
| 2607 W Olive Ave, Fullerton | [The Ora Group / CRMLS](https://www.theoragroup.com/property-search/detail/10/IV26169415/2607-w-olive-ave-fullerton-ca-92833/) |
| 3311 W Lincoln Ave #12, Anaheim | [Realtor.com / CRMLS](https://www.realtor.com/realestateandhomes-detail/3311-W-Lincoln-Ave-Apt-12_Anaheim_CA_92801_M24708-00790) |
| 400 S Flower St Unit 74, Orange | [Realtor.com / CRMLS](https://www.realtor.com/realestateandhomes-detail/400-S-Flower-St-Unit-74_Orange_CA_92868_M12171-46666) |
| 119 Wild Rose, Lake Forest | [Realtor.com / CRMLS](https://www.realtor.com/realestateandhomes-detail/119-Wild-Rose_Lake-Forest_CA_92630_M11548-61669) |
| 7215 Apricot Dr, Irvine | [Realtor.com / CRMLS](https://www.realtor.com/realestateandhomes-detail/7215-Apricot-Dr_Irvine_CA_92618_M21261-34112) |

Source pages can be cached and prices may differ from the October snapshot; availability is not guaranteed. Known sold/off-market research for 40 Tangerine, 905 S Ross St and 2155 W Banbury Cir remains disabled. 4318 Silver Dr was withdrawn and 1111 E 1st St sold, so neither was added as an available choice. Model-home photos for 154 Balsawood were not used as exact-property images.

The three fictional project cards use representative photographs instead of SVG houses. The overview explains that these photos are not documentation of those fictional projects. Photos remain remotely hosted with provider attribution; their rights do not inherit the source CSV's CC0 license. `displayEnabled` is configuration, not a claim of redistribution rights. Ongoing public use should use provider-authorized image access or an approved listing feed.

## Real local agents

`dist/local-agents.js` replaces the fictional card dataset with public professional profiles and their actual published profile photos. The old generated demo portrait files are unused. Curated profiles have at least 4.5 stars and 10 reviews; users can filter by area and minimum review score. Profiles sort by review score, then review count. No invented reviews or response-time promises are displayed.

Public Realtor.com profile values observed November 7, 2026 (source pages may be cached):

| Profile | Review score | Reviews | Source-reported experience | Source-reported recent sales |
| --- | --- | --- | --- | --- |
| [Paul Young](https://www.realtor.com/realestateagents/56c631c2bb954c01006c55ac) | 5.0/5 | 106 | 22 years | 7 |
| [Charisse Okamoto](https://www.realtor.com/realestateagents/56cbfd440fa4170100774db7) | 5.0/5 | 95 | 17 years | 23 |
| [Cathy Haney](https://www.realtor.com/realestateagents/56cc614689a68901006f5455) | 5.0/5 | 42 | 38 years reported | 9 |
| [Irene & Ricky Zhang (team)](https://www.realtor.com/realestateagents/59e62e4a9023360010b0491b) | 4.8/5 | 19 | 11 years | 50 |

The source's activity section covers the last 24 months; these are not annual performance figures. Cathy Haney's profile headline reports 38 years while biography prose says over 20; the UI attributes experience to the profile. Source aggregates are not independently audited transaction outcomes or proof of service quality. Details link to the full review history and California DRE lookup, and offer concrete expectations for references, fees and communication. No active-license check has been completed. No protected characteristic is used to rank agents or homes.

## Map and preference stars

Leaflet 1.9.4 is bundled locally with its license; tiles and attribution use OpenStreetMap. The map starts with the seven photo-backed homes. Toggle the photo filter off to explore the wider snapshot. At most 220 pins are rendered in the viewport and 25 list results at a time; zooming and panning reveal more. Coordinates are source values, not inferred city centroids. No browser geolocation is requested.

`dist/listing-locations.js` contains 12,982 source coordinates corresponding to exported listing IDs. A broad latitude/longitude sanity range excludes absent/outlying points; it is not an asserted county boundary. Residential, deduplication and researched availability exclusions further reduce map candidates. Regenerate after the main listing export with:

```sh
python3 scripts/export_map_locations.py --db data/listings.sqlite
```

`dist/match-engine.js` returns a score from 0 to 5 and an explanatory breakdown. Weights: budget 35, selected city 25, minimum beds 15, minimum baths 10, home type 10, HOA 5. Unselected criteria do not count. Missing data is excluded from the denominator; coverage is shown. Numeric fit falls proportionally below minimum beds/baths. Budget and HOA receive full fit within the ceiling and linearly decrease to zero at twice the ceiling; a zero-HOA preference only matches a known zero. City/type are exact matches. Selected criteria are normalized to 5 stars. These are documented product weights, not research-validated market or property-quality scores.

Pins can include homes over budget or outside the preferred city so comparisons remain visible. Scores respond to preferences without implying inspection quality, eligibility, funding, neighborhood demographics or loan approval.

## Verification and hosting

Validation: Python importer/exporter tests, coordinate-integrity test, ten match-engine assertions, TypeScript checking, production bundle build and browser checks for real images, galleries, map ratings/popups/saving, review details, persistence, animation pause, mobile layout and console errors.

The retained project ID in `.openai/hosting.json` returned `Sites project not found` through the current Sites connection. Its identity was preserved; no replacement Site or deployment is claimed. The local preview and feature branch are the deliverables until hosting access is restored.
