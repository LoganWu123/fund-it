#!/usr/bin/env python3
"""Import freely reusable Orange County sale records; never infer availability."""
import argparse
import csv
import hashlib
import json
import sqlite3
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = 'https://realestatedataset.com/california/orange-county'
LICENSE = 'https://realestatedataset.com/license'

def number(value):
    if value is None or not value.strip():
        return None
    return float(value.replace(',', ''))

def run(csv_path, db_path, as_of):
    # Caller supplies the edition date; retrieval time is not the data date.
    datetime.strptime(as_of, '%Y-%m')
    db_path.parent.mkdir(parents=True, exist_ok=True)
    fetched = datetime.now(timezone.utc).isoformat()
    digest = hashlib.sha256()
    with csv_path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(chunk)
    conn = sqlite3.connect(db_path)
    conn.execute('PRAGMA foreign_keys=ON')
    conn.executescript('''
    CREATE TABLE IF NOT EXISTS import_runs (
        id INTEGER PRIMARY KEY, source_url TEXT NOT NULL, license TEXT NOT NULL,
        license_url TEXT NOT NULL, data_as_of TEXT NOT NULL, retrieved_at TEXT NOT NULL,
        sha256 TEXT NOT NULL, summary_json TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS listings (
        source_id TEXT PRIMARY KEY, street TEXT NOT NULL, unit TEXT, city TEXT NOT NULL,
        state TEXT NOT NULL, zip TEXT, county_fips TEXT NOT NULL,
        latitude REAL, longitude REAL, property_type TEXT, bedrooms REAL, bathrooms REAL,
        square_feet REAL, list_price REAL CHECK(list_price > 0), hoa_fee REAL,
        source_status TEXT NOT NULL, listing_type TEXT NOT NULL,
        availability TEXT NOT NULL DEFAULT 'unverified_snapshot',
        data_as_of TEXT NOT NULL, retrieved_at TEXT NOT NULL,
        source_url TEXT NOT NULL, import_run_id INTEGER NOT NULL REFERENCES import_runs(id));
    CREATE INDEX IF NOT EXISTS listings_search ON listings(city, list_price, bedrooms);
    CREATE TABLE IF NOT EXISTS listing_observations (
        source_id TEXT NOT NULL, import_run_id INTEGER NOT NULL REFERENCES import_runs(id),
        status TEXT, listing_type TEXT, list_price REAL,
        PRIMARY KEY(source_id, import_run_id));
    ''')
    stats, statuses, types = Counter(), Counter(), Counter()
    required = {'id','street','city','state','zip','county_fips','status','listing_type','list_price','beds','baths','sqft'}
    try:
        with conn:
            run_id = conn.execute('INSERT INTO import_runs(source_url,license,license_url,data_as_of,retrieved_at,sha256,summary_json) VALUES(?,?,?,?,?,?,?)',
                (SOURCE,'CC0-1.0',LICENSE,as_of,fetched,digest.hexdigest(),'{}')).lastrowid
            # Superseded records are not allowed to remain candidates if absent from the new edition.
            conn.execute("UPDATE listings SET availability='not_in_latest_snapshot'")
            with csv_path.open(newline='', encoding='utf-8-sig') as stream:
                reader = csv.DictReader(stream)
                missing = required - set(reader.fieldnames or [])
                if missing:
                    raise ValueError(f'Source schema changed; missing: {sorted(missing)}')
                for row in reader:
                    stats['rows_read'] += 1
                    status, kind = row['status'].strip().lower(), row['listing_type'].strip().lower()
                    statuses[status] += 1
                    types[kind] += 1
                    if row['state'] != 'CA' or row['county_fips'] != '06059':
                        stats['outside_area'] += 1
                        continue
                    # The source documents active as its listing status; special listing_type is not sale/rent tenure.
                    # Preserve source claims without treating them as verified current availability.
                    if status != 'active' or kind == 'coming_soon':
                        stats['not_for_sale'] += 1
                        continue
                    try:
                        price = number(row['list_price'])
                        if not row['id'] or not row['street'] or not row['city'] or price is None or price <= 0:
                            raise ValueError('Incomplete identity or price')
                        vals = (row['id'],row['street'],row.get('unit'),row['city'],row['state'],row['zip'],row['county_fips'],
                            number(row.get('lat')),number(row.get('lng')),row.get('property_type'),number(row.get('beds')),
                            number(row.get('baths')),number(row.get('sqft')),price,number(row.get('hoa_fee')),status,kind,
                            'unverified_snapshot',as_of,fetched,SOURCE,run_id)
                    except (ValueError, TypeError):
                        stats['invalid_rows'] += 1
                        continue
                    conn.execute('INSERT OR REPLACE INTO listings VALUES('+','.join('?' for _ in vals)+')',vals)
                    conn.execute('INSERT OR REPLACE INTO listing_observations VALUES(?,?,?,?,?)',(row['id'],run_id,status,kind,price))
                    stats['imported_rows'] += 1
            summary = dict(stats, source_status_counts=dict(statuses), listing_type_counts=dict(types),
                unique_candidates=conn.execute("SELECT count(*) FROM listings WHERE availability='unverified_snapshot'").fetchone()[0],
                data_as_of=as_of, source=SOURCE, license='CC0-1.0', sha256=digest.hexdigest())
            conn.execute('UPDATE import_runs SET summary_json=? WHERE id=?',(json.dumps(summary),run_id))
        return summary
    finally:
        conn.close()

if __name__ == '__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--csv',type=Path,default=ROOT/'data/orange-county.csv')
    p.add_argument('--db',type=Path,default=ROOT/'data/listings.sqlite')
    p.add_argument('--as-of',required=True,help='Publisher edition month YYYY-MM')
    a=p.parse_args()
    result=run(a.csv,a.db,a.as_of)
    (ROOT/'data/import-report.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result,indent=2))
