/* ============================================================
   CRM SIMULATOR — JAVASCRIPT
   crm-simulator.js
   ============================================================ */

/* ── COMPANY CONFIG ── */
const CO = {
  generic:      { name: 'GenericCo',     agent: 'AGT-4821', queue: 'GENERAL SUPPORT',    outage: 'System maintenance scheduled this weekend — notify customers if querying an outage' },
  pbtech:       { name: 'PB Tech',        agent: 'PBT-4821', queue: 'TECH SUPPORT — NZ',  outage: 'Known Issue: Online order tracking delays of 24–48 hrs — advise customers accordingly' },
  jbhifi:       { name: 'JB Hi-Fi',       agent: 'JBH-4821', queue: 'CUSTOMER SERVICE',   outage: 'Price match policy updated 15 Apr 2025 — refer to KB article PM-2025-04 for details' },
  harveynorman: { name: 'Harvey Norman',  agent: 'HN-4821',  queue: 'WARRANTY & SERVICE', outage: 'Franchisee system outage: Manukau store — escalate Manukau queries to head office' }
};

/* ── STATE ── */
let curCo       = 'generic';
let tSecs       = 0;
let tRunning    = false;
let tInt        = null;
let acwSecs     = 0;
let acwRunning  = false;
let acwInt      = null;
let curPri      = 'med';
let dragState   = null;
let noteCounter = 0;

/* ── STICKY NOTE CONSTANTS ── */
const NOTE_COLORS = ['yellow', 'blue', 'green', 'pink', 'orange'];
const COLOR_HEX = {
  yellow: '#f5e642',
  blue:   '#4a9eff',
  green:  '#3db87a',
  pink:   '#ff6b9d',
  orange: '#f47920'
};
const TEMPLATE = `CUSTOMER DETAILS
────────────────
Name: 
Account #: 
Phone: 
Email: 
Issue: 

────────────────
Action taken:
Follow-up needed: `;

/* ============================================================
   INIT
   ============================================================ */
function init() {
  loadFields();
  setInterval(updateClock, 1000);
  updateClock();

  // Restore company selection
  const co = ls('crm_co') || 'generic';
  setCompany(co);

  // Restore interaction / case IDs
  const iid = ls('crm_iid');
  const cid = ls('crm_cid');
  if (iid) {
    document.getElementById('intId').textContent    = iid;
    document.getElementById('caseNum').textContent  = cid || 'CASE-00000';
  } else {
    generateNewCase();
  }

  // Restore priority
  setPri(ls('crm_pri') || 'med');

  // Sync status badges
  updStanding();
  updCase();

  // Restore panel/feature toggle states
  loadToggles();

  // Reload sticky notes
  loadNotes();

  // Wire up auto-save for all form fields
  document.querySelectorAll('[data-s]').forEach(el => {
    el.addEventListener('input',  () => saveField(el));
    el.addEventListener('change', () => saveField(el));
  });
}

/* ============================================================
   LOCALSTORAGE HELPERS
   ============================================================ */
function ls(k)    { return localStorage.getItem(k); }
function lset(k, v) { localStorage.setItem(k, v); }

function saveField(el) {
  const k = 'crm_f_' + el.getAttribute('data-s');
  lset(k, el.type === 'checkbox' ? (el.checked ? '1' : '0') : el.value);
}

function loadFields() {
  document.querySelectorAll('[data-s]').forEach(el => {
    const v = ls('crm_f_' + el.getAttribute('data-s'));
    if (v !== null) {
      el.type === 'checkbox' ? (el.checked = v === '1') : (el.value = v);
    }
  });
}

/* ============================================================
   CLOCK
   ============================================================ */
function updateClock() {
  document.getElementById('clockEl').textContent =
    new Date().toLocaleTimeString('en-NZ', { hour12: false });
}

/* ============================================================
   COMPANY SWITCHING
   ============================================================ */
function setCompany(co) {
  curCo = co;
  lset('crm_co', co);
  const c = CO[co];

  // Swap theme class on body
  document.body.className = document.body.className.replace(/theme-\w+/g, '').trim() + ' theme-' + co;
  if (document.body.classList.contains('light-mode')) document.body.classList.add('light-mode');

  // Update topbar labels
  document.getElementById('coName').textContent    = c.name;
  document.getElementById('agentId').textContent   = c.agent;
  document.getElementById('queueName').textContent = c.queue;
  document.getElementById('outageBanner').textContent = '⚠  ' + c.outage;

  // Sync settings radio
  document.querySelectorAll('input[name="co"]').forEach(r => r.checked = r.value === co);

  // Sync topbar tabs
  document.querySelectorAll('.company-tab').forEach(t => t.classList.toggle('active', t.dataset.co === co));
}

