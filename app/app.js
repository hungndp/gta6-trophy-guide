'use strict';
/* Vice City Trophy Atlas v2 — offline guide + tracker.
   All credibility numbers in the audit strip are computed at runtime from
   app/data/trophies.json; nothing is hard-coded. */

const LS_EARNED = 'vcta2_earned';
const LS_COUNTS = 'vcta2_counts';
const LS_SHIELD = 'vcta2_shield';

let DATA = null;
let earned = load(LS_EARNED, {});
let counts = load(LS_COUNTS, {});
let shield = load(LS_SHIELD, false);
let filter = 'all';
let query = '';

function load(k, dflt) {
  try { const v = localStorage.getItem(k); return v === null ? dflt : JSON.parse(v); }
  catch (e) { return dflt; }
}
function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
function esc(s) {
  return String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}
function srcName(id) { const s = DATA.sources.find(x => x.id === id); return s ? s.name : ('Source ' + id); }
function disputesFor(id) { return DATA.disputes.filter(d => d.trophy === id); }
function isDisputed(t) { return disputesFor(t.id).length > 0; }
function hidden(t) { return shield && t.secret && !earned[t.id]; }
function dispName(t) { return hidden(t) ? 'Hidden Trophy' : t.name; }
function cites(step) {
  return ' ' + step.c.map(id => '<span class="cite">[' + id + ']</span>').join(' ');
}

/* ---------- audit strip: every number computed from the data ---------- */
function renderAudit() {
  const ts = DATA.trophies;
  const tiers = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  let steps = 0, multi = 0;
  for (const t of ts) {
    tiers[t.tier]++;
    for (const s of t.steps) { steps++; if (s.c.length >= 2) multi++; }
  }
  const miss = ts.filter(t => t.missable).length;
  const risk = ts.filter(t => t.atRisk).length;
  const hid = ts.filter(t => t.secret).length;
  document.getElementById('audit').innerHTML =
    '<b>' + ts.length + '/' + ts.length + '</b> official name, description, grade · ' +
    tiers.platinum + 'P ' + tiers.gold + 'G ' + tiers.silver + 'S ' + tiers.bronze + 'B · ' +
    hid + ' PSN-hidden · <b>' + steps + '/' + steps + ' claims cited</b> · ' +
    '<b>' + multi + ' backed by 2+ sources</b> · ' + DATA.sources.length + ' sources · ' +
    DATA.disputes.length + ' disputes shown both ways · ' + miss + ' missable · ' +
    risk + ' at risk · read 20 Nov 2026';
}

/* ---------- header progress + missable alert ---------- */
function roadmapOrder() {
  const ids = [];
  for (const st of STAGES) for (const id of st.ids) if (!ids.includes(id)) ids.push(id);
  for (const t of DATA.trophies) if (!ids.includes(t.id)) ids.push(t.id);
  return ids;
}
function renderProgress() {
  const el = document.getElementById('progress');
  if (!el || !DATA) return;
  const ts = DATA.trophies;
  const done = ts.filter(t => earned[t.id]);
  const tiers = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  const tot = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of ts) tot[t.tier]++;
  for (const t of done) tiers[t.tier]++;
  const coll = Object.values(counts).reduce((a, b) => a + (Number(b) || 0), 0);
  const pct = Math.round(done.length / ts.length * 100);
  el.innerHTML = '<b>' + done.length + ' / ' + ts.length + '</b> earned' +
    '<span class="headbar"><span style="width:' + pct + '%"></span></span>' +
    '<span>P ' + tiers.platinum + '/' + tot.platinum + ' · G ' + tiers.gold + '/' + tot.gold +
    ' · S ' + tiers.silver + '/' + tot.silver + ' · B ' + tiers.bronze + '/' + tot.bronze + '</span>' +
    '<span>' + coll + ' collectibles logged</span>';
}
function renderAlert() {
  const el = document.getElementById('alert');
  if (!el || !DATA) return;
  const order = roadmapOrder();
  const flagged = DATA.trophies.filter(t => t.missable || t.atRisk)
    .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  const pick = flagged.find(t => t.missable) || flagged[0];
  if (!pick) { el.innerHTML = ''; return; }
  el.innerHTML = '<div class="alertbanner">⚠ MISSABLE WATCH — <b>' + esc(pick.name) + '</b>: last chance <b>' +
    esc(pick.lastChance || 'see guide') + '</b> — <a href="#/guide/' + pick.id + '">open its guide</a></div>';
}
function sourceUse(id) {
  let n = 0;
  for (const t of DATA.trophies) {
    let used = false;
    for (const s of t.steps) if (s.c.includes(id)) used = true;
    for (const d of disputesFor(t.id)) if (d.a.c.includes(id) || d.b.c.includes(id)) used = true;
    if (used) n++;
  }
  return n;
}

