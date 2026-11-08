/* Discover Homes + sourced local agent shortlist. No messages, applications, or external writes. */
(() => {
  'use strict';
  const root = document.querySelector('#discover');
  if (!root) return;
  const pick = selector => root.querySelector(selector);
  const icons = {
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
    pass: '<path d="m6 6 12 12M18 6 6 18"/>',
    undo: '<path d="M4 10h9a6 6 0 1 1 0 12M4 10l6-6M4 10l6 6"/>',
    home: '<path d="m3 11 9-8 9 8M5 10v11h14V10M9 21v-7h6v7"/>',
    filter: '<path d="M3 6h18M3 12h18M3 18h18"/><circle cx="8" cy="6" r="2" fill="currentColor"/><circle cx="16" cy="12" r="2" fill="currentColor"/><circle cx="9" cy="18" r="2" fill="currentColor"/>'
  };
  const svg = (name, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
  const photos = window.FUNDIT_PHOTOS || {};
  const failedPhotoIds = new Set();
  const agents = window.FUNDIT_AGENTS || [];
  const isAgent = item => item.kind === 'agent';
  let mapVisible = false;
  const galleryIndex = {};
  const safeUrl = value => { try { const u = new URL(value, location.href); return ['https:','http:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } };
  const portrait = item => safeUrl(item.portraitUrl);
  const photo = item => { const p = photos[item.id]; return p && !failedPhotoIds.has(item.id) && p.addressVerified === true && p.displayEnabled === true && safeUrl(p.imageUrl) ? p : null; };
  const keyFor = item => isAgent(item) ? item.id : [item.street,item.unit,item.city,item.zip].map(v=>String(v||'').trim().toLowerCase()).join('|');
  const seenAddresses = new Set();
  const homes = ALL_LISTINGS.slice().sort((a,b)=>Number(!!photo(b))-Number(!!photo(a))).filter(item => {
    if (!RESIDENTIAL_TYPES.has(item.property_type) || SPECIAL_TYPES.has(item.listing_type) || Number(item.price) < 50000) return false;
    const key = keyFor(item);
    if (seenAddresses.has(key)) return false;
    seenAddresses.add(key); return true;
  });
  let state;
  try { state = JSON.parse(localStorage.getItem('fundit-discover-v1') || '{}'); } catch { state = {}; }
  if (!state || typeof state !== 'object' || Array.isArray(state)) state = {};
  const stringArray = value => Array.isArray(value) ? value.filter(v=>typeof v === 'string') : [];
  const saved = {homes:new Set(stringArray(state.homes)),agents:new Set(stringArray(state.agents))};
  const passed = {homes:new Set(stringArray(state.passedHomes)),agents:new Set(stringArray(state.passedAgents))};
  let storageAvailable = true, mode = 'homes', showingSaved = false, busy = false, history = [];
  const defaultFilters = {city:'all',maxPrice:1500000,beds:0,baths:0,type:'all',maxHoa:''};
  let filters = {...defaultFilters};
  let agentMinRating=4.5, agentCity='all';
  const rating = item => window.FUNDIT_MATCH(item, filters);
  const stars = (value, label) => `<span class="d-rating" aria-label="${label}: ${value === null ? 'unknown' : value+' out of 5'}"><span aria-hidden="true">★</span> ${value === null ? '—' : value.toFixed(1)}<small>/ 5 · ${label}</small></span>`;
  const persist = () => { try { localStorage.setItem('fundit-discover-v1', JSON.stringify({homes:[...saved.homes],agents:[...saved.agents],passedHomes:[...passed.homes],passedAgents:[...passed.agents]})); } catch { storageAvailable=false; } };
  const entries = () => mode === 'homes' ? homes : agents;
  const savedItems = kind => (kind === 'homes' ? homes : agents).filter(item=>saved[kind].has(keyFor(item)));
  const matches = () => entries().filter(item => (mode === 'agents' ? item.rating >= agentMinRating && (agentCity==='all'||item.areas.includes(agentCity)) : (photo(item) && (filters.city==='all'||item.city===filters.city) && Number(item.price)<=filters.maxPrice && Number(item.bedrooms||0)>=filters.beds && (filters.type==='all'||item.property_type===filters.type) && (!filters.baths || Number(item.bathrooms)>=filters.baths) && !photos[item.id]?.reportedUnavailable)));
  const candidates = () => matches().filter(item=>!saved[mode].has(keyFor(item))&&!passed[mode].has(keyFor(item))).sort((a,b)=>mode==='homes'?Number(!!photo(b))-Number(!!photo(a))||rating(b).score-rating(a).score||Number(a.price)-Number(b.price):b.rating-a.rating||b.reviewCount-a.reviewCount);
  const current = () => candidates()[0];
  const photoMarkup = item => {
    if(isAgent(item)) return `<div class="d-photo d-agent-photo"><img src="${esc(portrait(item))}" alt="${esc(item.name)} — public professional profile photo" draggable="false" referrerpolicy="no-referrer"><a class="d-photo-credit" href="${esc(item.sourceUrl)}" target="_blank" rel="noreferrer">Realtor.com profile ↗</a></div>`;
    const p=photo(item), images=p ? (p.imageUrls?.length?p.imageUrls:[p.imageUrl]) : [];
    const index=(galleryIndex[item.id]||0)%Math.max(1,images.length);
    return `<div class="d-photo">${p?`<img src="${esc(safeUrl(images[index]))}" data-home-photo="${esc(item.id)}" alt="${esc(item.street)}, ${esc(item.city)} — property photo ${index+1}" draggable="false" referrerpolicy="no-referrer"><a class="d-photo-credit" href="${esc(safeUrl(p.sourceUrl))}" target="_blank" rel="noreferrer">${esc(p.provider)} ↗</a>${images.length>1?`<div class="d-gallery"><button type="button" data-photo-step="-1" data-photo-id="${esc(item.id)}" aria-label="Previous property photo">‹</button><span>${index+1} / ${images.length}</span><button type="button" data-photo-step="1" data-photo-id="${esc(item.id)}" aria-label="Next property photo">›</button></div>`:''}`:`<a class="d-photo-credit" href="${esc(safeUrl(photos[item.id]?.sourceUrl||FUNDIT_DATA?.source||''))}" target="_blank" rel="noreferrer">View home at source ↗</a>`}</div>`;
  };

  const cardMarkup = (item, compact=false) => {
    const agent=isAgent(item);
    return `${photoMarkup(item)}<div class="d-info">${agent?stars(item.rating,'Client reviews'):stars(rating(item).score,'Preference match')}<div class="d-price">${agent?esc(item.name):money(Number(item.price))}</div><div class="d-address">${agent?esc(item.specialty):esc(item.street)+(unitSuffix(item)?' '+esc(unitSuffix(item)):'')}</div><div class="d-location">${agent?esc(item.city):`${esc(item.city)}, CA ${esc(item.zip||'')}`}</div>${agent?`<div class="d-agent-tags">${item.tags.map(tag=>`<span>${esc(tag)}</span>`).join('')}</div>${compact?'':`<div class="d-facts"><span><b>${esc(item.experience)}</b>experience</span><span><b>${item.reviewCount}</b>public reviews</span></div><p class="d-agent-rubric">${esc(item.approach)}</p>`}`:compact?'':`<div class="d-facts"><span><b>${fmtNum(item.bedrooms)}</b>beds</span><span><b>${fmtNum(item.bathrooms)}</b>baths</span><span><b>${fmtNum(item.square_feet)}</b>sq. ft.</span></div>`}<div class="d-card-bottom"><small>${agent?esc(item.brokerage):esc(hoaLabel(item.hoa))}</small><button type="button" data-discover-detail="${esc(item.id)}">${agent?'Meet this agent':'Details & funding'} ↗</button></div></div>`;
  };
  const bindImageErrors = container => container.querySelectorAll('img[data-home-photo]').forEach(img=>img.addEventListener('error',()=>{failedPhotoIds.add(img.dataset.homePhoto);render();pick('#discoverAnnounce').textContent='A property photo could not load; showing the next photo-ready home.';},{once:true}));
  function render(){
    const list=candidates(), item=list[0], count=savedItems('homes').length+savedItems('agents').length;
    pick('#discoverSavedCount').textContent=count;
    document.querySelector('#discoverNavCount').textContent=count;
    root.querySelectorAll('[data-discover-mode]').forEach(b=>b.setAttribute('aria-pressed',String(!showingSaved&&!mapVisible&&b.dataset.discoverMode===mode)));
    pick('#discoverSavedTab').setAttribute('aria-pressed',String(showingSaved));
    pick('#discoverExplore').hidden=showingSaved||mapVisible;pick('#discoverSaved').hidden=!showingSaved;pick('#discoverMap').hidden=!mapVisible;pick('#discoverMapTab').setAttribute('aria-pressed',String(mapVisible));pick('#discoverAgentControls').hidden=mode!=='agents'||showingSaved||mapVisible;
    pick('#discoverFilterOpen').hidden=(mode==='agents'&&!mapVisible)||showingSaved;
    pick('#discoverContext').textContent=mode==='agents'?'FIND YOUR AGENT · ORANGE COUNTY':`${filters.city==='all'?'ORANGE COUNTY':filters.city.toUpperCase()} · UP TO ${money(filters.maxPrice)}`;
    pick('#discoverRemaining').textContent=`${list.length.toLocaleString()} ${mode==='agents'?(list.length===1?'profile':'profiles'):(list.length===1?'home':'homes')} to explore`;
    pick('#discoverContextNote').textContent=mode==='agents'?'Public Realtor.com review aggregates, observed November 7, 2026. Source pages may be cached. Ratings are client feedback, not a license check or guarantee. Open a profile to inspect its history.':'Only homes with exact-property photos appear here. October 2026 prices are snapshot values; confirm current availability and details with the source.';
    const deck=pick('#discoverDeck');
    if(item){deck.innerHTML=`<div class="d-card-stack"><article class="d-card" id="discoverCard" tabindex="0" aria-label="${esc(isAgent(item)?item.name:item.street)}; use the save or pass controls">${cardMarkup(item)}<span class="d-decision save" aria-hidden="true">SAVED</span><span class="d-decision pass" aria-hidden="true">PASS</span></article></div>`;bindGesture(pick('#discoverCard'));}
    else deck.innerHTML=`<div class="d-empty">${svg('heart')}<span class="d-badge purple">${mode==='homes'?'YOUR HOME, YOUR PACE':'YOUR PEOPLE, YOUR PACE'}</span><h2>${matches().length?'You’re all caught up.':'No matches with these preferences.'}</h2><p>${matches().length?'Your favorites are waiting in Saved. Revisit passed cards whenever you like.':(mode==='agents'?'Try another area or review-score filter.':'Try another filter. Only homes with exact-property photos are shown here; the full snapshot remains in Listings.')}</p><button class="d-button" id="discoverRestart">${matches().length?'Revisit passed cards':'Reset filters'}</button><button class="d-button" data-show-saved>View saved →</button></div>`;
    pick('#discoverRestart')?.addEventListener('click',()=>{if(matches().length)passed[mode].clear();else if(mode==='agents'){agentCity='all';agentMinRating=4.5;document.querySelector('#agentCity').value='all';document.querySelector('#agentMinRating').value='4.5';}else filters={...defaultFilters};persist();render();});
    pick('#discoverUndo').disabled=!history.length||busy;
    pick('#discoverPass').disabled=!item||busy;pick('#discoverLike').disabled=!item||busy;
    renderSaved();renderSide();bindImageErrors(root);
    pick('#discoverStorageNote').textContent=storageAvailable?'Saved on this browser. No account or contact required.':'Browser storage is unavailable. Your shortlist lasts for this page session.';
  }
  function renderSaved(){
    const groups=[...savedItems('homes'),...savedItems('agents')];
    pick('#discoverSavedGrid').innerHTML=groups.length?groups.map(item=>`<article class="d-saved-item">${cardMarkup(item,true)}<div style="padding:0 18px 16px"><button class="d-button" type="button" data-discover-remove="${esc(item.id)}">Remove from saved</button></div></article>`).join(''):'<div class="d-empty"><span class="d-badge purple">THE START OF SOMETHING GOOD</span><h2>Keep what feels like home.</h2><p>Tap a heart or swipe right on a home or local agent to start your shortlist.</p><button class="d-button" data-explore-homes>Explore homes →</button></div>';
  }
  function renderSide(){
    const groups=[...savedItems('homes'),...savedItems('agents')];
    pick('#discoverSavedPreview').innerHTML=groups.length?groups.slice(-3).reverse().map(item=>`<div class="d-saved-mini"><div class="d-mini-icon">${photo(item)?`<img src="${esc(safeUrl(photo(item).imageUrl))}" alt="" loading="lazy">`:isAgent(item)?`<img src="${portrait(item)}" alt="" loading="lazy">`:'⌂'}</div><button data-discover-detail="${esc(item.id)}"><strong>${esc(isAgent(item)?item.name:item.street)}</strong><small>${isAgent(item)?'Agent shortlist':money(Number(item.price))+' · '+esc(item.city)}</small></button></div>`).join(''):'<p>Your shortlist starts with a little curiosity. Save a few homes or local agents you’d like to know better.</p>';
  }
  function decide(like){
    if(busy||showingSaved||mapVisible)return;const item=current();if(!item)return;
    const kind=mode,key=keyFor(item),card=pick('#discoverCard');
    history.push({kind,key,saved:saved[kind].has(key),passed:passed[kind].has(key)});
    busy=true;card.style.transition='transform .22s ease, opacity .22s ease';card.style.transform=`translateX(${like?1:-1}00%) rotate(${like?12:-12}deg)`;card.style.opacity='0';
    pick('#discoverPass').disabled=true;pick('#discoverLike').disabled=true;
    setTimeout(()=>{(like?saved[kind]:passed[kind]).add(key);busy=false;persist();render();pick('#discoverAnnounce').textContent=like?'Saved to your shortlist.':'Passed. Use undo to bring it back.';},230);
  }
  function bindGesture(card){
    let pointer=null,start=0,delta=0;
    const reset=()=>{card.style.transform='';card.style.opacity='';card.querySelectorAll('.d-decision').forEach(el=>el.style.opacity=0);};
    card.addEventListener('pointerdown',event=>{if(busy||event.button!==0||event.target.closest('button,a'))return;pointer=event.pointerId;start=event.clientX;delta=0;card.setPointerCapture(pointer);card.style.transition='none';});
    card.addEventListener('pointermove',event=>{if(pointer!==event.pointerId)return;delta=event.clientX-start;card.style.transform=`translateX(${delta}px) rotate(${delta/22}deg)`;card.querySelector('.d-decision.save').style.opacity=Math.max(0,Math.min(1,delta/100));card.querySelector('.d-decision.pass').style.opacity=Math.max(0,Math.min(1,-delta/100));});
    card.addEventListener('pointerup',event=>{if(pointer!==event.pointerId)return;pointer=null;card.style.transition='transform .2s';if(Math.abs(delta)>Math.min(100,card.clientWidth*.25))decide(delta>0);else reset();});
    card.addEventListener('pointercancel',()=>{pointer=null;reset();});
  }
  function detail(id){
    const item=homes.find(x=>x.id===id)||agents.find(x=>x.id===id);if(!item)return;
    if(isAgent(item)){
      showModal(`<span class="d-badge purple">LOCAL AGENT · PUBLIC REVIEW HISTORY</span><div class="d-agent-detail"><img src="${esc(portrait(item))}" alt="${esc(item.name)}"><div><h1>${esc(item.name)}</h1><p>${esc(item.brokerage)}</p>${stars(item.rating,'Client reviews')}<p>${item.reviewCount} reviews · ${esc(item.city)}</p></div></div><p>${esc(item.approach)}</p><div class="d-agent-score"><span>Experience reported on profile</span><b>${esc(item.experience)}</b></div><div class="d-agent-score"><span>Recent sales reported by source</span><b>${item.recentSales}</b></div><p class="muted">Realtor.com shows activity from the last 24 months. This is a public profile snapshot, not an independently audited performance record. Review count, recency and fit matter alongside the average.</p><a class="d-button" href="${esc(item.sourceUrl)}#reviews" target="_blank" rel="noreferrer">Read ${item.reviewCount} reviews at Realtor.com ↗</a><h2 style="margin-top:25px">Set a higher standard before you sign.</h2>${[['Relevant experience','Ask for recent buyer references in your neighborhood.'],['Communication','Agree on response times and a regular update schedule.'],['Fee clarity','Request the representation agreement and fees in writing.'],['Active license','Check the current California DRE record.']].map(([a,b])=>`<div class="d-agent-score"><b>${a}</b><span>${b}</span></div>`).join('')}<p>Source observed ${esc(item.checkedAt)}; source pages may be cached. No reply-time promises or license verification are assumed.</p><a href="https://www2.dre.ca.gov/PublicASP/pplinfo.asp" target="_blank" rel="noreferrer">California DRE license lookup ↗</a>`);return;
    }
    const p=photos[item.id],estimate=monthlyEstimate(item);
    showModal(`<span class="d-badge purple">Home details · source snapshot</span><h1 style="margin-top:20px">${esc(item.street)}</h1><p>${esc(item.city)}, CA ${esc(item.zip||'')} · ${money(Number(item.price))}</p>${photo(item)?photoMarkup(item):''}${matchBreakdown(item)}${p?.statusNote?`<div class="d-source-status">${esc(p.statusNote)}</div>`:''}<div class="listing-detail-grid">${[['Beds',fmtNum(item.bedrooms)],['Baths',fmtNum(item.bathrooms)],['Square feet',fmtNum(item.square_feet)],['HOA',hoaLabel(item.hoa)]].map(([label,value])=>`<div><small>${label}</small><b>${esc(value)}</b></div>`).join('')}</div><p>Planning estimate: <b>${money(estimate.total)}/month${estimate.hoaKnown?'':' + unknown HOA'}</b>. Uses ${estimate.rate}% rate and ${money(estimate.down)} down from the calculator, 1% annual tax and 0.35% annual insurance assumptions. Mortgage insurance and financing fees are excluded. This is not a lender quote.</p><button class="primary" id="discoverPlan">Explore affordability →</button><div class="d-modal-funding"><h2>Find the next piece of the plan.</h2><p>These are program research links, not confirmed eligibility, awards, or compatible funding combinations.</p>${funds.filter(f=>f.url).map(f=>`<a href="${esc(f.url)}" target="_blank" rel="noreferrer">${esc(f.name)} ↗</a>`).join('')}<button class="d-button" id="discoverProfile">Complete your buyer profile →</button></div><p class="muted">October 2026 snapshot. Availability, sale/rent tenure and property facts need confirmation. Prototype only; consult a qualified professional.</p><a href="${esc(safeUrl(p?.sourceUrl||FUNDIT_DATA?.source||''))}" target="_blank" rel="noreferrer">View property or dataset source ↗</a>`);
    document.querySelector('#discoverPlan').onclick=()=>{modal.close();document.querySelector('#subsidy').value=0;useListing(item);};
    document.querySelector('#discoverProfile').onclick=()=>{modal.close();view('buyers');};
  }
  root.addEventListener('click',event=>{
    const target=event.target.closest('button');if(!target)return;
    if(target.dataset.discoverMode){mode=target.dataset.discoverMode;showingSaved=false;mapVisible=false;render();}
    if(target.id==='discoverMapTab'){mapVisible=true;showingSaved=false;mode='homes';render();window.dispatchEvent(new CustomEvent('fundit:map'));}
    if(target.dataset.photoStep){galleryIndex[target.dataset.photoId]=(galleryIndex[target.dataset.photoId]||0)+Number(target.dataset.photoStep)+(photos[target.dataset.photoId].imageUrls?.length||1);render();}
    if(target.hasAttribute('data-show-saved')){mapVisible=false;showingSaved=true;render();}
    if(target.hasAttribute('data-explore-homes')){mode='homes';mapVisible=false;showingSaved=false;render();}
    if(target.dataset.discoverDetail)detail(target.dataset.discoverDetail);
    if(target.dataset.discoverRemove){const item=homes.find(x=>x.id===target.dataset.discoverRemove)||agents.find(x=>x.id===target.dataset.discoverRemove);if(item){saved[isAgent(item)?'agents':'homes'].delete(keyFor(item));persist();render();}}
  });
  pick('#discoverPass').onclick=()=>decide(false);pick('#discoverLike').onclick=()=>decide(true);
  pick('#discoverUndo').onclick=()=>{if(busy)return;const last=history.pop();if(!last)return;mode=last.kind;showingSaved=false;for(const [name,map] of [['saved',saved],['passed',passed]]){if(last[name])map[mode].add(last.key);else map[mode].delete(last.key);}persist();render();pick('#discoverAnnounce').textContent='Last decision undone.';};
  const filterDialog=document.querySelector('#discoverFilters');
  const citySelect=document.querySelector('#discoverCity');
  [...new Set(homes.map(x=>x.city))].sort().forEach(city=>{const o=document.createElement('option');o.value=city;o.textContent=city;citySelect.append(o);});
  pick('#discoverFilterOpen').onclick=()=>{citySelect.value=filters.city;document.querySelector('#discoverMaxPrice').value=filters.maxPrice;document.querySelector('#discoverBeds').value=filters.beds;document.querySelector('#discoverType').value=filters.type;document.querySelector('#discoverBaths').value=filters.baths;document.querySelector('#discoverHoa').value=filters.maxHoa;filterDialog.showModal();};
  document.querySelector('#discoverFilterCancel').onclick=()=>filterDialog.close();
  document.querySelector('#discoverFilterForm').onsubmit=event=>{event.preventDefault();filters={city:citySelect.value,maxPrice:Number(document.querySelector('#discoverMaxPrice').value),beds:Number(document.querySelector('#discoverBeds').value),type:document.querySelector('#discoverType').value,baths:Number(document.querySelector('#discoverBaths').value),maxHoa:document.querySelector('#discoverHoa').value};filterDialog.close();render();window.dispatchEvent(new CustomEvent('fundit:preferences'));};
  pick('#discoverUseProfile').onclick=()=>{const p=window.funditProfile||{};if(!Object.values(p).some(Boolean)){view('buyers');return;}if(Number(p.price)>=50000)filters.maxPrice=Number(p.price);if(p.hoa!==''&&p.hoa!=null)filters.maxHoa=p.hoa;if(Number(p.baths)>0)filters.baths=Number(p.baths);if(Number(p.beds)>=0)filters.beds=Number(p.beds)||0;const city=(p.cities||'').split(/[,;]/)[0].trim();if([...citySelect.options].some(x=>x.value===city))filters.city=city;mode='homes';mapVisible=false;showingSaved=false;render();toast('Available buyer preferences applied. No eligibility assumed.');};
  document.addEventListener('keydown',event=>{if(root.classList.contains('hidden')||showingSaved||mapVisible||document.querySelector('dialog[open]')||event.target.closest('input,select,textarea,button,a'))return;if(event.key==='ArrowRight'){event.preventDefault();decide(true);}if(event.key==='ArrowLeft'){event.preventDefault();decide(false);}});
  modal.addEventListener('click',event=>{const target=event.target.closest('[data-photo-step]');if(!target)return;const id=target.dataset.photoId,p=photos[id],images=p?.imageUrls||[];if(!images.length)return;galleryIndex[id]=((galleryIndex[id]||0)+Number(target.dataset.photoStep)+images.length)%images.length;const frame=target.closest('.d-photo');frame.querySelector('img').src=safeUrl(images[galleryIndex[id]]);frame.querySelector('.d-gallery span').textContent=`${galleryIndex[id]+1} / ${images.length}`;});
  window.addEventListener('fundit:view',event=>{if(event.detail==='discover')render();});
  function matchBreakdown(item){
    const match=rating(item);
    return `<section class="d-match-details"><h2>${stars(match.score,'Preference match')}</h2><p>${match.coverage}% of selected preference weight has known data.</p>${match.criteria.map(c=>`<div class="d-match-row"><span>${esc(c.label)}</span><b>${esc(c.detail)}</b><span>${c.known?Math.round(c.ratio*100)+'%':'—'}</span></div>`).join('')}<small>Budget 35 · location 25 · beds 15 · baths 10 · type 10 · HOA 5. Only selected criteria count; unknown facts are excluded, with coverage shown. This score measures preference fit.</small></section>`;
  }
  document.querySelector('#agentMinRating').onchange=event=>{agentMinRating=Number(event.target.value);render();};
  const agentCitySelect=document.querySelector('#agentCity');
  [...new Set(agents.flatMap(a=>a.areas))].sort().forEach(city=>agentCitySelect.add(new Option(city,city)));
  agentCitySelect.onchange=event=>{agentCity=event.target.value;render();};
  window.funditDiscover={homes,photo,detail,getPreferences:()=>({...filters}),rating,matchBreakdown,savedItems,
    isSaved:item=>saved.homes.has(keyFor(item)),
    saveHome(id){const item=homes.find(x=>x.id===id);if(item){saved.homes.add(keyFor(item));persist();render();window.dispatchEvent(new CustomEvent('fundit:saved'));}}
  };
  render();if(location.hash==='#discover')view('discover');
})();
