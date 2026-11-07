#!/usr/bin/env python3
"""Export source coordinates for existing static listings; never geocode or infer."""
import argparse
import json
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def export_locations(db_path, listings_path=None, out_path=None):
    listings_path = Path(listings_path or ROOT / 'dist/listings.js')
    out_path = Path(out_path or ROOT / 'dist/listing-locations.js')
    text = listings_path.read_text(encoding='utf-8')
    payload = json.loads(text.split('=', 1)[1].strip().rstrip(';'))
    ids = {row['id'] for row in payload['listings']}
    conn = sqlite3.connect(Path(db_path).resolve().as_uri() + '?mode=ro', uri=True)
    try:
        rows = conn.execute('SELECT source_id, latitude, longitude FROM listings').fetchall()
    finally:
        conn.close()
    # Sanity bounds only; they are not an assertion of county boundaries.
    locations = {key: [round(lat, 6), round(lng, 6)] for key, lat, lng in rows
                 if key in ids and lat is not None and lng is not None
                 and 33.3 <= lat <= 34.05 and -118.15 <= lng <= -117.35}
    out_path.write_text('/* Source-provided coordinates; no inferred addresses. October 2026 snapshot. */\n'
                        'window.FUNDIT_LOCATIONS = ' + json.dumps(locations, separators=(',', ':')) + ';\n', encoding='utf-8')
    return locations


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--db', type=Path, default=ROOT / 'data/listings.sqlite')
    args = parser.parse_args()
    print(f'Exported {len(export_locations(args.db)):,} source locations')