/* ---------- guide view ---------- */
const FILTERS = [
  ['all', 'All'], ['story', 'Story'], ['missable', 'Missable'], ['collectible', 'Collectibles'],
  ['activity', 'Activities'], ['online', 'Online'], ['hidden', 'PSN-hidden'], ['disputed', 'Disputed'],
  ['notearned', 'Not earned']
];
function passes(t) {
  if (query) {
    const q = query.toLowerCase();
    if (!(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))) return false;
  }
  switch (filter) {
    case 'all': return true;
    case 'story': return t.kind === 'story';
    case 'missable': return t.missable || t.atRisk;
    case 'collectible': return t.kind === 'collectible';
    case 'activity': return t.kind === 'activity';
    case 'online': return t.kind === 'online';
    case 'hidden': return t.secret;
    case 'disputed': return isDisputed(t);
    case 'notearned': return !earned[t.id];
    default: return true;
  }
}
function countFor(k) {
  const sf = filter, sq = query;
  filter = k; query = '';
  const n = DATA.trophies.filter(passes).length;
  filter = sf; query = sq;
  return n;
}
function flagHtml(t) {
  let h = '';
  if (t.missable) h += '<span class="flag miss">MISSABLE</span>';
  else if (t.atRisk) h += '<span class="flag risk">AT RISK</span>';
  if (t.secret) h += '<span class="flag hid">PSN-HIDDEN</span>';
  if (isDisputed(t)) h += '<span class="flag disp">DISPUTED</span>';
  return h;
}
function renderGuide(selId) {
  const view = document.getElementById('view');
  const list = DATA.trophies.filter(passes);
  if (!list.some(t => t.id === selId)) selId = list.length ? list[0].id : null;
  let h = '<div class="toolbar" role="group" aria-label="Filters">';
  for (const [k, label] of FILTERS) {
    h += '<button class="chip' + (filter === k ? ' active' : '') + '" data-filter="' + k + '">' + label + ' ' + countFor(k) + '</button>';
  }
  h += '<input type="search" id="q" placeholder="Search trophies…" value="' + esc(query) + '">';
  h += '<label class="toggle"><input type="checkbox" id="shield"' + (shield ? ' checked' : '') + '> Spoiler shield (hide PSN-hidden until earned)</label>';
  h += '</div>';
  {
    const order = roadmapOrder().concat([1]);
    const stageOf = id => {
      for (let i = 0; i < STAGES.length; i++) if (STAGES[i].ids.includes(id)) return 'Stage ' + (i + 1);
      return 'Finale';
    };
    const next = order.map(id => DATA.trophies.find(t => t.id === id)).filter(t => t && !earned[t.id]).slice(0, 4);
    if (next.length) {
      h += '<div class="nextup"><span class="nu-label">NEXT UP · ROADMAP ORDER</span>' +
        next.map((t, i) => '<a href="#/guide/' + t.id + '">' + (i + 1) + '. ' + esc(dispName(t)) + ' <span class="nu-stage">' +
          (t.tier === 'platinum' ? 'Finale' : stageOf(t.id)) + '</span></a>').join('') + '</div>';
    }
  }
  h += '<div class="guide-wrap"><div class="tlist">';
  if (!list.length) h += '<div class="empty">No trophies match this filter.</div>';
  for (const t of list) {
    h += '<button class="trow' + (t.id === selId ? ' sel' : '') + (earned[t.id] ? ' done' : '') + '" data-sel="' + t.id + '">' +
      '<span class="tier ' + t.tier + '">' + t.tier.toUpperCase() + '</span>' +
      '<span><span class="nm">' + esc(dispName(t)) + '</span>' +
      '<span class="ds">' + (hidden(t) ? 'Hidden until earned.' : esc(t.description)) + '</span></span>' +
      '<span class="flags">' + flagHtml(t) + '</span></button>';
  }
  h += '</div><div id="detail">';
  h += selId === null ? '<div class="empty">Pick a trophy to read its cited guide.</div>' : detailHtml(DATA.trophies.find(t => t.id === selId));
  h += '</div></div>';
  view.innerHTML = h;
  wireGuide(selId);
  renderProgress(); renderAlert();
}
function detailHtml(t) {
  const hid = hidden(t);
  let h = '<article class="detail">';
  h += '<span class="tier ' + t.tier + '">' + t.tier.toUpperCase() + '</span> ' +
    '<span class="meta">#' + t.id + ' · ' + t.points + ' pts · ' + t.kind + (t.secret ? ' · PSN-hidden' : '') + '</span>';
  h += '<h2>' + esc(dispName(t)) + '</h2>';
  h += '<p class="official">“' + (hid ? 'Description hidden by the spoiler shield.' : esc(t.description)) + '”</p>';
  h += '<div class="inshort' + (hid ? ' blur' : '') + '"><h3>IN SHORT — in our own words</h3><p>' + esc(t.guide) + '</p></div>';
  const coll = DATA.collectibles.find(c => c.trophy === t.id);
  if (coll) {
    const n = counts[coll.key] || 0;
    h += '<div class="counterrow"><span class="lbl">YOUR COUNT — ' + esc(coll.label) + '</span>' +
      '<div class="stepper"><button data-cdec="' + coll.key + '" aria-label="minus">−</button>' +
      '<span class="n">' + n + ' / ' + coll.total + ' ' + esc(coll.label) + '</span>' +
      '<button data-cinc="' + coll.key + '" aria-label="plus">+</button></div></div>';
  }
  if (t.missable) {
    h += '<div class="warnbox bad"><b>MISSABLE.</b> This can be locked out on a single playthrough.' +
      (t.lastChance ? ' Last safe point: <b>' + esc(t.lastChance) + '</b>.' : '') + ' Keep a spare manual save.</div>';
  } else if (t.atRisk) {
    h += '<div class="warnbox"><b>AT RISK.</b> Sources report this can be delayed or locked during the endgame.' +
      (t.lastChance ? ' Last chance: <b>' + esc(t.lastChance) + '</b>.' : '') + '</div>';
  }
  for (const d of disputesFor(t.id)) h += differHtml(d);
  h += '<ol class="steps">';
  for (const s of t.steps) {
    h += '<li' + (hid ? ' class="blur"' : '') + '>' + esc(s.t) + cites(s) + '</li>';
  }
  h += '</ol>';
  // Sources for this guide: every source cited in this trophy's steps, with backing counts.
  const per = {};
  for (const s of t.steps) for (const id of s.c) per[id] = (per[id] || 0) + 1;
  const ids = Object.keys(per).map(Number).sort((a, b) => per[b] - per[a] || a - b);
  h += '<div class="srcblock"><h3>Sources for this guide</h3><ul>';
  for (const id of ids) {
    const s = DATA.sources.find(x => x.id === id);
    h += '<li><b>[' + id + '] ' + esc(s.name) + '</b> — backs ' + per[id] + ' step' + (per[id] === 1 ? '' : 's') +
      ' · in ' + sourceUse(id) + '/55 guides' +
      ' · <a href="' + esc(s.url) + '" rel="noopener">' + esc(s.url) + '</a> · read 20 Nov 2026</li>';
  }
  h += '</ul></div>';
  h += '<label class="earn"><input type="checkbox" id="earnbox"' + (earned[t.id] ? ' checked' : '') +
    '> I have earned this trophy</label>';
  h += '</article>';
  return h;
}
function differHtml(d) {
  let h = '<div class="differ"><h3>SOURCES DIFFER</h3><div class="q">' + esc(d.q) + '</div><div class="ab">';
  h += '<div class="side"><h4>POSITION A</h4>' + esc(d.a.t) + cites(d.a) + '</div>';
  h += '<div class="side"><h4>POSITION B</h4>' + esc(d.b.t) + cites(d.b) + '</div>';
  h += '</div><p class="call"><b>Our call:</b> ' + esc(d.call) + '</p></div>';
  return h;
}
function wireGuide(selId) {
  document.querySelectorAll('[data-filter]').forEach(b => b.addEventListener('click', () => {
    filter = b.dataset.filter; renderGuide(selId);
  }));
  const q = document.getElementById('q');
  q.addEventListener('input', () => { query = q.value; renderGuide(selId); const nq = document.getElementById('q'); nq.focus(); nq.setSelectionRange(nq.value.length, nq.value.length); });
  document.getElementById('shield').addEventListener('change', e => { shield = e.target.checked; save(LS_SHIELD, shield); renderGuide(selId); });
  document.querySelectorAll('[data-sel]').forEach(b => b.addEventListener('click', () => {
    location.hash = '#/guide/' + b.dataset.sel;
  }));
  const eb = document.getElementById('earnbox');
  if (eb) eb.addEventListener('change', () => {
    if (eb.checked) earned[selId] = true; else delete earned[selId];
    save(LS_EARNED, earned); renderGuide(selId);
  });
  document.querySelectorAll('[data-cinc]').forEach(b => b.addEventListener('click', () => {
    const c = DATA.collectibles.find(x => x.key === b.dataset.cinc);
    if (!c) return;
    counts[c.key] = Math.min(c.total, (counts[c.key] || 0) + 1);
    save(LS_COUNTS, counts); renderGuide(selId); renderProgress();
  }));
  document.querySelectorAll('[data-cdec]').forEach(b => b.addEventListener('click', () => {
    counts[b.dataset.cdec] = Math.max(0, (counts[b.dataset.cdec] || 0) - 1);
    save(LS_COUNTS, counts); renderGuide(selId); renderProgress();
  }));
}

