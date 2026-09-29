const RESERVED = new Set(['www','api','ceo','admin','mail','app','cdn','assets','support','static']);
function validSlug(slug) {
  return typeof slug === 'string' && /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(slug) && !RESERVED.has(slug);
}
function generatedSlug(value) {
  const base=String(value||'center').toLowerCase().replace(/['‘’"]/g,'').replace(/[^a-z0-9]+/g,'-').slice(0,50).replace(/^-+|-+$/g,'') || 'center';
  return RESERVED.has(base)?`${base}-center`:base;
}
function trialDays(value, fallback=7) {
  const days=Number(value === undefined || value === null || value === '' ? fallback : value);
  if(![3,7,10].includes(days))throw new Error('Sinov muddati 3, 7 yoki 10 kun bo‘lsin');
  return days;
}
module.exports={validSlug,generatedSlug,trialDays};
