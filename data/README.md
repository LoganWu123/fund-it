# Orange County listing import

Downloaded from https://realestatedataset.com/california/orange-county on November 7, 2026. Publisher edition: October 2026. License: CC0-1.0, as stated at https://realestatedataset.com/license. Publisher describes monthly releases lagging live data by about 30–60 days; this is not a live MLS feed. The importer uses the free downloadable dataset rather than extracting commercial listing pages.

`listings.sqlite` is a LOCAL SQLite database, not a database connected to the deployed static Site. No buyer information is imported or transmitted. The raw CSV and database are ignored by Git. The versioned `import-report.json` records actual import counts and SHA-256. Initial full import examined 925,083 records and retained 12,995 distinct source-marked active records with positive price and complete identity in California county 06059. Invalid rows, sold, pending, other, off-market and coming-soon categories are excluded. Land and special listing types remain identifiable in the database; records are not all verified residential sale listings.

## Refresh

From the project directory:

```sh
python3 scripts/refresh_listings.py
python3 -m unittest discover -s scripts -p 'test_*.py'
```

Requires Python 3 and curl. Downloads use certificate verification; no keys, subscriptions or logins. Refresh discovers the CSV and edition month from the publisher's county page. Failed imports roll back. Stable source IDs deduplicate imports. Previously observed records absent from a new snapshot are marked `not_in_latest_snapshot`; historical observations and import runs remain.

## Query

```sql
SELECT source_id,street,city,zip,list_price,bedrooms,bathrooms,hoa_fee,
       listing_type,data_as_of,availability
FROM listings
WHERE availability='unverified_snapshot'
  AND property_type IN ('single_family','condo','townhouse','manufactured')
  AND list_price <= :buyer_max_price
  AND bedrooms >= :buyer_selected_bedrooms
ORDER BY list_price;
```

This only produces research candidates, not purchase recommendations. Verify tenure (sale vs rent), availability, price, condition, HOA and financing eligibility before matching. The source does not include a reliable explicit sale/rent field or property-specific public listing URL; source_status and listing_type preserve what the publisher actually reports. Four retained records have prices below $10,000; treat such values as anomalies, not affordable purchase opportunities. Unknown HOA is NULL, never assumed zero. Land, auction and foreclosure records need separate review. No photos or marketing descriptions are copied.

Matching should use buyer-selected budgets, cities, home features and verified program requirements. Do not rank or steer using race, religion, national origin, sex, disability, marital/familial status, neighborhood demographic composition or proxies. Household size may be used only where a specific assistance program requires it; bedroom preferences should be stated by the buyer. The listing database contains no demographic or owner identity data. No matching engine or hosted database has been added by this import.