function setCoTab(btn) { setCompany(btn.dataset.co); }

/* ============================================================
   CALL TIMER
   ============================================================ */
function tToggle() {
  tRunning ? _tStop() : _tStart();
}

function _tStart() {
  if (tRunning) return;
  tRunning = true;
  document.getElementById('timerDisp').classList.add('running');
  const btn = document.getElementById('tBtnToggle');
  btn.classList.add('running');
  btn.textContent = '■ STOP';
  tInt = setInterval(() => { tSecs++; tRenderDisp(); }, 1000);
}

function _tStop() {
  if (!tRunning) return;
  tRunning = false;
  clearInterval(tInt);
  document.getElementById('timerDisp').classList.remove('running');
  const btn = document.getElementById('tBtnToggle');
  btn.classList.remove('running');
  btn.textContent = '▶ START';
}

// Public alias so saveClose() can still call tStop()
function tStop() { _tStop(); }

function tReset() {
  _tStop();
  tSecs = 0;
  tRenderDisp();
}

function tRenderDisp() {
  const h = String(Math.floor(tSecs / 3600)).padStart(2, '0');
  const m = String(Math.floor((tSecs % 3600) / 60)).padStart(2, '0');
  const s = String(tSecs % 60).padStart(2, '0');
  document.getElementById('timerDisp').textContent = `${h}:${m}:${s}`;
}

/* ============================================================
   ACW TIMER
   ============================================================ */
function acwToggle() {
  acwRunning ? _acwStop() : _acwStart();
}

function _acwStart() {
  if (acwRunning) return;
  acwRunning = true;
  const disp = document.getElementById('acwDisp');
  const btn  = document.getElementById('acwBtnToggle');
  disp.classList.add('running');
  btn.classList.add('running');
  btn.textContent = '■';
  acwInt = setInterval(() => { acwSecs++; acwRenderDisp(); }, 1000);
}

function _acwStop() {
  if (!acwRunning) return;
  acwRunning = false;
  clearInterval(acwInt);
  document.getElementById('acwDisp').classList.remove('running');
  const btn = document.getElementById('acwBtnToggle');
  btn.classList.remove('running');
  btn.textContent = '▶';
}

function acwReset() {
  _acwStop();
  acwSecs = 0;
  acwRenderDisp();
}

function acwRenderDisp() {
  const m = String(Math.floor(acwSecs / 60)).padStart(2, '0');
  const s = String(acwSecs % 60).padStart(2, '0');
  document.getElementById('acwDisp').textContent = `${m}:${s}`;
}

/* ============================================================
   SETTINGS PANEL
   ============================================================ */
function toggleSettings() {
  document.getElementById('sPanel').classList.toggle('open');
  document.getElementById('sOverlay').classList.toggle('open');
}

function closeSettings() {
  document.getElementById('sPanel').classList.remove('open');
  document.getElementById('sOverlay').classList.remove('open');
}

function toggleLight(on) {
  document.body.classList.toggle('light-mode', on);
  lset('crm_light', on ? '1' : '0');
}

function toggleCompact(on) {
  document.querySelectorAll('.sec-body').forEach(el => el.style.padding    = on ? '5px 8px' : '8px 10px');
  document.querySelectorAll('.f-row').forEach(el    => el.style.marginBottom = on ? '4px'    : '7px');
  lset('crm_compact', on ? '1' : '0');
}

function toggleSec(id, show) {
  const el = document.getElementById(id);
  if (el) el.style.display = show ? '' : 'none';
  lset('crm_tog_' + id, show ? '1' : '0');
}

function toggleEl(id, show) {
  const el = document.getElementById(id);
  if (el) el.style.display = show ? '' : 'none';
  lset('crm_tog_' + id, show ? '1' : '0');
}

function toggleSticky(show) {
  document.getElementById('stickyWrap').style.display = show ? '' : 'none';
  document.getElementById('noteFab').style.display    = show ? 'flex' : 'none';
  lset('crm_tog_sticky', show ? '1' : '0');
}

