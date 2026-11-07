/* Preference similarity only. No protected characteristics, lending or condition score. */
(function (scope) {
  'use strict';
  const known = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
  const clamp = value => Math.max(0, Math.min(1, value));
  function matchHome(home, preferences = {}) {
    const criteria = [];
    const add = (label, weight, active, available, ratio, detail) => {
      if (active) criteria.push({label, weight, known: available, ratio: available ? clamp(ratio) : null, detail: available ? detail : 'Unknown in source'});
    };
    const p = preferences;
    add('Budget', 35, Number(p.maxPrice) > 0, known(home.price), 2 - Number(home.price) / Number(p.maxPrice), Number(home.price) <= Number(p.maxPrice) ? 'Within your budget' : 'Above your budget');
    add('Location', 25, !!p.city && p.city !== 'all', !!home.city, String(home.city).toLowerCase() === String(p.city).toLowerCase() ? 1 : 0, home.city);
    add('Bedrooms', 15, Number(p.beds) > 0, known(home.bedrooms), Number(home.bedrooms) / Number(p.beds), `${home.bedrooms} beds · want ${p.beds}+`);
    add('Bathrooms', 10, Number(p.baths) > 0, known(home.bathrooms), Number(home.bathrooms) / Number(p.baths), `${home.bathrooms} baths · want ${p.baths}+`);
    add('Home type', 10, !!p.type && p.type !== 'all', !!home.property_type, home.property_type === p.type ? 1 : 0, String(home.property_type || '').replaceAll('_', ' '));
    const hoaActive = known(p.maxHoa) && Number(p.maxHoa) >= 0;
    add('HOA', 5, hoaActive, known(home.hoa), Number(p.maxHoa) === 0 ? (Number(home.hoa) === 0 ? 1 : 0) : 2 - Number(home.hoa) / Number(p.maxHoa), Number(home.hoa) <= Number(p.maxHoa) ? 'Within your HOA limit' : 'Above your HOA limit');
    const total = criteria.reduce((sum, c) => sum + c.weight, 0);
    const available = criteria.filter(c => c.known);
    const weight = available.reduce((sum, c) => sum + c.weight, 0);
    return {score: weight ? Math.round(available.reduce((sum, c) => sum + c.weight * c.ratio, 0) / weight * 50) / 10 : null, coverage: total ? Math.round(weight / total * 100) : 0, criteria};
  }
  scope.FUNDIT_MATCH = matchHome;
  if (typeof module !== 'undefined' && module.exports) module.exports = matchHome;
})(typeof window !== 'undefined' ? window : globalThis);
