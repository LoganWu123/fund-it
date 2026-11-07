/* Discover Homes + sample agent shortlist. No messages, applications, or external writes. */
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
  const agents = [
    {id:'demo-agent-maya',name:'Maya Chen',initials:'MC',city:'Irvine & Tustin',specialty:'First-home guide',tags:['First-time buyers','Condo know-how'],tone:'#e3dfcf',reply:'Same business day',experience:'8 years',approach:'Explains the process before asking for a commitment.',rubric:[['Local transaction expertise','Condo and HOA review'],['Communication agreement','Weekly updates + written recaps'],['Fee transparency','Written scope before signing'],['Buyer support','Financing and inspection checklist']],demo:true},
    {id:'demo-agent-jordan',name:'Jordan Ellis',initials:'JE',city:'Santa Ana & Orange',specialty:'A clear plan, at your pace',tags:['Buyer education','Assistance research'],tone:'#dcd6e8',reply:'Within 4 business hours',experience:'6 years',approach:'Welcomes questions and compares options without pressure.',rubric:[['Local transaction expertise','Older homes and inspections'],['Communication agreement','Text first; scheduled calls'],['Fee transparency','Explains fees and conflicts'],['Buyer support','Local assistance research']],demo:true},
    {id:'demo-agent-sam',name:'Sam Rivera',initials:'SR',city:'Anaheim & Fullerton',specialty:'Details, without the overwhelm',tags:['Contract clarity','Negotiation'],tone:'#d5e0d7',reply:'Within 1 business day',experience:'10 years',approach:'Turns trade terminology into a practical next-step list.',rubric:[['Local transaction expertise','Repair and contingency review'],['Communication agreement','Milestone updates in writing'],['Fee transparency','Side-by-side cost explanations'],['Buyer support','Offer and closing walkthrough']],demo:true}
  ];
  const safeUrl = value => { try { const u = new URL(value, location.href); return ['https:','http:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } };
  const photo = item => { const p = photos[item.id]; return p && p.addressVerified === true && p.displayEnabled === true && safeUrl(p.imageUrl) ? p : null; };
  const keyFor = item => item.demo ? item.id : [item.street,item.unit,item.city,item.zip].map(v=>String(v||'').trim().toLowerCase()).join('|');
  const seenAddresses = new Set();
  const homes = ALL_LISTINGS.filter(item => {
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
  let filters = {city:'all',maxPrice:1500000,beds:0,type:'all'};
  const persist = () => { try { localStorage.setItem('fundit-discover-v1', JSON.stringify({homes:[...saved.homes],agents:[...saved.agents],passedHomes:[...passed.homes],passedAgents:[...passed.agents]})); } catch { storageAvailable=false; } };
  const entries = () => mode === 'homes' ? homes : agents;
  const savedItems = kind => (kind === 'homes' ? homes : agents).filter(item=>saved[kind].has(keyFor(item)));
  const matches = () => entries().filter(item => mode === 'agents' || ((filters.city==='all'||item.city===filters.city) && Number(item.price)<=filters.maxPrice && Number(item.bedrooms||0)>=filters.beds && (filters.type==='all'||item.property_type===filters.type) && !photos[item.id]?.reportedUnavailable));
  const candidates = () => matches().filter(item=>!saved[mode].has(keyFor(item))&&!passed[mode].has(keyFor(item))).sort((a,b)=>mode==='homes'?Number(!!photo(b))-Number(!!photo(a))||Number(a.price)-Number(b.price):0);
  const current = () => candidates()[0];
  const photoMarkup = item => {
    if(item.demo) return `<div class="d-photo d-agent-photo" style="background:${item.tone}"><span class="d-photo-status d-badge">Fictional agent · demo</span><div class="d-agent-initials">${item.initials}</div><span class="d-agent-caption">A SAMPLE PROFILE, NOT A REAL AGENT</span></div>`;
    const p=photo(item);
    return `<div class="d-photo">${p?`<img src="${esc(safeUrl(p.imageUrl))}" alt="${esc(item.street)}, ${esc(item.city)} — property photo" draggable="false" referrerpolicy="no-referrer"><a class="d-photo-credit" href="${esc(safeUrl(p.sourceUrl))}" target="_blank" rel="noreferrer">${esc(p.provider)} ↗</a>`:`<div class="d-photo-placeholder">${svg('home')}<strong>A real home. An honest first look.</strong>Actual-property photo not yet available.</div>`}<span class="d-photo-status d-badge">${p?'Property photo':'Actual photo pending'}</span></div>`;
  };
  const cardMarkup = (item, compact=false) => {
    const isAgent=!!item.demo;
    return `${photoMarkup(item)}<div class="d-info"><div class="d-price">${isAgent?esc(item.name):money(Number(item.price))}</div><div class="d-address">${isAgent?esc(item.specialty):esc(item.street)+(unitSuffix(item)?' '+esc(unitSuffix(item)):'')}</div><div class="d-location">${isAgent?esc(item.city):`${esc(item.city)}, CA ${esc(item.zip||'')}`}</div>${isAgent?`<div class="d-agent-tags">${item.tags.map(tag=>`<span>${esc(tag)}</span>`).join('')}</div>${compact?'':`<div class="d-facts"><span><b>${esc(item.experience)}</b>sample experience</span><span><b>Clear</b>fee discussion</span></div><p class="d-agent-rubric">${esc(item.approach)}</p>`}`:compact?'':`<div class="d-facts"><span><b>${fmtNum(item.bedrooms)}</b>beds</span><span><b>${fmtNum(item.bathrooms)}</b>baths</span><span><b>${fmtNum(item.square_feet)}</b>sq. ft.</span></div>`}<div class="d-card-bottom"><small>${isAgent?'All credentials are fictional':esc(hoaLabel(item.hoa))}</small><button type="button" data-discover-detail="${esc(item.id)}">${isAgent?'Meet this agent':'Details & funding'} ↗</button></div></div>`;
  };
  const bindImageErrors = container => container.querySelectorAll('.d-photo img').forEach(img=>img.addEventListener('error',()=>{const holder=img.parentElement;img.remove();holder.querySelector('.d-photo-credit')?.remove();holder.querySelector('.d-photo-status').textContent='Photo unavailable';holder.insertAdjacentHTML('beforeend',`<div class="d-photo-placeholder">${svg('home')}<strong>Photo unavailable</strong>View the linked source for this home.</div>`);},{once:true}));
  function render(){
    const list=candidates(), item=list[0], count=savedItems('homes').length+savedItems('agents').length;
    pick('#discoverSavedCount').textContent=count;
    document.querySelector('#discoverNavCount').textContent=count;
    root.querySelectorAll('[data-discover-mode]').forEach(b=>b.setAttribute('aria-pressed',String(!showingSaved&&b.dataset.discoverMode===mode)));
    pick('#discoverSavedTab').setAttribute('aria-pressed',String(showingSaved));
    pick('#discoverExplore').hidden=showingSaved;pick('#discoverSaved').hidden=!showingSaved;
    pick('#discoverFilterOpen').hidden=mode==='agents'||showingSaved;
    pick('#discoverContext').textContent=mode==='agents'?'DEMO AGENTS · ORANGE COUNTY':`${filters.city==='all'?'ORANGE COUNTY':filters.city.toUpperCase()} · UP TO ${money(filters.maxPrice)}`;
    pick('#discoverRemaining').textContent=`${list.length.toLocaleString()} ${mode==='agents'?(list.length===1?'profile':'profiles'):(list.length===1?'home':'homes')} to explore`;
    pick('#discoverContextNote').textContent=mode==='agents'?'Fictional profiles. Compare the questions you should ask a real agent.':'October 2026 snapshot. Availability and sale/rent tenure need confirmation.';
    const deck=pick('#discoverDeck');
    if(item){deck.innerHTML=`<div class="d-card-stack"><article class="d-card" id="discoverCard" tabindex="0" aria-label="${esc(item.demo?item.name:item.street)}; use the save or pass controls">${cardMarkup(item)}<span class="d-decision save" aria-hidden="true">SAVED</span><span class="d-decision pass" aria-hidden="true">PASS</span></article></div>`;bindGesture(pick('#discoverCard'));}
    else deck.innerHTML=`<div class="d-empty">${svg('heart')}<span class="d-badge purple">${mode==='homes'?'YOUR HOME, YOUR PACE':'YOUR PEOPLE, YOUR PACE'}</span><h2>${matches().length?'You’re all caught up.':'A little more room to explore?'}</h2><p>${matches().length?'Your favorites are waiting in Saved. Revisit passed cards whenever you like.':'Try another city or a wider budget. We’ll keep your saved homes right here.'}</p><button class="d-button" id="discoverRestart">${matches().length?'Revisit passed cards':'Reset filters'}</button><button class="d-button" data-show-saved>View saved →</button></div>`;
    pick('#discoverRestart')?.addEventListener('click',()=>{if(matches().length)passed[mode].clear();else filters={city:'all',maxPrice:1500000,beds:0,type:'all'};persist();render();});
    pick('#discoverUndo').disabled=!history.length||busy;
    pick('#discoverPass').disabled=!item||busy;pick('#discoverLike').disabled=!item||busy;
    renderSaved();renderSide();bindImageErrors(root);
    pick('#discoverStorageNote').textContent=storageAvailable?'Saved on this browser. No account or contact required.':'Browser storage is unavailable. Your shortlist lasts for this page session.';
  }
  function renderSaved(){
    const groups=[...savedItems('homes'),...savedItems('agents')];
    pick('#discoverSavedGrid').innerHTML=groups.length?groups.map(item=>`<article class="d-saved-item">${cardMarkup(item,true)}<div style="padding:0 18px 16px"><button class="d-button" type="button" data-discover-remove="${esc(item.id)}">Remove from saved</button></div></article>`).join(''):'<div class="d-empty"><span class="d-badge purple">THE START OF SOMETHING GOOD</span><h2>Keep what feels like home.</h2><p>Tap a heart or swipe right on a home or sample agent to start your shortlist.</p><button class="d-button" data-explore-homes>Explore homes →</button></div>';
  }
  function renderSide(){
    const groups=[...savedItems('homes'),...savedItems('agents')];
    pick('#discoverSavedPreview').innerHTML=groups.length?groups.slice(-3).reverse().map(item=>`<div class="d-saved-mini"><div class="d-mini-icon">${photo(item)?`<img src="${esc(safeUrl(photo(item).imageUrl))}" alt="" loading="lazy">`:item.demo?item.initials:'⌂'}</div><button data-discover-detail="${esc(item.id)}"><strong>${esc(item.demo?item.name:item.street)}</strong><small>${item.demo?'Fictional sample agent':money(Number(item.price))+' · '+esc(item.city)}</small></button></div>`).join(''):'<p>Your shortlist starts with a little curiosity. Save a few homes or sample agents you’d like to know better.</p>';
  }
  function decide(like){
    if(busy||showingSaved)return;const item=current();if(!item)return;
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
    if(item.demo){showModal(`<span class="d-badge purple">Fictional profile · demonstration only</span><h1 style="margin-top:20px">${esc(item.name)}</h1><p>${esc(item.specialty)} · ${esc(item.city)}</p><p>${esc(item.approach)}</p><h2>A higher standard starts with clear expectations.</h2>${item.rubric.map(([a,b])=>`<div class="d-agent-score"><span>${esc(a)}</span><b>${esc(b)}</b></div>`).join('')}<p>Sample response commitment: <b>${esc(item.reply)}</b>. Sample experience: ${esc(item.experience)}. These are invented examples, not verified credentials, reviews, performance scores, or endorsements.</p><p>For a real agent, ask for an active license, relevant transaction experience, a written fee agreement, references, and your preferred communication plan.</p><a href="https://www2.dre.ca.gov/PublicASP/pplinfo.asp" target="_blank" rel="noreferrer">California DRE license lookup ↗</a><p class="muted">No messages or contact requests are sent by this prototype.</p>`);return;}
    const p=photos[item.id],estimate=monthlyEstimate(item);
    showModal(`<span class="d-badge purple">Home details · source snapshot</span><h1 style="margin-top:20px">${esc(item.street)}</h1><p>${esc(item.city)}, CA ${esc(item.zip||'')} · ${money(Number(item.price))}</p>${photo(item)?photoMarkup(item):''}${p?.statusNote?`<div class="d-source-status">${esc(p.statusNote)}</div>`:''}<div class="listing-detail-grid">${[['Beds',fmtNum(item.bedrooms)],['Baths',fmtNum(item.bathrooms)],['Square feet',fmtNum(item.square_feet)],['HOA',hoaLabel(item.hoa)]].map(([label,value])=>`<div><small>${label}</small><b>${esc(value)}</b></div>`).join('')}</div><p>Planning estimate: <b>${money(estimate.total)}/month${estimate.hoaKnown?'':' + unknown HOA'}</b>. Uses ${estimate.rate}% rate and ${money(estimate.down)} down from the calculator, 1% annual tax and 0.35% annual insurance assumptions. Mortgage insurance and financing fees are excluded. This is not a lender quote.</p><button class="primary" id="discoverPlan">Explore affordability →</button><div class="d-modal-funding"><h2>Find the next piece of the plan.</h2><p>These are program research links, not confirmed eligibility, awards, or compatible funding combinations.</p>${funds.filter(f=>f.url).map(f=>`<a href="${esc(f.url)}" target="_blank" rel="noreferrer">${esc(f.name)} ↗</a>`).join('')}<button class="d-button" id="discoverProfile">Complete your buyer profile →</button></div><p class="muted">October 2026 snapshot. Availability, sale/rent tenure and property facts need confirmation. Prototype only; consult a qualified professional.</p><a href="${esc(safeUrl(p?.sourceUrl||FUNDIT_DATA?.source||''))}" target="_blank" rel="noreferrer">View property or dataset source ↗</a>`);
    document.querySelector('#discoverPlan').onclick=()=>{modal.close();document.querySelector('#subsidy').value=0;useListing(item);};
    document.querySelector('#discoverProfile').onclick=()=>{modal.close();view('buyers');};
  }
  root.addEventListener('click',event=>{
    const target=event.target.closest('button');if(!target)return;
    if(target.dataset.discoverMode){mode=target.dataset.discoverMode;showingSaved=false;render();}
    if(target.hasAttribute('data-show-saved')){showingSaved=true;render();}
    if(target.hasAttribute('data-explore-homes')){mode='homes';showingSaved=false;render();}
    if(target.dataset.discoverDetail)detail(target.dataset.discoverDetail);
    if(target.dataset.discoverRemove){const item=homes.find(x=>x.id===target.dataset.discoverRemove)||agents.find(x=>x.id===target.dataset.discoverRemove);if(item){saved[item.demo?'agents':'homes'].delete(keyFor(item));persist();render();}}
  });
  pick('#discoverPass').onclick=()=>decide(false);pick('#discoverLike').onclick=()=>decide(true);
  pick('#discoverUndo').onclick=()=>{if(busy)return;const last=history.pop();if(!last)return;mode=last.kind;showingSaved=false;for(const [name,map] of [['saved',saved],['passed',passed]]){if(last[name])map[mode].add(last.key);else map[mode].delete(last.key);}persist();render();pick('#discoverAnnounce').textContent='Last decision undone.';};
  const filterDialog=document.querySelector('#discoverFilters');
  const citySelect=document.querySelector('#discoverCity');
  [...new Set(homes.map(x=>x.city))].sort().forEach(city=>{const o=document.createElement('option');o.value=city;o.textContent=city;citySelect.append(o);});
  pick('#discoverFilterOpen').onclick=()=>{citySelect.value=filters.city;document.querySelector('#discoverMaxPrice').value=filters.maxPrice;document.querySelector('#discoverBeds').value=filters.beds;document.querySelector('#discoverType').value=filters.type;filterDialog.showModal();};
  document.querySelector('#discoverFilterCancel').onclick=()=>filterDialog.close();
  document.querySelector('#discoverFilterForm').onsubmit=event=>{event.preventDefault();filters={city:citySelect.value,maxPrice:Number(document.querySelector('#discoverMaxPrice').value),beds:Number(document.querySelector('#discoverBeds').value),type:document.querySelector('#discoverType').value};filterDialog.close();render();};
  pick('#discoverUseProfile').onclick=()=>{const p=window.funditProfile||{};if(!Object.values(p).some(Boolean)){view('buyers');return;}if(Number(p.price)>=50000)filters.maxPrice=Number(p.price);if(Number(p.beds)>=0)filters.beds=Number(p.beds)||0;const city=(p.cities||'').split(/[,;]/)[0].trim();if([...citySelect.options].some(x=>x.value===city))filters.city=city;mode='homes';showingSaved=false;render();toast('Available buyer preferences applied. No eligibility assumed.');};
  document.addEventListener('keydown',event=>{if(root.classList.contains('hidden')||showingSaved||document.querySelector('dialog[open]')||event.target.closest('input,select,textarea,button,a'))return;if(event.key==='ArrowRight'){event.preventDefault();decide(true);}if(event.key==='ArrowLeft'){event.preventDefault();decide(false);}});
  window.addEventListener('fundit:view',event=>{if(event.detail==='discover')render();});
  render();if(location.hash==='#discover')view('discover');
})();
