import csv
import sqlite3
import tempfile
import unittest
from pathlib import Path
from import_listings import run

class ImportTests(unittest.TestCase):
    def test_filter_upsert_and_retire(self):
        with tempfile.TemporaryDirectory() as tmp:
            path,db=Path(tmp)/'input.csv',Path(tmp)/'listings.sqlite'
            cols=['id','street','city','state','zip','county_fips','status','listing_type','list_price','beds','baths','sqft']
            base=['1','1 Main St','Santa Ana','CA','92701','06059','active','','500000','2','1','1000']
            rows=[base,base,base[:6]+['sold']+base[7:],['2']+base[1:7]+['coming_soon']+base[8:],['3']+base[1:5]+['06037']+base[6:]]
            def write(items):
                with path.open('w',newline='') as f:
                    writer=csv.writer(f);writer.writerow(cols);writer.writerows(items)
            write(rows)
            self.assertEqual(run(path,db,'2026-10')['unique_candidates'],1)
            self.assertEqual(run(path,db,'2026-10')['unique_candidates'],1)
            write([base[:6]+['sold']+base[7:]])
            self.assertEqual(run(path,db,'2026-11')['unique_candidates'],0)
            with sqlite3.connect(db) as c:
                self.assertEqual(c.execute('select availability from listings').fetchone()[0],'not_in_latest_snapshot')
    def test_schema_failure_rolls_back(self):
        with tempfile.TemporaryDirectory() as tmp:
            path,db=Path(tmp)/'bad.csv',Path(tmp)/'db.sqlite'
            path.write_text('id,street\n1,Main\n')
            with self.assertRaises(ValueError):run(path,db,'2026-10')
            with sqlite3.connect(db) as c:self.assertEqual(c.execute('select count(*) from import_runs').fetchone()[0],0)

if __name__=='__main__':unittest.main()
