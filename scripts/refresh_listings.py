#!/usr/bin/env python3
"""Discover the publisher's current free county CSV, download, and import it."""
import re
import subprocess
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse
from import_listings import ROOT, SOURCE, run
import json

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links=[]
    def handle_starttag(self,tag,attrs):
        if tag=='a':
            value=dict(attrs).get('href','')
            if 'county=06059.csv' in value:
                self.links.append(urljoin(SOURCE,value))

def fetch(url, path):
    subprocess.run(['curl','--fail','--location','--proto','=https','--proto-redir','=https',
                    '--retry','2','--max-time','180','--silent','--show-error',
                    '--user-agent','FundItDataImport/1.0','--output',str(path),url],check=True)

if __name__=='__main__':
    data=ROOT/'data'
    data.mkdir(exist_ok=True)
    page=data/'source-page.html'
    fetch(SOURCE,page)
    parser=Links()
    parser.feed(page.read_text())
    if not parser.links:
        raise SystemExit('No county CSV found; publisher schema may have changed.')
    url=parser.links[0]
    if urlparse(url).hostname!='realestatedataset.com':
        raise SystemExit('Unexpected download host; review source before proceeding.')
    match=re.search(r'-(\d{4}-\d{2})\.csv',url)
    if not match:
        raise SystemExit('Edition month missing; refusing to label data with download date.')
    partial=data/'orange-county.csv.partial'
    fetch(url,partial)
    report=run(partial,data/'listings.sqlite',match[1])
    partial.replace(data/'orange-county.csv')
    (data/'import-report.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
