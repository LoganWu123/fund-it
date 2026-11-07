import json
import sqlite3
import tempfile
import unittest
from pathlib import Path
from export_map_locations import export_locations


class MapLocationTests(unittest.TestCase):
    def test_only_existing_ids_with_valid_source_coordinates_are_exported(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            db, data, out = root/'data.sqlite', root/'listings.js', root/'locations.js'
            conn = sqlite3.connect(db)
            conn.execute('CREATE TABLE listings(source_id TEXT, latitude REAL, longitude REAL)')
            conn.executemany('INSERT INTO listings VALUES(?,?,?)', [
                ('good',33.72,-117.83),('unknown',None,-117.83),
                ('invalid',0,0),('retired',33.72,-117.83)])
            conn.commit()
            conn.close()
            data.write_text('window.FUNDIT_DATA = '+json.dumps({'listings':[{'id':i} for i in ['good','unknown','invalid']]})+';\n')
            result = export_locations(db, data, out)
            self.assertEqual(result, {'good':[33.72,-117.83]})
            self.assertIn('window.FUNDIT_LOCATIONS', out.read_text())


if __name__ == '__main__':
    unittest.main()