function loadToggles() {
  const panelMap = [
    { id: 'togCaller',  sec: 'sCaller' },
    { id: 'togAcct',    sec: 'sAcct' },
    { id: 'togFlags',   sec: 'sFlags' },
    { id: 'togCase',    sec: 'sCase' },
    { id: 'togActions', sec: 'sActions' },
    { id: 'togHist',    sec: 'sHistory' },
    { id: 'togWrapup',  el:  'wrapupBar' },
    { id: 'togTimer',   el:  'callTimer' },
    { id: 'togOutage',  el:  'outageBanner' },
  ];

  panelMap.forEach(({ id, sec, el }) => {
    const key = 'crm_tog_' + (sec || el);
    const v = ls(key);
    if (v !== null) {
      const show = v === '1';
      const cb = document.getElementById(id);
      if (cb) cb.checked = show;
      if (sec) toggleSec(sec, show);
      else     toggleEl(el, show);
    }
  });

  const sv = ls('crm_tog_sticky');
  if (sv !== null) {
    const show = sv === '1';
    document.getElementById('togSticky').checked = show;
    toggleSticky(show);
  }

  if (ls('crm_light')   === '1') { document.getElementById('togLight').checked   = true; toggleLight(true); }
  if (ls('crm_compact') === '1') { document.getElementById('togCompact').checked = true; toggleCompact(true); }

  // Sync group headers and master toggle to reflect loaded state
  syncGroupToggle('grpLeft',     ['togCaller', 'togAcct',   'togFlags']);
  syncGroupToggle('grpCentre',   ['togCase',   'togActions','togHist', 'togWrapup']);
  syncGroupToggle('grpFeatures', ['togTimer',  'togSticky', 'togOutage']);
  syncMasterToggle();
}

/* ============================================================
   STATUS BADGES
   ============================================================ */
function updStanding() {
  const v = document.getElementById('fStanding').value;
  const b = document.getElementById('standBadge');
  b.className  = 'badge b-' + v;
  b.textContent = v.charAt(0).toUpperCase() + v.slice(1);
}

function updCase() {
  const v = document.getElementById('cStatus').value;
  const b = document.getElementById('caseBadge');
  b.className  = 'badge b-' + v;
  b.textContent = v.charAt(0).toUpperCase() + v.slice(1);
}

/* ============================================================
   PRIORITY SELECTOR
   ============================================================ */
function setPri(p) {
  curPri = p;
  document.querySelectorAll('.pri-btn').forEach(b => b.classList.toggle('active', b.dataset.p === p));
  lset('crm_pri', p);
}

/* ============================================================
   CASE / INTERACTION IDs
   ============================================================ */
function generateNewCase() {
  const iid = 'INT-'  + (10000 + Math.floor(Math.random() * 90000));
  const cid = 'CASE-' + (10000 + Math.floor(Math.random() * 90000));
  document.getElementById('intId').textContent   = iid;
  document.getElementById('caseNum').textContent = cid;
  lset('crm_iid', iid);
  lset('crm_cid', cid);
  toast('↻ New interaction: ' + cid);
}

/* ============================================================
   WRAP-UP / FORM ACTIONS
   ============================================================ */
function saveClose() {
  saveDraft();
  tStop();
  // Auto-start ACW when call closes — reset first so it always starts from 0
  acwReset();
  _acwStart();
  toast('✓ Interaction saved — ACW timer started');
}

function saveDraft() {
  document.querySelectorAll('[data-s]').forEach(saveField);
  toast('✓ Draft saved to browser storage');
}

function newInteraction() {
  if (!confirm('Start a new interaction? Unsaved data will be lost.')) return;
  clearForm();
  generateNewCase();
  toast('⊕ New interaction started');
}

function clearForm() {
  document.querySelectorAll('[data-s]').forEach(el => {
    if (el.type === 'checkbox') el.checked = false;
    else el.value = '';
    localStorage.removeItem('crm_f_' + el.getAttribute('data-s'));
  });
  setPri('med');
  updStanding();
  updCase();
  tReset();
  acwReset();
}

function clearAll() {
  if (!confirm('This will wipe all saved CRM data including sticky notes. Continue?')) return;
  Object.keys(localStorage)
    .filter(k => k.startsWith('crm_'))
    .forEach(k => localStorage.removeItem(k));
  location.reload();
}

/* ============================================================
   TOAST NOTIFICATIONS
   ============================================================ */
function toast(msg) {
  const t = document.createElement('div');
  t.className   = 'toast';
  t.textContent = msg;
  document.getElementById('toastWrap').appendChild(t);
  requestAnimationFrame(() => t.style.opacity = '1');
  setTimeout(() => {
    t.style.opacity = '0';
    setTimeout(() => t.remove(), 220);
  }, 2200);
}

/* ============================================================
   STICKY NOTES
   ============================================================ */
