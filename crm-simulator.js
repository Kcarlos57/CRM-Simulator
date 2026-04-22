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
   EXAMPLE CUSTOMER DATABASE
   ============================================================ */
const CUSTOMERS = [

  // ── TRAINING SCENARIOS ────────────────────────────────────────

  { id:'t001', company:'generic', label:'📋 Scenario 1 — Escalate a Complaint to Your Supervisor',
    name:'Michael Carter', acct:'ACC-00391', cid:'CID-00102',
    phone:'09 555 1234', email:'michael.carter@gmail.com',
    type:'Residential', since:'2023-01-10', pref:'Phone', linked:'',
    standing:'active', balance:'$0.00', payDue:'', plan:'Standard Plan',
    lastOrd:'ORD-2025-0447', lastAmt:'$349.00 · 3 Apr 2025',
    flags:[], flagNotes:'',
    scenario:{ channel:'Inbound Call', cat:'Complaint', pri:'high',
      notes:`TRAINING SCENARIO 1 — ESCALATION TO SUPERVISOR

SITUATION:
You are a CSR who has received an inbound call. The customer purchased a product from the website and is complaining and requesting a return. After checking, the customer does NOT meet the returns policy (item opened, over 14 days since purchase, no fault found).

YOUR TASK:
You have decided to escalate to your manager. Place the customer on hold, then communicate the situation to your supervisor quickly using short abbreviations and contact centre terminology.

PRACTICE PROMPTS — use these when briefing your supervisor:
  • "IB call, cx complaint re: ORD-2025-0447, purchased 3 Apr"
  • "Cx wants RTN — does not meet RTN policy, item opened, 17 days post-purchase"
  • "NFF — no fault found on product"
  • "Cx escalating, requesting mgr override on RTN"
  • "Cx on hold, req supervisor approval or offer alternative resolution"

KEY ABBREVIATIONS TO PRACTISE:
  IB = Inbound | CX = Customer | RTN = Return | NFF = No Fault Found
  POH = Place on Hold | MGR = Manager | EX = Escalation | RES = Resolution
  FCR = First Contact Resolution | ACW = After Call Work

RESOLUTION OPTIONS TO DISCUSS WITH SUPERVISOR:
  - Store credit in lieu of return
  - Partial refund as goodwill gesture
  - Repair/replacement if defect found on closer inspection
  - Uphold returns policy denial with written explanation` }
  },

  { id:'t002', company:'generic', label:'📋 Scenario 2 — Resolve a Product Specification Complaint',
    name:'Jessica Yamamoto', acct:'ACC-00512', cid:'CID-00218',
    phone:'04 888 9911', email:'jessica.yamamoto@outlook.com',
    type:'Residential', since:'2024-06-20', pref:'Phone', linked:'',
    standing:'active', balance:'$0.00', payDue:'', plan:'Standard Plan',
    lastOrd:'ORD-2025-0891', lastAmt:'$2,199.00 · 1 Apr 2025',
    flags:[], flagNotes:'',
    scenario:{ channel:'Inbound Call', cat:'Complaint', pri:'high',
      notes:`TRAINING SCENARIO 2 — RESOLVE A PRODUCT SPECIFICATION COMPLAINT

SITUATION:
You are a CSR who has received a complaint from a customer who purchased a gaming computer (ORD-2025-0891, $2,199.00). The customer claims the computer does NOT perform to the specifications stated by the manufacturer — specifically, frame rates in games are significantly lower than advertised and the RAM is running slower than the listed speed.

YOUR TASK:
Check your contact centre database and/or the manufacturer's website to verify the listed specifications, then provide a resolution to the customer.

STEPS TO PRACTISE:
  1. Verify order details — confirm product name, SKU, and purchase date
  2. Look up manufacturer specs (e.g. search "[product name] specifications" on manufacturer site)
  3. Ask diagnostic questions:
     • "Have you installed all drivers and Windows updates?"
     • "Is the performance issue in all games or a specific title?"
     • "Has the RAM been configured to run at XMP/EXPO profile in BIOS?"
  4. Compare advertised specs against customer's reported performance
  5. Determine resolution path:
     • If specs match and it's a config issue → guide through troubleshooting or book tech support
     • If specs do not match → warranty/replacement claim under Consumer Guarantees Act
     • If inconclusive → escalate to technical team with full notes

PRODUCT DETAILS TO VERIFY:
  Model: Gaming Desktop (check ORD-2025-0891 for exact SKU)
  Claimed specs: GPU capable of 60+ FPS at 1080p High, RAM at rated speed
  Customer reported: 30–40 FPS, RAM showing slower speed in Windows

KEY LEGISLATION (NZ):
  Consumer Guarantees Act 1993 — goods must match description and be fit for purpose
  If product does not match advertised specs, customer is entitled to repair, replacement, or refund` }
  },

  { id:'g001', company:'generic', label:'Sarah Thompson — Billing Query',
    name:'Sarah Thompson', acct:'ACC-84291', cid:'CID-19045',
    phone:'04 123 4567', email:'sarah.thompson@email.co.nz',
    type:'Residential', since:'2019-03-15', pref:'Phone', linked:'',
    standing:'active', balance:'$0.00', payDue:'', plan:'Standard Monthly Plan',
    lastOrd:'INV-2025-0391', lastAmt:'$142.50 · 14 Apr 2025',
    flags:[], flagNotes:'',
    scenario:{ channel:'Inbound Call', cat:'Billing / Payment', pri:'med',
      notes:'Customer querying a charge of $142.50 on their April invoice. States they did not authorise this transaction and is asking for a full breakdown before agreeing to pay.' }
  },

  { id:'g002', company:'generic', label:'Marcus Chen — VIP Business Account',
    name:'Marcus Chen', acct:'ACC-10023', cid:'CID-50012',
    phone:'09 876 5432', email:'m.chen@chengroup.co.nz',
    type:'Business', since:'2015-07-01', pref:'Email', linked:'ACC-10024, ACC-10025',
    standing:'active', balance:'$0.00', payDue:'', plan:'Business Premier — 3 accounts',
    lastOrd:'ORD-2025-1192', lastAmt:'$8,450.00 · 2 Apr 2025',
    flags:['flVIP'], flagNotes:'Chen Group — escalate to senior agent if unresolved within 5 minutes.',
    scenario:{ channel:'Inbound Call', cat:'Account Management', pri:'high',
      notes:'Marcus is calling to request a plan review and discuss upgrading across all three linked accounts. He wants consolidated billing and a dedicated account manager.' }
  },

  { id:'g003', company:'generic', label:'Eleanor Voss — Overdue, Suspended',
    name:'Eleanor Voss', acct:'ACC-67731', cid:'CID-33218',
    phone:'03 555 8821', email:'eleanor.voss@xtra.co.nz',
    type:'Residential', since:'2021-11-22', pref:'Phone', linked:'',
    standing:'suspended', balance:'$284.00', payDue:'2025-03-01', plan:'Standard Monthly Plan',
    lastOrd:'INV-2025-0102', lastAmt:'$284.00 · 1 Mar 2025',
    flags:['flVuln'], flagNotes:'Customer has indicated financial hardship. Refer to hardship policy before discussing debt collection. Do not threaten service termination on this contact.',
    scenario:{ channel:'Inbound Call', cat:'Billing / Payment', pri:'high',
      notes:'Account suspended due to overdue balance of $284.00. Customer calling in — approach with sensitivity per vulnerable customer flag. Do not pressure for immediate payment. Explore hardship plan options.' }
  },

  { id:'g004', company:'generic', label:'James Rutherford — Do Not Contact',
    name:'James Rutherford', acct:'ACC-29944', cid:'CID-71100',
    phone:'07 302 4410', email:'jrutherford@outlook.com',
    type:'Residential', since:'2017-05-10', pref:'Email', linked:'',
    standing:'closed', balance:'$0.00', payDue:'', plan:'Account closed 12 Feb 2025',
    lastOrd:'INV-2025-0048', lastAmt:'$55.00 · 31 Jan 2025',
    flags:['flDNC'], flagNotes:'Formal Do Not Contact request submitted 12 Feb 2025. Do not initiate outbound contact. All inbound contacts must be logged and flagged to team leader.',
    scenario:{ channel:'Inbound Call', cat:'Account Management', pri:'low',
      notes:'Customer has called in. Account is closed with an active DNC flag. Acknowledge the enquiry, assist only if legally required, log the contact thoroughly, and notify team leader after the call.' }
  },

  { id:'g005', company:'generic', label:'Priya Naidoo — New Customer',
    name:'Priya Naidoo', acct:'ACC-99201', cid:'CID-88432',
    phone:'021 456 7890', email:'priya.naidoo@gmail.com',
    type:'Residential', since:'2025-04-01', pref:'Email', linked:'',
    standing:'active', balance:'$0.00', payDue:'', plan:'Standard Monthly Plan',
    lastOrd:'', lastAmt:'',
    flags:[], flagNotes:'',
    scenario:{ channel:'Inbound Call', cat:'General Enquiry', pri:'low',
      notes:'New customer — joined 3 weeks ago, first ever contact. Calling to ask about the billing cycle and how to update her payment method. Good opportunity to practise onboarding-style call handling.' }
  },

  // ── PB TECH ──────────────────────────────────────────────────

  { id:'p001', company:'pbtech', label:'Tom Wheeler — Laptop Warranty Claim',
    name:'Tom Wheeler', acct:'PBT-55021', cid:'CID-20931',
    phone:'09 211 3344', email:'tomwheeler@gmail.com',
    type:'Residential', since:'2022-08-19', pref:'Phone', linked:'',
    standing:'active', balance:'$0.00', payDue:'', plan:'PB Tech ExtendedCare 3-Year',
    lastOrd:'ORD-2025-0841', lastAmt:'$1,899.00 · 3 Jan 2025',
    flags:[], flagNotes:'',
    scenario:{ channel:'Inbound Call', cat:'Warranty Claim', pri:'high',
      notes:'Purchased Lenovo IdeaPad Pro (SKU: LNV-IP5-16) 3 months ago. Screen is flickering with horizontal black lines. Unit is under both manufacturer and ExtendedCare warranty. Customer wants a replacement or repair booked urgently — uses the laptop for work.' }
  },

  { id:'p002', company:'pbtech', label:'Lisa Park — Dead on Arrival Return',
    name:'Lisa Park', acct:'PBT-44812', cid:'CID-30127',
    phone:'027 888 2211', email:'lisa.park@hotmail.com',
    type:'Residential', since:'2023-12-05', pref:'SMS', linked:'',
    standing:'active', balance:'$0.00', payDue:'', plan:'No extended warranty',
    lastOrd:'ORD-2025-1004', lastAmt:'$549.00 · 18 Apr 2025',
    flags:[], flagNotes:'',
    scenario:{ channel:'Inbound Call', cat:'Returns / Refunds', pri:'high',
      notes:'Received a mechanical keyboard (ORD-2025-1004) yesterday. Dead on Arrival — not powering on at all. Purchased 4 days ago. Customer wants immediate replacement. Refer to DOA policy: full replacement within 7 days of purchase, no questions asked.' }
  },

  { id:'p003', company:'pbtech', label:'David Kim — Trade Bulk Order Delay',
    name:'David Kim', acct:'PBT-10044', cid:'CID-50881',
    phone:'09 300 8800', email:'d.kim@kimtechsolutions.co.nz',
    type:'Trade / Wholesale', since:'2018-02-28', pref:'Email', linked:'PBT-10045',
    standing:'active', balance:'$0.00', payDue:'', plan:'Trade Account — Net 30',
    lastOrd:'ORD-2025-0702', lastAmt:'$24,320.00 · 20 Mar 2025',
    flags:['flVIP'], flagNotes:'Trade account — all pricing queries must be escalated to the trade desk. Do not quote retail pricing to this customer.',
    scenario:{ channel:'Inbound Call', cat:'Order Status', pri:'med',
      notes:'Querying dispatch status of ORD-2025-0702 (40x monitors, trade order). Placed 4 weeks ago. Expected delivery was last Friday. Customer has a client install deadline this week — situation is becoming critical.' }
  },

  { id:'p004', company:'pbtech', label:'Aroha Te Maro — Technical Support',
    name:'Aroha Te Maro', acct:'PBT-71209', cid:'CID-44003',
    phone:'07 123 9900', email:'aroha.temaro@icloud.com',
    type:'Residential', since:'2024-01-14', pref:'Phone', linked:'',
    standing:'active', balance:'$0.00', payDue:'', plan:'No extended warranty',
    lastOrd:'ORD-2024-3341', lastAmt:'$399.00 · 14 Jan 2024',
    flags:[], flagNotes:'',
    scenario:{ channel:'Inbound Call', cat:'Technical Support', pri:'med',
      notes:'Wi-Fi 6 router purchased 15 months ago. After a recent firmware update it drops connection every 30–60 minutes. Customer has already restarted and reinstalled the app. Manufacturer warranty has expired. Explore paid support options or replacement.' }
  },

  { id:'p005', company:'pbtech', label:'Connor Walsh — Fraud Watch',
    name:'Connor Walsh', acct:'PBT-38821', cid:'CID-91022',
    phone:'021 555 0011', email:'connorwalsh99@gmail.com',
    type:'Residential', since:'2024-09-30', pref:'Phone', linked:'',
    standing:'pending', balance:'$0.00', payDue:'', plan:'No extended warranty',
    lastOrd:'ORD-2025-0991', lastAmt:'$2,840.00 · 10 Apr 2025',
    flags:['flFraud'], flagNotes:'Flagged by fraud team 11 Apr 2025. Multiple high-value orders in 48 hrs using different payment methods. Do NOT process refunds or issue store credit without fraud team authorisation. Ref: FRD-2025-0183.',
    scenario:{ channel:'Inbound Call', cat:'Returns / Refunds', pri:'urg',
      notes:'Calling to request a refund on ORD-2025-0991. FRAUD FLAG ACTIVE — do NOT process any refund. Advise standard processing times, do not reveal the fraud flag, and escalate to fraud team immediately after ending the call.' }
  },

  // ── JB HI-FI ─────────────────────────────────────────────────

  { id:'j001', company:'jbhifi', label:'Natalie Brooks — Price Match Request',
    name:'Natalie Brooks', acct:'JBH-22018', cid:'CID-60441',
    phone:'04 888 7700', email:'natalie.brooks@gmail.com',
    type:'Residential', since:'2020-06-12', pref:'Phone', linked:'',
    standing:'active', balance:'$0.00', payDue:'', plan:'JB Hi-Fi Club Member',
    lastOrd:'ORD-2025-5510', lastAmt:'$649.00 · 19 Apr 2025',
    flags:[], flagNotes:'',
    scenario:{ channel:'Inbound Call', cat:'Price Match', pri:'low',
      notes:'Purchased Sony WH-1000XM6 headset 2 days ago for $649. Found the same item at Harvey Norman online for $579. Requesting a price match under JB price guarantee policy. Refer to KB article PM-2025-04 for current terms before processing.' }
  },

  { id:'j002', company:'jbhifi', label:'Steven Ford — Refund, Suspended Account',
    name:'Steven Ford', acct:'JBH-10992', cid:'CID-70028',
    phone:'09 441 2200', email:'stevenford@xtra.co.nz',
    type:'Residential', since:'2016-11-03', pref:'Phone', linked:'',
    standing:'suspended', balance:'$120.00', payDue:'2025-02-15', plan:'JB Club — Overdue',
    lastOrd:'ORD-2025-2201', lastAmt:'$399.00 · 8 Feb 2025',
    flags:[], flagNotes:'',
    scenario:{ channel:'Inbound Call', cat:'Returns / Refunds', pri:'med',
      notes:'Wants to return a Smart TV with dead pixel cluster, purchased 6 weeks ago. Account is suspended due to an overdue Club instalment. Account standing must be resolved before any return can be processed.' }
  },

  { id:'j003', company:'jbhifi', label:'Michelle Santos — VIP High-Value',
    name:'Michelle Santos', acct:'JBH-00291', cid:'CID-10055',
    phone:'021 900 1122', email:'michelle.santos@santos-realty.co.nz',
    type:'VIP / Premium', since:'2013-04-22', pref:'Phone', linked:'JBH-00292',
    standing:'active', balance:'$0.00', payDue:'', plan:'JBH Premier — Concierge Tier',
    lastOrd:'ORD-2025-6001', lastAmt:'$14,200.00 · 1 Apr 2025',
    flags:['flVIP'], flagNotes:'Premier concierge tier — answer within 3 rings, escalate if unresolved, do not hold for more than 90 seconds without checking back.',
    scenario:{ channel:'Inbound Call', cat:'Product Enquiry', pri:'high',
      notes:'Enquiring about a full home theatre installation package. Has an existing Sony 85" OLED and wants to add Sonos Arc surround system. Referred by in-store consultant Jake M. High likelihood of conversion — treat as a sales/service hybrid call.' }
  },

  { id:'j004', company:'jbhifi', label:'Oliver Huang — Gift Card Balance Issue',
    name:'Oliver Huang', acct:'JBH-48831', cid:'CID-82009',
    phone:'03 201 5544', email:'oliver.huang@student.ac.nz',
    type:'Residential', since:'2023-10-18', pref:'Live Chat', linked:'',
    standing:'active', balance:'$0.00', payDue:'', plan:'No membership',
    lastOrd:'ORD-2025-4489', lastAmt:'$50.00 gift card · 15 Apr 2025',
    flags:[], flagNotes:'',
    scenario:{ channel:'Live Chat', cat:'Billing / Payment', pri:'low',
      notes:'Purchased a $50 JB gift card online as a birthday gift. Recipient reports the balance shows $0 when checked in-store. Customer has the digital receipt and activation confirmation email. Likely an activation issue — check card status in system before escalating.' }
  },

  { id:'j005', company:'jbhifi', label:'Rebecca Moore — In Mediation / Legal',
    name:'Rebecca Moore', acct:'JBH-39012', cid:'CID-55500',
    phone:'09 302 8810', email:'rebecca.moore@lawyersnz.co.nz',
    type:'Residential', since:'2019-08-07', pref:'Email', linked:'',
    standing:'pending', balance:'$0.00', payDue:'', plan:'No active plan',
    lastOrd:'ORD-2024-9981', lastAmt:'$2,199.00 · 20 Nov 2024',
    flags:['flMediation'], flagNotes:'Disputes Tribunal case lodged: DT-2025-0041. Faulty MacBook Pro, Nov 2024 purchase. DO NOT discuss case merits. Log all contact and forward to legal team. No resolution without legal sign-off.',
    scenario:{ channel:'Inbound Call', cat:'Complaint', pri:'urg',
      notes:'Calling regarding open Disputes Tribunal case DT-2025-0041. Do NOT discuss case merits or offer any resolution. Take her details, confirm receipt of contact, and advise that the legal team will respond within 2 business days. Escalate to legal immediately after.' }
  },

  // ── HARVEY NORMAN ────────────────────────────────────────────

  { id:'h001', company:'harveynorman', label:'Gary Henderson — Appliance Warranty',
    name:'Gary Henderson', acct:'HN-81029', cid:'CID-31204',
    phone:'07 855 3300', email:'gary.henderson@gmail.com',
    type:'Residential', since:'2021-05-14', pref:'Phone', linked:'',
    standing:'active', balance:'$0.00', payDue:'', plan:'HN Extended Warranty — 5 Year',
    lastOrd:'ORD-2021-4421', lastAmt:'$1,649.00 · 14 May 2021',
    flags:[], flagNotes:'',
    scenario:{ channel:'Inbound Call', cat:'Warranty Claim', pri:'med',
      notes:'Fisher & Paykel fridge purchased May 2021 with 5-year extended warranty. Ice maker has stopped working. Unit is still within warranty period. Customer wants a technician booked — located in the Waikato region. Check technician availability for that zone.' }
  },

  { id:'h002', company:'harveynorman', label:'Fiona Mitchell — Delivery Dispute',
    name:'Fiona Mitchell', acct:'HN-60442', cid:'CID-41889',
    phone:'04 499 0011', email:'fiona.mitchell@paradise.net.nz',
    type:'Residential', since:'2022-12-01', pref:'Phone', linked:'',
    standing:'active', balance:'$0.00', payDue:'', plan:'No extended warranty',
    lastOrd:'ORD-2025-3340', lastAmt:'$899.00 · 10 Apr 2025',
    flags:[], flagNotes:'',
    scenario:{ channel:'Inbound Call', cat:'Delivery / Courier', pri:'high',
      notes:'Ordered a washing machine 12 days ago. Delivery was booked for last Thursday. Driver left a card but allegedly did not attempt to ring the doorbell — customer was home all day. Wants urgent re-delivery or a full refund. Escalate to courier operations team.' }
  },

  { id:'h003', company:'harveynorman', label:'Paul Aotearoa — Installation Query',
    name:'Paul Aotearoa', acct:'HN-72210', cid:'CID-52001',
    phone:'06 757 4422', email:'paul.aotearoa@farmside.co.nz',
    type:'Residential', since:'2023-03-30', pref:'Phone', linked:'',
    standing:'active', balance:'$0.00', payDue:'', plan:'HN Delivery & Install Package',
    lastOrd:'ORD-2025-1991', lastAmt:'$3,299.00 · 5 Apr 2025',
    flags:[], flagNotes:'',
    scenario:{ channel:'Inbound Call', cat:'Product Enquiry', pri:'low',
      notes:'Purchased rangehood and oven combo with Delivery & Install package. Installer visited but said existing cabinetry needs modification before the rangehood can be fitted. Customer wants to know who is responsible for the cabinetry work and whether there is an extra charge.' }
  },

  { id:'h004', company:'harveynorman', label:'Sandra Williams — Deceased Account',
    name:'Sandra Williams (Estate of)', acct:'HN-33018', cid:'CID-22801',
    phone:'09 410 5500', email:'williams.estate@rainbowlaw.co.nz',
    type:'Residential', since:'2014-09-11', pref:'Email', linked:'',
    standing:'pending', balance:'$0.00', payDue:'', plan:'HN Extended Warranty — 3 Year (active)',
    lastOrd:'ORD-2024-8820', lastAmt:'$2,499.00 · 15 Oct 2024',
    flags:['flDeceased'], flagNotes:'Account holder Sandra Williams passed away 28 Mar 2025. Executor: Andrew Williams (son). Do not discuss account details with any other party. Refer to deceased account policy. Require death certificate before processing any changes.',
    scenario:{ channel:'Email', cat:'Account Management', pri:'med',
      notes:'Contact from executor Andrew Williams requesting cancellation of the active extended warranty and a pro-rata refund. Refer to deceased account policy — require death certificate copy before processing. Do not correspond with anyone other than the nominated executor.' }
  },

  { id:'h005', company:'harveynorman', label:'Kevin O\'Brien — Repeat Escalation',
    name:'Kevin O\'Brien', acct:'HN-91100', cid:'CID-63300',
    phone:'03 344 9980', email:'kevinobrien@hotmail.com',
    type:'Residential', since:'2020-01-08', pref:'Phone', linked:'',
    standing:'active', balance:'$0.00', payDue:'', plan:'No extended warranty',
    lastOrd:'ORD-2025-0118', lastAmt:'$749.00 · 8 Jan 2025',
    flags:['flCallback'], flagNotes:'Fourth contact regarding the same unresolved issue. Previously escalated twice with no outcome. Manager-level intervention required this contact. Do not leave without a definitive resolution or formal escalation path.',
    scenario:{ channel:'Inbound Call', cat:'Complaint', pri:'urg',
      notes:'FOURTH call about laptop hinge damage (ORD-2025-0118). Purchased January, hinge snapped at 6 weeks. Claim denied twice citing physical damage exclusion. Customer is now threatening to escalate to Consumer NZ. This call must result in a definitive resolution — escalate to manager before ending the call.' }
  }

];

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

  // Refresh preset dropdown
  updatePresetList();
}