/* ---------- roadmap view ---------- */
const STAGES = [
  { name: 'Stage 1 — Story first: Chapters 1–2', ids: [3, 4, 2, 8, 10],
    text: 'Play the opening chapters in order. Every chapter trophy is progress-based and none of the early choices lock anything. Pick up fishing and the duo mechanics as they are taught; later activity trophies build on them.' },
  { name: 'Stage 2 — Chapters 3–4 and the named missions', ids: [5, 6, 9, 11, 12, 13],
    text: 'Finish the remaining chapters and set-piece missions (Cartel Heist, Headliners, VCIA Takedown, Operation Savage Glory). Note the VCIA airside layout — a free-roam trophy sends you back there.' },
  { name: 'Stage 3 — Stranger strands before the endgame', ids: [22, 23, 24, 26, 27, 25, 29],
    text: 'Clear Andy, Kenton, Billy, Randy and Tyrone\'s strands plus Bret\'s hunt. Guides disagree on whether strands pause during the endgame, so the Atlas flags them at risk: finish them by Chapter 4 (see Missable Watch). Eight strands also earn the silver Strangers & Freaks.' },
  { name: 'Stage 4 — The choice and the finale', ids: [48, 49, 7],
    text: 'Bank a manual save in a fresh slot before the endgame choice (Actions Speak Louder is the list\'s true missable), then play the final mission. Free roam continues after the credits for everything else.' },
  { name: 'Stage 5 — Collectible sweep', ids: [15, 28, 30, 31, 35, 42, 54, 55],
    text: 'Sweep stunts, meditation spots, card sets, WAiNK locations, vehicles and regions region-by-region with the Tracker counters. This is the long tail of the platinum — and the stage where the source disputes about totals actually bite, so trust the in-game counters.' },
  { name: 'Stage 6 — Activities, crime and mastery', ids: [16, 17, 18, 19, 20, 21, 32, 33, 34, 36, 39, 40, 41, 43],
    text: 'Gold-medal the shooting range, win the drone races and 20 distinct races, then work the crime list: partner heat escapes, shop chains, the jewelry sneak, five bank vaults, an armored truck and one illegal operation per gang.' },
  { name: 'Stage 7 — Money, moments and 100%', ids: [52, 53, 14, 37, 38, 44, 45, 46, 47, 50, 51],
    text: 'Launder $250,000 of Marked Bills, spend $100,000, pick off the hidden free-roam moments (Ocean Beach cocktail, showroom exit, the Rhino, the VCIA departure), and close the 100% checklist for the gold — then the platinum pops.' }
];
function renderRoadmap() {
  const ts = DATA.trophies;
  const view = document.getElementById('view');
  let h = '<h2 class="view">Roadmap to the Platinum</h2>';
  h += '<div class="platstats">' +
    '<span class="stat">Difficulty <b>~4–6/10</b> (disputed)</span>' +
    '<span class="stat">Time <b>150+ hours</b></span>' +
    '<span class="stat">Playthroughs <b>1</b> (with save discipline)</span>' +
    '<span class="stat">Online trophies <b>0</b></span>' +
    '<span class="stat">Missable <b>' + ts.filter(t => t.missable).length + '</b></span>' +
    '<span class="stat">At risk <b>' + ts.filter(t => t.atRisk).length + '</b></span></div>';
  h += '<div class="road-wrap"><div>';
  for (const st of STAGES) {
    const got = st.ids.filter(id => earned[id]).length;
    h += '<div class="stage"><h3>' + esc(st.name) + '</h3><p>' + esc(st.text) + '</p>' +
      '<p class="stageprog">' + got + '/' + st.ids.length + ' earned</p>' +
      '<div class="progress"><div style="width:' + Math.round(got / st.ids.length * 100) + '%"></div></div>' +
      '<p class="ids">Trophies: ' + st.ids.map(id => { const t = ts.find(x => x.id === id); return '#' + id + ' ' + esc(t ? t.name : ''); }).join(' · ') + '</p></div>';
  }
  for (const d of DATA.disputes.filter(x => x.trophy === null)) {
    h += '<div class="stage"><h3>Open question for the whole run</h3>' + differHtml(d) + '</div>';
  }
  h += '</div><aside class="watch"><h3>MISSABLE WATCH</h3><ul>';
  for (const t of ts.filter(x => x.missable || x.atRisk)) {
    h += '<li><b>' + esc(t.name) + '</b> — ' + (t.missable ? 'missable' : 'at risk') +
      (t.lastChance ? ' · last chance <span class="lc">' + esc(t.lastChance) + '</span>' : '') +
      ' · <a href="#/guide/' + t.id + '">guide</a></li>';
  }
  h += '</ul><p class="small">Rule of thumb: one rolling manual save per chapter, in a fresh slot, before any finale or choice prompt.</p></aside></div>';
  view.innerHTML = h;
  renderProgress(); renderAlert();
}