function addNote(content, color, x, y, title, id) {
  const nid = id || ('n' + Date.now() + '_' + noteCounter++);
  const px  = x    != null ? x    : (80 + Math.random() * 300);
  const py  = y    != null ? y    : (60 + Math.random() * 200);
  const nc  = color || 'yellow';
  const txt = content != null ? content : TEMPLATE;
  const tit = title   || 'NOTE';

  const el = document.createElement('div');
  el.className = 'sticky-note sn-' + nc;
  el.id        = nid;
  el.style.cssText = `left:${px}px; top:${py}px; z-index:200;`;

  el.innerHTML = `
    <div class="sn-header" onmousedown="dragStart(event,'${nid}')">
      <input class="sn-title" value="${escH(tit)}" placeholder="NOTE"
             onmousedown="event.stopPropagation()" oninput="saveNotes()">
      <div class="sn-ctrls">
        <button class="sn-btn" onclick="toggleCP('${nid}')" title="Color">◉</button>
        <button class="sn-btn" onclick="delNote('${nid}')"  title="Delete">✕</button>
      </div>
      <div class="sn-cp" id="cp_${nid}">
        ${NOTE_COLORS.map(c =>
          `<div class="sn-cdot" style="background:${COLOR_HEX[c]}" title="${c}"
               onclick="changeColor('${nid}','${c}')"></div>`
        ).join('')}
      </div>
    </div>
    <div class="sn-body">
      <textarea class="sn-ta" oninput="saveNotes()">${escH(txt)}</textarea>
    </div>`;

  document.getElementById('stickyWrap').appendChild(el);
  saveNotes();
}

function escH(s) {
  return String(s)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;');
}

function toggleCP(nid) {
  document.getElementById('cp_' + nid).classList.toggle('open');
}

function changeColor(nid, color) {
  const el = document.getElementById(nid);
  NOTE_COLORS.forEach(c => el.classList.remove('sn-' + c));
  el.classList.add('sn-' + color);
  document.getElementById('cp_' + nid).classList.remove('open');
  saveNotes();
}

function delNote(nid) {
  const el = document.getElementById(nid);
  if (el) el.remove();
  saveNotes();
}

function saveNotes() {
  const notes = [];
  document.querySelectorAll('.sticky-note').forEach(el => {
    const c  = NOTE_COLORS.find(c => el.classList.contains('sn-' + c)) || 'yellow';
    const ta = el.querySelector('.sn-ta');
    const ti = el.querySelector('.sn-title');
    notes.push({
      id:      el.id,
      color:   c,
      x:       parseInt(el.style.left),
      y:       parseInt(el.style.top),
      title:   ti?.value  || '',
      content: ta?.value  || ''
    });
  });
  lset('crm_notes', JSON.stringify(notes));
}

function loadNotes() {
  try {
    JSON.parse(ls('crm_notes') || '[]')
      .forEach(n => addNote(n.content, n.color, n.x, n.y, n.title, n.id));
  } catch (e) { /* no stored notes */ }
}

/* ============================================================
   STICKY NOTE DRAG
   ============================================================ */
function dragStart(e, nid) {
  if (['INPUT', 'TEXTAREA', 'BUTTON'].includes(e.target.tagName)) return;
  const el = document.getElementById(nid);
  const r  = el.getBoundingClientRect();
  dragState = { nid, ox: e.clientX - r.left, oy: e.clientY - r.top };
  el.style.zIndex = 999;
  e.preventDefault();
}

document.addEventListener('mousemove', e => {
  if (!dragState) return;
  const el = document.getElementById(dragState.nid);
  if (!el) return;
  el.style.left = Math.max(0, Math.min(window.innerWidth  - el.offsetWidth,  e.clientX - dragState.ox)) + 'px';
  el.style.top  = Math.max(46, Math.min(window.innerHeight - el.offsetHeight, e.clientY - dragState.oy)) + 'px';
});

document.addEventListener('mouseup', () => {
  if (dragState) { saveNotes(); dragState = null; }
});

/* ============================================================
   HELP MODAL
   ============================================================ */
function openHelp() {
  document.getElementById('helpOverlay').classList.remove('hidden');
  closeSettings();
}

function closeHelp() {
  document.getElementById('helpOverlay').classList.add('hidden');
}

function saveHelpPref(dontShow) {
  lset('crm_hideHelp', dontShow ? '1' : '0');
}

function maybeShowHelp() {
  if (ls('crm_hideHelp') === '1') return;
  document.getElementById('helpOverlay').classList.remove('hidden');
}

/* ============================================================
   MASTER TOGGLE
   ============================================================ */

