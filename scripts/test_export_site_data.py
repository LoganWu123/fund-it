import csv
import json
import tempfile
import unittest
from pathlib import Path

from export_site_data import export_site_data
from import_listings import run


class ExportSiteDataTests(unittest.TestCase):
    def test_export_writes_window_payload(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            csv_path, db_path, out_path = root / 'in.csv', root / 'listings.sqlite', root / 'listings.js'
            columns = ['id', 'street', 'city', 'state', 'zip', 'county_fips', 'status', 'listing_type', 'list_price', 'beds', 'baths', 'sqft']
            row = ['1', '1 Main St', 'Santa Ana', 'CA', '92701', '06059', 'active', '', '500000', '2', '1', '1000']
            with csv_path.open('w', newline='') as stream:
                writer = csv.writer(stream)
                writer.writerow(columns)
                writer.writerow(row)
            run(csv_path, db_path, '2026-10')
            payload = export_site_data(db_path, out_path)
            self.assertEqual(payload['count'], 1)
            self.assertEqual(payload['data_as_of'], '2026-10')
            self.assertEqual(payload['license'], 'CC0-1.0')
            text = out_path.read_text(encoding='utf-8')
            prefix = 'window.FUNDIT_DATA = '
            self.assertTrue(text.startswith(prefix))
            self.assertTrue(text.endswith(';\n'))
            data = json.loads(text[len(prefix):-2])
            self.assertEqual(data['listings'][0]['city'], 'Santa Ana')
            self.assertEqual(data['listings'][0]['price'], 500000)
            self.assertEqual(data['listings'][0]['bedrooms'], 2)


if __name__ == '__main__':
    unittest.main()
