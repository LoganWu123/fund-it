#!/usr/bin/env python3
"""Export active listing candidates to dist/listings.js for the static site."""
import argparse
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def clean_number(value):
    if value is None:
        return None
    if isinstance(value, float) and value.is_integer():
        return int(value)
    return value


def export_site_data(db_path=None, out_path=None):
    db_path = Path(db_path or ROOT / 'data/listings.sqlite')
    out_path = Path(out_path or ROOT / 'dist/listings.js')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        run = conn.execute("""
            SELECT data_as_of, retrieved_at, source_url, license
            FROM import_runs
            ORDER BY id DESC
            LIMIT 1
        """).fetchone()
        rows = conn.execute("""
            SELECT source_id AS id, street, unit, city, zip,
                   property_type, bedrooms, bathrooms, square_feet,
                   list_price AS price, hoa_fee AS hoa, listing_type,
                   source_status AS status
            FROM listings
            WHERE availability = 'unverified_snapshot' AND list_price > 0
            ORDER BY list_price ASC
        """).fetchall()
        listings = []
        for row in rows:
            item = {key: row[key] for key in row.keys()}
            for key in ('street', 'unit', 'city', 'zip', 'property_type', 'listing_type', 'status'):
                if isinstance(item.get(key), str):
                    item[key] = item[key].strip()
            for key in ('bedrooms', 'bathrooms', 'square_feet', 'price', 'hoa'):
                item[key] = clean_number(item[key])
            listings.append(item)
        payload = {
            'schema_version': 1,
            'generated_at': datetime.now(timezone.utc).isoformat(),
            'data_as_of': run['data_as_of'] if run else None,
            'retrieved_at': run['retrieved_at'] if run else None,
            'source': run['source_url'] if run else None,
            'license': run['license'] if run else None,
            'count': len(listings),
            'listings': listings,
        }
    finally:
        conn.close()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    body = json.dumps(payload, separators=(',', ':'), ensure_ascii=False)
    out_path.write_text(f'window.FUNDIT_DATA = {body};\n', encoding='utf-8')
    return payload


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--db', type=Path, default=ROOT / 'data/listings.sqlite')
    parser.add_argument('--out', type=Path, default=ROOT / 'dist/listings.js')
    args = parser.parse_args()
    payload = export_site_data(args.db, args.out)
    print(json.dumps({'count': payload['count'], 'data_as_of': payload['data_as_of'], 'out': str(args.out)}, indent=2))