function setCoTab(btn) { setCompany(btn.dataset.co); }

/* ============================================================
   EXAMPLE CUSTOMER PRESETS
   ============================================================ */
function updatePresetList() {
  const sel = document.getElementById('presetSel');
  if (!sel) return;
  sel.innerHTML = '<option value="">— Load example customer —</option>';

  // Training scenarios always pinned to the top
  const training = CUSTOMERS.filter(c => c.id.startsWith('t'));
  const rest     = CUSTOMERS.filter(c => !c.id.startsWith('t'));

  training.forEach(c => {
    const o = document.createElement('option');
    o.value = c.id;
    o.textContent = c.label;
    sel.appendChild(o);
  });

  if (training.length && rest.length) {
    const divider = document.createElement('option');
    divider.disabled = true;
    divider.textContent = '────────────────────────';
    sel.appendChild(divider);
  }

  rest.forEach(c => {
    const o = document.createElement('option');
    o.value = c.id;
    o.textContent = c.label;
    sel.appendChild(o);
  });
}

function loadPreset() {
  const id = document.getElementById('presetSel').value;
  if (!id) { toast('⚠ Select an example customer first'); return; }
  const c = CUSTOMERS.find(x => x.id === id);
  if (!c) return;

  // ── Left panel: Caller Identity ──
  const set = (elId, val) => {
    const el = document.getElementById(elId);
    if (el) { el.value = val || ''; }
  };
  set('fName',    c.name);
  set('fAcct',    c.acct);
  set('fCid',     c.cid);
  set('fPhone',   c.phone);
  set('fEmail',   c.email);
  set('fType',    c.type);
  set('fSince',   c.since);
  set('fPref',    c.pref);
  set('fLinked',  c.linked);

  // ── Left panel: Account Status ──
  set('fStanding', c.standing);
  set('fBal',      c.balance);
  set('fPayDue',   c.payDue);
  set('fPlan',     c.plan);
  set('fLastOrd',  c.lastOrd);
  set('fLastAmt',  c.lastAmt);
  updStanding();

  // ── Left panel: Flags ──
  const ALL_FLAGS = ['flVuln','flDNC','flFraud','flDeceased','flMediation','flVIP','flCallback'];
  ALL_FLAGS.forEach(f => {
    const el = document.getElementById(f);
    if (el) el.checked = c.flags.includes(f);
  });
  set('flNotes', c.flagNotes);

  // ── Centre panel: Scenario ──
  if (c.scenario) {
    set('cChannel', c.scenario.channel);
    set('cCat',     c.scenario.cat);
    set('cNotes',   c.scenario.notes);
    setPri(c.scenario.pri || 'med');
  }

  // Persist everything and confirm
  saveDraft();
  toast('✓ Loaded: ' + c.label);
}

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
