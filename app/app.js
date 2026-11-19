/* Vice City Trophy Atlas — checklist, filters, spoiler guard, roadmap, export/import.
   No network beyond loading app/data/trophies.json from this app's own files. */
(function () {
  'use strict';

  var STORAGE_KEY = 'vice-city-trophy-atlas-v1';
  var DATA_URL = 'data/trophies.json';

  var state = {
    trophies: [],
    roadmap: [],
    counts: null,
    earned: {},
    spoiler: true,
    view: 'checklist',
    kind: 'all',
    tier: 'all',
    earnedFilter: 'all',
    query: '',
    selectedId: null
  };

  var els = {};
  ['trophyList', 'emptyNote', 'searchInput', 'kindFilter', 'tierFilter', 'earnedFilter',
   'spoilerToggle', 'exportBtn', 'importBtn', 'importFile', 'resetBtn', 'saveNote', 'countNote',
   'progressFill', 'earnedCount', 'earnedPct', 'pointsCount', 'roadmapSection', 'roadmapStages',
   'detailPanel', 'detailName', 'detailMeta', 'detailDesc', 'detailGuide', 'detailSources',
   'detailClose', 'detailEarned', 'viewTabs'].forEach(function (id) { els[id] = document.getElementById(id); });

  function loadEarned() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (e) { return {}; }
  }

  function saveEarned() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.earned));
      els.saveNote.textContent = 'Progress saved in this browser.';
    } catch (e) {
      els.saveNote.textContent = 'Could not save in this browser (storage blocked). Use Export to keep a copy.';
    }
  }

  function tierLabel(t) { return t.charAt(0).toUpperCase() + t.slice(1); }

  function isEarned(t) { return !!state.earned[t.id]; }

  function isSpoilerHidden(t) {
    return state.spoiler && t.hidden && t.kind === 'story' && !isEarned(t);
  }

  function displayName(t) {
    return isSpoilerHidden(t) ? 'Hidden trophy — earn it to reveal' : t.name;
  }

  function displayDesc(t) {
    return isSpoilerHidden(t) ? 'A hidden story trophy. Its name and description stay secret until you earn it.' : t.description;
  }

  function matchesFilters(t) {
    if (state.kind === 'missable' && !t.missable) return false;
    if (state.kind !== 'all' && state.kind !== 'missable' && t.kind !== state.kind) return false;
    if (state.tier !== 'all' && t.tier !== state.tier) return false;
    if (state.earnedFilter === 'earned' && !isEarned(t)) return false;
    if (state.earnedFilter === 'unearned' && isEarned(t)) return false;
    if (state.query) {
      var hay = (t.name + ' ' + t.description + ' ' + t.guide).toLowerCase();
      if (hay.indexOf(state.query) < 0) return false;
    }
    return true;
  }

  function trophyCard(t) {
    var card = document.createElement('article');
    card.className = 'trophy-card tier-' + t.tier + (isEarned(t) ? ' earned' : '');
    card.dataset.id = String(t.id);

    var check = document.createElement('label');
    check.className = 'check';
    var box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = isEarned(t);
    box.setAttribute('aria-label', 'Mark ' + t.name + ' earned');
    box.addEventListener('change', function () {
      state.earned[t.id] = box.checked;
      if (!box.checked) delete state.earned[t.id];
      saveEarned();
      renderAll();
    });
    check.appendChild(box);
    check.appendChild(document.createElement('span'));
    card.appendChild(check);

    var body = document.createElement('div');
    body.className = 'card-body';

    var title = document.createElement('h3');
    title.textContent = displayName(t);
    body.appendChild(title);

    var meta = document.createElement('p');
    meta.className = 'card-meta';
    var bits = [tierLabel(t.tier), t.points + ' pts'];
    if (t.hidden) bits.push('Hidden');
    if (t.missable) bits.push('MISSABLE');
    if (t.count) bits.push('Count: ' + t.count);
    if (t.chapter) bits.push(t.chapter);
    meta.textContent = bits.join(' · ');
    body.appendChild(meta);

    var desc = document.createElement('p');
    desc.className = 'card-desc';
    desc.textContent = displayDesc(t);
    body.appendChild(desc);

    var guide = document.createElement('p');
    guide.className = 'card-guide';
    guide.textContent = isSpoilerHidden(t)
      ? 'Guide hidden with the spoiler setting — earn the trophy to reveal it.'
      : t.guide;
    body.appendChild(guide);

    var src = document.createElement('p');
    src.className = 'card-sources';
    src.textContent = 'Sources: ' + (t.sources || []).join('; ');
    body.appendChild(src);

    var open = document.createElement('button');
    open.type = 'button';
    open.className = 'open-guide';
    open.textContent = 'Open full guide';
    open.addEventListener('click', function () { selectTrophy(t.id, true); });
    body.appendChild(open);

    card.appendChild(body);
    return card;
  }

  function renderList() {
    var list = els.trophyList;
    list.textContent = '';
    var shown = state.trophies.filter(matchesFilters);
    shown.forEach(function (t) { list.appendChild(trophyCard(t)); });
    els.emptyNote.hidden = shown.length !== 0;
    els.countNote.textContent = shown.length + ' of 55 trophies shown';
  }

  function renderProgress() {
    var earned = state.trophies.filter(isEarned);
    var points = earned.reduce(function (sum, t) { return sum + (t.points || 0); }, 0);
    var pct = state.trophies.length ? Math.round(earned.length / state.trophies.length * 100) : 0;
    els.earnedCount.textContent = String(earned.length);
    els.earnedPct.textContent = pct + '%';
    els.pointsCount.textContent = String(points);
    els.progressFill.style.width = pct + '%';
  }

  function renderRoadmap() {
    var wrap = els.roadmapStages;
    wrap.textContent = '';
    var byId = {};
    state.trophies.forEach(function (t) { byId[t.id] = t; });
    state.roadmap.forEach(function (stage) {
      var li = document.createElement('li');
      li.className = 'roadmap-stage';
      var head = document.createElement('div');
      head.className = 'stage-head';
      var num = document.createElement('span');
      num.className = 'stage-num';
      num.textContent = 'Stage ' + stage.stage;
      var title = document.createElement('h3');
      title.textContent = stage.title;
      head.appendChild(num);
      head.appendChild(title);
      li.appendChild(head);
      var note = document.createElement('p');
      note.textContent = stage.note;
      li.appendChild(note);
      var chips = document.createElement('p');
      chips.className = 'stage-trophies';
      stage.trophies.forEach(function (id) {
        var t = byId[id];
        if (!t) return;
        var chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'stage-chip' + (isEarned(t) ? ' done' : '');
        chip.textContent = (isEarned(t) ? '✓ ' : '') + displayName(t);
        chip.addEventListener('click', function () { selectTrophy(id, true); });
        chips.appendChild(chip);
      });
      li.appendChild(chips);
      wrap.appendChild(li);
    });
  }

  function renderDetail() {
    var panel = els.detailPanel;
    var t = state.trophies.find(function (x) { return x.id === state.selectedId; });
    if (!t) { panel.hidden = true; return; }
    panel.hidden = false;
    els.detailName.textContent = displayName(t);
    var bits = [tierLabel(t.tier), t.points + ' points', t.kind];
    if (t.hidden) bits.push('Hidden on PlayStation until earned');
    if (t.missable) bits.push('MISSABLE — do this before the finale');
    if (t.count) bits.push('Target: ' + t.count);
    els.detailMeta.textContent = bits.join(' · ');
    els.detailDesc.textContent = displayDesc(t);
    els.detailGuide.textContent = isSpoilerHidden(t)
      ? 'Guide hidden with the spoiler setting — earn the trophy to reveal it.'
      : t.guide;
    els.detailSources.textContent = '';
    (t.sources || []).forEach(function (s) {
      var li = document.createElement('li');
      li.textContent = s;
      els.detailSources.appendChild(li);
    });
    els.detailEarned.checked = isEarned(t);
  }

  function renderTabs() {
    var buttons = els.viewTabs.querySelectorAll('button');
    buttons.forEach(function (b) {
      b.classList.toggle('active', b.dataset.view === state.view);
    });
    els.roadmapSection.hidden = state.view !== 'roadmap';
  }

  function applyView(view) {
    state.view = view;
    if (view === 'missable') { state.kind = 'missable'; els.kindFilter.value = 'missable'; }
    if (view === 'collectibles') { state.kind = 'collectibles'; els.kindFilter.value = 'collectibles'; }
    if (view === 'checklist') { state.kind = 'all'; els.kindFilter.value = 'all'; }
    renderTabs();
    renderList();
    if (view === 'roadmap') {
      els.roadmapSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function renderAll() {
    renderList();
    renderProgress();
    renderRoadmap();
    renderDetail();
  }

  function selectTrophy(id, scroll) {
    state.selectedId = id;
    renderDetail();
    if (scroll) els.detailPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function exportProgress() {
    var payload = {
      app: 'vice-city-trophy-atlas',
      version: 1,
      exportedAt: new Date().toISOString(),
      earned: Object.keys(state.earned).filter(function (k) { return state.earned[k]; }).map(Number).sort(function (a, b) { return a - b; })
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'gta6-trophy-progress.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    els.saveNote.textContent = 'Exported ' + payload.earned.length + ' earned trophies to a file.';
  }

  function importProgress(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(String(reader.result));
        var ids = Array.isArray(data) ? data : data.earned;
        if (!Array.isArray(ids)) throw new Error('no earned list');
        var next = {};
        ids.forEach(function (id) {
          if (state.trophies.some(function (t) { return t.id === Number(id); })) next[Number(id)] = true;
        });
        state.earned = next;
        saveEarned();
        renderAll();
        els.saveNote.textContent = 'Imported progress: ' + Object.keys(next).length + ' trophies earned.';
      } catch (e) {
        els.saveNote.textContent = 'Import failed: that file is not a progress export from this guide.';
      }
    };
    reader.readAsText(file);
  }

  function bindControls() {
    els.searchInput.addEventListener('input', function () {
      state.query = els.searchInput.value.trim().toLowerCase();
      renderList();
    });
    els.kindFilter.addEventListener('change', function () {
      state.kind = els.kindFilter.value;
      state.view = state.kind === 'missable' ? 'missable'
        : state.kind === 'collectibles' ? 'collectibles' : 'checklist';
      renderTabs();
      renderList();
    });
    els.tierFilter.addEventListener('change', function () {
      state.tier = els.tierFilter.value;
      renderList();
    });
    els.earnedFilter.addEventListener('change', function () {
      state.earnedFilter = els.earnedFilter.value;
      renderList();
    });
    els.spoilerToggle.addEventListener('change', function () {
      state.spoiler = els.spoilerToggle.checked;
      renderAll();
    });
    els.viewTabs.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-view]');
      if (btn) applyView(btn.dataset.view);
    });
    els.exportBtn.addEventListener('click', exportProgress);
    els.importBtn.addEventListener('click', function () { els.importFile.click(); });
    els.importFile.addEventListener('change', function () {
      if (els.importFile.files && els.importFile.files[0]) importProgress(els.importFile.files[0]);
      els.importFile.value = '';
    });
    els.resetBtn.addEventListener('click', function () {
      if (window.confirm('Reset the checklist? All earned marks will be cleared.')) {
        state.earned = {};
        saveEarned();
        renderAll();
      }
    });
    els.detailClose.addEventListener('click', function () {
      state.selectedId = null;
      renderDetail();
    });
    els.detailEarned.addEventListener('change', function () {
      if (state.selectedId == null) return;
      if (els.detailEarned.checked) state.earned[state.selectedId] = true;
      else delete state.earned[state.selectedId];
      saveEarned();
      renderAll();
    });
    window.addEventListener('hashchange', readHash);
  }

  function readHash() {
    var hash = window.location.hash.replace(/^#/, '');
    if (hash === 'roadmap' || hash === 'missable' || hash === 'collectibles' || hash === 'checklist') {
      applyView(hash);
      return;
    }
    var m = /^trophy-(\d+)$/.exec(hash);
    if (m) selectTrophy(Number(m[1]), false);
  }

  function init() {
    state.earned = loadEarned();
    bindControls();
    fetch(DATA_URL).then(function (res) {
      if (!res.ok) throw new Error('trophies.json failed to load');
      return res.json();
    }).then(function (data) {
      state.trophies = data.trophies || [];
      state.roadmap = data.roadmap || [];
      state.counts = data.counts || null;
      renderAll();
      readHash();
    }).catch(function () {
      els.trophyList.innerHTML = '<p class="empty-note">The trophy data could not be loaded. Reload the page.</p>';
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