// All panel/feature toggle IDs — excludes appearance-only toggles (light, compact)
const ALL_TOGGLE_IDS = [
  'togCaller', 'togAcct',    'togFlags',
  'togCase',   'togActions', 'togHist',   'togWrapup',
  'togTimer',  'togSticky',  'togOutage'
];

// Map each toggle ID to the function that shows/hides the corresponding element
const TOGGLE_ACTIONS = {
  togCaller:  (v) => toggleSec('sCaller',      v),
  togAcct:    (v) => toggleSec('sAcct',         v),
  togFlags:   (v) => toggleSec('sFlags',        v),
  togCase:    (v) => toggleSec('sCase',         v),
  togActions: (v) => toggleSec('sActions',      v),
  togHist:    (v) => toggleSec('sHistory',      v),
  togWrapup:  (v) => toggleEl( 'wrapupBar',     v),
  togTimer:   (v) => toggleEl( 'callTimer',     v),
  togSticky:  (v) => toggleSticky(v),
  togOutage:  (v) => toggleEl( 'outageBanner',  v),
};

function toggleAll(on) {
  ALL_TOGGLE_IDS.forEach(id => {
    const cb = document.getElementById(id);
    if (cb) { cb.checked = on; TOGGLE_ACTIONS[id](on); }
  });
  // Keep all group header toggles in sync
  ['grpLeft', 'grpCentre', 'grpFeatures'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.checked = on;
  });
  lset('crm_togAll', on ? '1' : '0');
}

function syncMasterToggle() {
  const allOn = ALL_TOGGLE_IDS.every(id => {
    const cb = document.getElementById(id);
    return cb ? cb.checked : true;
  });
  const master = document.getElementById('togAll');
  if (master) master.checked = allOn;
}

/* ============================================================
   GROUP TOGGLES
   ============================================================ */
function toggleGroup(groupId, childIds, on) {
  childIds.forEach(id => {
    const cb = document.getElementById(id);
    if (cb) { cb.checked = on; TOGGLE_ACTIONS[id](on); }
  });
  syncMasterToggle();
  lset('crm_grp_' + groupId, on ? '1' : '0');
}

function syncGroupToggle(groupId, childIds) {
  const allOn = childIds.every(id => {
    const cb = document.getElementById(id);
    return cb ? cb.checked : true;
  });
  const grpCb = document.getElementById(groupId);
  if (grpCb) grpCb.checked = allOn;
  syncMasterToggle();
}

/* ============================================================
   ACCESSIBILITY
   ============================================================ */

/* ── Font ── */
const A11Y_FONT_CLASSES = ['a11y-font-system', 'a11y-font-legible', 'a11y-font-atkinson', 'a11y-font-mono'];

function setA11yFont(value) {
  // Remove all font classes
  document.body.classList.remove(...A11Y_FONT_CLASSES);
  if (value !== 'default') document.body.classList.add('a11y-font-' + value);
  // Sync button states
  document.querySelectorAll('#fontBtnRow .a11y-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.font === value)
  );
  lset('crm_a11y_font', value);
}

/* ── Contrast ── */
const A11Y_CONTRAST_CLASSES = ['a11y-contrast-high', 'a11y-contrast-max'];

function setA11yContrast(value) {
  document.body.classList.remove(...A11Y_CONTRAST_CLASSES);
  if (value !== 'normal') document.body.classList.add('a11y-contrast-' + value);
  document.querySelectorAll('#contrastBtnRow .a11y-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.contrast === value)
  );
  lset('crm_a11y_contrast', value);
}

/* ── Text Size ── */
/* Changes html font-size — all rem values in CSS scale proportionally,
   but px layout dimensions (heights, widths, padding) stay fixed */
const SIZE_BASE = { sm: '11px', md: '13px', lg: '15px', xl: '17px' };

function setA11ySize(value) {
  document.documentElement.style.fontSize = SIZE_BASE[value] || '13px';
  document.querySelectorAll('#sizeBtnRow .a11y-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.size === value)
  );
  lset('crm_a11y_size', value);
}

/* ── Load saved a11y prefs ── */
function loadA11y() {
  const font     = ls('crm_a11y_font')     || 'default';
  const contrast = ls('crm_a11y_contrast') || 'normal';
  const size     = ls('crm_a11y_size')     || 'md';
  setA11yFont(font);
  setA11yContrast(contrast);
  setA11ySize(size);
}

/* ============================================================
   BOOT
   ============================================================ */
init();
loadA11y();
maybeShowHelp();