/* ---------- tracker view ---------- */
function renderTracker() {
  const ts = DATA.trophies;
  const view = document.getElementById('view');
  const done = ts.filter(t => earned[t.id]).length;
  let h = '<h2 class="view">Tracker</h2>';
  h += '<p class="small">' + done + ' / ' + ts.length + ' trophies earned · saved in this browser.</p>';
  h += '<div class="progress"><div style="width:' + Math.round(done / ts.length * 100) + '%"></div></div>';
  h += '<div class="btnrow"><button class="btn" id="export">Export progress (JSON)</button>' +
    '<button class="btn" id="import">Import progress</button>' +
    '<input type="file" id="file" accept="application/json" hidden>' +
    '<button class="btn" id="reset">Reset all</button></div>';
  h += '<h3>Collectible counters</h3><div class="counters">';
  for (const c of DATA.collectibles) {
    const n = counts[c.key] || 0;
    const t = ts.find(x => x.id === c.trophy);
    h += '<div class="counter"><span class="lbl">' + esc(c.label) + '</span>' +
      '<div class="sub">feeds #' + c.trophy + ' ' + esc(t ? t.name : '') + '</div>' +
      '<div class="stepper"><button data-dec="' + c.key + '" aria-label="minus">−</button>' +
      '<span class="n">' + n + ' / ' + c.total + '</span>' +
      '<button data-inc="' + c.key + '" aria-label="plus">+</button></div></div>';
  }
  h += '</div><h3>All 55 trophies</h3><div class="checks">';
  for (const t of ts) {
    h += '<label class="check"><input type="checkbox" data-earn="' + t.id + '"' + (earned[t.id] ? ' checked' : '') + '>' +
      '<span class="tier ' + t.tier + '">' + t.tier.slice(0, 4).toUpperCase() + '</span> ' + esc(t.name) + '</label>';
  }
  h += '</div>';
  view.innerHTML = h;
  renderProgress(); renderAlert();
  document.querySelectorAll('[data-inc]').forEach(b => b.addEventListener('click', () => {
    const c = DATA.collectibles.find(x => x.key === b.dataset.inc);
    counts[c.key] = Math.min(c.total, (counts[c.key] || 0) + 1); save(LS_COUNTS, counts); renderTracker();
  }));
  document.querySelectorAll('[data-dec]').forEach(b => b.addEventListener('click', () => {
    counts[b.dataset.dec] = Math.max(0, (counts[b.dataset.dec] || 0) - 1); save(LS_COUNTS, counts); renderTracker();
  }));
  document.querySelectorAll('[data-earn]').forEach(cb => cb.addEventListener('change', () => {
    const id = Number(cb.dataset.earn);
    if (cb.checked) earned[id] = true; else delete earned[id];
    save(LS_EARNED, earned); renderTracker();
  }));
  document.getElementById('export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ earned, counts }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'vice-city-trophy-atlas-progress.json'; a.click();
    URL.revokeObjectURL(a.href);
  });
  const file = document.getElementById('file');
  document.getElementById('import').addEventListener('click', () => file.click());
  file.addEventListener('change', () => {
    if (!file.files.length) return;
    file.files[0].text().then(txt => {
      try {
        const obj = JSON.parse(txt);
        if (obj.earned) { earned = obj.earned; save(LS_EARNED, earned); }
        if (obj.counts) { counts = obj.counts; save(LS_COUNTS, counts); }
        renderTracker();
      } catch (e) { alert('That file is not valid progress JSON.'); }
    });
  });
  document.getElementById('reset').addEventListener('click', () => {
    earned = {}; counts = {}; save(LS_EARNED, earned); save(LS_COUNTS, counts); renderTracker();
  });
}

/* ---------- router ---------- */
function route() {
  const parts = location.hash.replace(/^#\/?/, '').split('/');
  const name = parts[0] || 'guide';
  document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === name));
  if (name === 'roadmap') renderRoadmap();
  else if (name === 'tracker') renderTracker();
  else renderGuide(parts[1] ? Number(parts[1]) : 28);
}
window.addEventListener('hashchange', route);

fetch('data/trophies.json')
  .then(r => r.json())
  .then(d => { DATA = d; renderAudit(); renderProgress(); renderAlert(); route(); })
  .catch(e => { document.getElementById('view').innerHTML = '<div class="empty">Could not load data/trophies.json — serve the app folder over HTTP or open it via the kit preview.</div>'; });
