# Fund it · Homes, people and a funding plan

The existing dashboard now includes **Discover Homes**: seven homes with exact-property listing photos, four real Orange County agent profiles with sourced public review scores, a preference-rated map, and browser-local saved collections. Work is isolated on `codex/discover-homes`.

Run the committed static website without installing anything:

```sh
python3 -m http.server 8010 --bind 127.0.0.1 --directory dist
```

Open `http://127.0.0.1:8010/#discover`. Homes, Agents, Map and Saved share the same shortlist. Home details include funding research links and affordability assumptions. No contact requests are sent.

The cream, sage and lavender UI retains the dashboard and adds Magic UI Text Animate, Icon Cloud and Globe components. The small React UI package is prebuilt into `dist/`; only developers changing those components need Node 22+ and pnpm:

```sh
cd ui
pnpm install --frozen-lockfile
pnpm run build
pnpm exec tsc --noEmit
```

Checks from the repository root:

```sh
python3 -m unittest discover -s scripts -p 'test_*.py' -v
node scripts/test_match_engine.cjs
```

Map coordinates come from the October 2026 source snapshot. Home stars measure preference fit; agent stars are public Realtor.com review aggregates. Both show their meaning and sources. Prices and availability are unverified snapshots, not live inventory. Project budgets are fictional planning scenarios and their photographs are representative. No award, loan approval or agent license verification is implied.

See [behavior, photo and agent sources, scoring and deployment status](docs/DISCOVER.md).
