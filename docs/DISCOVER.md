# Discover Homes and sample agents

Branch: `codex/discover-homes`. The existing dashboard, projects, funding, buyer profiles and listings remain available. The new Discover navigation item opens a swipe deck with Homes, Agents and Saved collections.

Run the static preview from the project root:

```sh
python3 -m http.server 8010 --bind 127.0.0.1 --directory dist
```

Open `http://127.0.0.1:8010/#discover`. No build or package installation is needed.

## Behavior

- Swipe left / pass, swipe right / save, or use the labeled buttons. Arrow keys work while the card is focused. Undo reverses the last decision during the current page session.
- Saved homes and sample agents persist in browser localStorage. If storage is unavailable, the collection remains in page memory and the UI explains the limitation. Saved data is local to this browser and not shared with agents or servers.
- City, maximum price, bedroom and property-type filters apply to homes. Buyer-entered city, price and bedroom preferences can be applied from the existing profile. Demographics are not used for ranking.
- Homes are deduplicated by normalized address/unit/city/ZIP, restricted to the existing residential-type set, and exclude auction/foreclosure/bank-owned records, prices under $50,000 and researched records with newer sold/off-market reports. Unconfirmed sale/rent tenure remains explicit. Source data is still a dated research snapshot, not current verified inventory.
- Exact-address photos appear first within the selected filters; this is presentation ordering, not an affordability or recommendation score. A photo failure shows a placeholder rather than another home's image.
- Home details show snapshot attributes and the calculator's planning assumptions. Unknown HOA stays explicit; mortgage insurance and financing fees are excluded. Funding links are research leads only. Opening the affordability calculator from Discover resets committed subsidy to zero, so unconfirmed awards do not reduce the gap.
- Three agent profiles are fictional examples. Their experience, response commitments and specializations are invented demo values, labeled in cards and details. No real license number, review, endorsement, verification badge or performance score is asserted. The comparison rubric covers transaction expertise, communication expectations, fee transparency and buyer support. The California DRE license-lookup link is a research aid, not a completed license check.
- No contact requests, emails, texts or applications are sent.

## Actual-property photo research

Checked November 7, 2026. `dist/property-photos.js` maps each exact listing ID to a source page and direct image URL. A real photo is never assigned by visual resemblance, city, property type or price.

| Property | Direct photo URL | Source / status |
| --- | --- | --- |
| 146 Orchard, Irvine CA 92618 | https://cdn.listingphotos.sierrastatic.com/large/v1787078160/68/68_PW26175843_01.jpg | [Broker listing](https://www.luxurysocalrealty.com/idx/146-orchard-irvine-ca-92618/1807026406_spid/); exact address and MLS PW26175843. HTTP 200 image/jpeg verified. Source page reports active, not independently guaranteed. Enabled for the local prototype with source attribution. |
| 2155 W Banbury Cir, Anaheim CA 92804 | https://media.crmls.org/medias/10eeee47-d3be-41ac-9610-5b7a2861bd3c.jpg | [Photo source](https://davidhicksla.com/home-search/listings/1827187112587062721-2155-W-Banbury-CIR); HTTP 200 image/jpeg verified. [Newer sold results](https://www.movoto.com/ca/92804/sold/) report sold October 6, 2026. Not used as an available home. |
| 905 S Ross St, Santa Ana CA 92701 | https://pi.movoto.com/p/202/PW26177583_0_QAbnJv_p.webp | [Property page](https://www.movoto.com/santa-ana-ca/905-s-ross-st-santa-ana-ca-92701/pid_nowi3x538g/); HTTP 200 image/webp verified. Newer search results report sold October 21, 2026 while older page snapshots conflict. Excluded from Discover. |

146 Orchard's original Coldwell Banker image link returned HTTP 404, so it is not used. 40 Tangerine's snapshot listing conflicts with newer off-market pages; no photo has been assigned to it.

Photo rights remain with the listing providers and do not inherit the property CSV's CC0 license. Images are linked remotely, not copied into this repository. For ongoing public deployment, use provider-authorized photo access or an approved listing feed. Exact addresses and photo-source links are preserved for review. `displayEnabled` is a configuration flag, not a claim of a redistribution license.

Add an exact-address source under the provider's permitted use terms:

```js
window.FUNDIT_PHOTOS['EXISTING_LISTING_ID'] = {
  address: 'Exact address, unit, city and ZIP',
  imageUrl: 'https://your-authorized-provider.example/property-photo.jpg',
  sourceUrl: 'https://your-authorized-provider.example/listing',
  provider: 'Photo provider / attribution',
  addressVerified: true,
  displayEnabled: true,
  checkedAt: 'YYYY-MM-DD'
};
```

The original hosted Site ID in `.openai/hosting.json` returned `project_not_found` through the current Sites connection. Its identity was preserved. This change is provided as a local preview and Git feature branch; no replacement Site was created and no deployment is claimed.


## Photo-only update

Discover now shows only exact-property photo-backed homes (146 Orchard and 306 Orange Blossom). The full text dataset remains in Listings. Agent cards use locally bundled, AI-generated photo-realistic portraits of fictional people; there are no initials or sample overlays. Disclosure remains below the deck and in agent details. Saved thumbnails use the same portraits.
