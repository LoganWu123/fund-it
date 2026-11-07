/* Leaflet 1.9.4 map. Only source-provided coordinates are plotted. */
(() => {
  'use strict';
  const api = window.funditDiscover;
  const panel = document.querySelector('#discoverMap');
  if (!api || !panel) return;
  const locations = window.FUNDIT_LOCATIONS || {};
  const homes = api.homes.filter(h => locations[h.id] && !window.FUNDIT_PHOTOS[h.id]?.reportedUnavailable);
  const byId = new Map(homes.map(h => [h.id, h]));
  let map, layer, photoOnly = true, selectedId, popupOpen = false;
  const button = document.querySelector('#mapPhotoOnly');
  const list = document.querySelector('#mapHomeList');
  button.setAttribute('aria-pressed', 'true');
  const price = h => money(Number(h.price));
  const scoreText = h => {const s=api.rating(h).score;return s===null?'—':s.toFixed(1);};
  const address = h => `${h.street}${unitSuffix(h) ? ' '+unitSuffix(h) : ''}`;
  const color = score => score >= 4 ? 'strong' : score >= 3 ? 'good' : 'low';

  function select(h) {
    selectedId = h.id;
    map.setView(locations[h.id], Math.max(14, map.getZoom()));
    const marker = layer.getLayers().find(m => m.options.homeId === h.id);
    marker?.openPopup();
  }
  function popup(h) {
    const p = api.photo(h);
    return `<div class="d-map-popup">${p?`<img src="${esc(p.imageUrl)}" alt="${esc(address(h))}" loading="lazy" referrerpolicy="no-referrer">`:''}<span class="d-rating">★ ${scoreText(h)}<small>/ 5 preference match</small></span><h3>${price(h)}</h3><b>${esc(address(h))}</b><p>${esc(h.city)} · ${fmtNum(h.bedrooms)} bd · ${fmtNum(h.bathrooms)} ba</p><button class="d-button" type="button" data-map-detail="${esc(h.id)}">Details & match breakdown ↗</button><button class="d-map-save" type="button" data-map-save="${esc(h.id)}">${api.isSaved(h)?'♥ Saved':'♡ Save home'}</button></div>`;
  }
  function update() {
    if (!map || panel.hidden) return;
    const p = api.getPreferences();
    document.querySelector('#mapPreferenceSummary').textContent = `${p.city==='all'?'Orange County':p.city} · ${money(p.maxPrice)} budget${p.beds?' · '+p.beds+'+ beds':''}${p.baths?' · '+p.baths+'+ baths':''} · Edit “Your filters” to update every match score.`;
    const bounds = map.getBounds();
    const eligible = homes.filter(h => (!photoOnly || api.photo(h)) && bounds.contains(locations[h.id]));
    const sorted = eligible.map(h => ({h,score:api.rating(h).score})).sort((a,b)=>Number(!!api.photo(b.h))-Number(!!api.photo(a.h))||(b.score??-1)-(a.score??-1)||Number(a.h.price)-Number(b.h.price));
    const displayed = sorted.slice(0,220);
    layer.clearLayers();
    for (const {h,score} of displayed) {
      const icon = L.divIcon({className:'d-map-pin '+color(score),html:`<span>★ ${scoreText(h)}</span>`,iconSize:[57,31],iconAnchor:[28,36],popupAnchor:[0,-28]});
      L.marker(locations[h.id],{icon,homeId:h.id,keyboard:true,title:`${address(h)}, ${h.city}: ${scoreText(h)} out of 5 preference match`,riseOnHover:true}).addTo(layer).bindPopup(popup(h),{maxWidth:260,minWidth:230});
    }
    const scope = photoOnly?'photo-backed homes':'snapshot homes';
    document.querySelector('#mapResultCount').textContent = `${displayed.length.toLocaleString()} of ${eligible.length.toLocaleString()} ${scope} in view`;
    list.innerHTML = displayed.length ? `<p class="d-map-hint">${eligible.length>220?'Zoom in to reveal more pins. ':''}Best matches with photos appear first. Budget and city influence ratings; pins can include homes outside your preferences.</p>`+displayed.slice(0,25).map(({h,score})=>{
      const photo=api.photo(h);
      return `<article class="d-map-home ${selectedId===h.id?'selected':''}">${photo?`<img src="${esc(photo.imageUrl)}" alt="${esc(address(h))}" loading="lazy" referrerpolicy="no-referrer">`:''}<div><button type="button" data-map-focus="${esc(h.id)}"><span class="d-map-stars">★ ${scoreText(h)} <small>/ 5</small></span><strong>${price(h)}</strong><b>${esc(address(h))}</b><small>${esc(h.city)} · ${fmtNum(h.bedrooms)} bd · ${fmtNum(h.bathrooms)} ba</small></button><button class="d-map-details" type="button" data-map-detail="${esc(h.id)}">Details & funding ↗</button></div></article>`;
    }).join('') : '<div class="d-map-empty"><h3>No homes in this view.</h3><p>Zoom out, pan to Orange County, or include all snapshot homes.</p></div>';
  }
  function fitPreferredCity() {
    const p=api.getPreferences();
    const candidates=homes.filter(h=>(!photoOnly||api.photo(h))&&(p.city==='all'||h.city===p.city));
    if(candidates.length) map.fitBounds(candidates.map(h=>locations[h.id]),{padding:[35,35],maxZoom:p.city==='all'?11:13});
  }
  function open() {
    if (!window.L) {list.innerHTML='<p>The map library could not load. Homes and agents are still available in their tabs.</p>';return;}
    if (!map) {
      map=L.map('homeMap',{scrollWheelZoom:false}).setView([33.72,-117.83],10);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
      layer=L.layerGroup().addTo(map);
      map.on('popupopen',()=>{popupOpen=true;});
      map.on('popupclose',()=>{popupOpen=false;});
      map.on('moveend',()=>{if(!popupOpen)update();});
      fitPreferredCity();
    }
    requestAnimationFrame(()=>{map.invalidateSize();update();});
  }
  button.onclick=()=>{photoOnly=!photoOnly;button.setAttribute('aria-pressed',String(photoOnly));fitPreferredCity();update();};
  panel.addEventListener('click',event=>{
    const target=event.target.closest('button');if(!target)return;
    if(target.dataset.mapDetail) api.detail(target.dataset.mapDetail);
    if(target.dataset.mapFocus){const h=byId.get(target.dataset.mapFocus);if(h)select(h);}
    if(target.dataset.mapSave){api.saveHome(target.dataset.mapSave);target.textContent='♥ Saved';}
  });
  window.addEventListener('fundit:map',open);
  window.addEventListener('fundit:preferences',()=>{if(map&&!panel.hidden){fitPreferredCity();update();}});
  window.addEventListener('fundit:saved',update);
  window.addEventListener('fundit:view',event=>{if(event.detail==='discover'&&!panel.hidden)open();});
})();
