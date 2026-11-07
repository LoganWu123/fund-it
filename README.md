# Fund it · Discover Homes

The existing project dashboard now includes **Discover Homes**, a swipe-based home and sample-agent browser. Changes are isolated on `codex/discover-homes`.

```sh
python3 -m http.server 8010 --bind 127.0.0.1 --directory dist
```

Open `http://127.0.0.1:8010/#discover`. No build or dependencies are required.

Homes support city/budget/bedroom/type filters, pass/save/undo, browser-local saved collections and a details dialog with affordability assumptions and funding research links. Mouse/touch swipes, buttons and keyboard arrows are supported. The dashboard and all existing sections remain available.

The **Agents** tab contains three fictional demonstration profiles and a transparent comparison rubric for local expertise, communication, fee transparency and buyer support. No real agent credential, endorsement, review or performance claim is made. Saving a card never contacts anyone.

The property dataset is a dated research snapshot. Actual-property photo URLs and their source pages are recorded separately. Missing photos use a labeled placeholder; known sold/off-market research conflicts are excluded from the Discover deck. This is a prototype, not a current inventory, loan approval or financial recommendation.

See [feature behavior, photo URLs and verification limits](docs/DISCOVER.md).

Validation: `python3 -m unittest discover -s scripts -p 'test_*.py' -v`. Browser checks cover saving, collection persistence, home and agent details, filtering, pass/undo, mobile layout and JavaScript errors.
