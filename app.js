// ================================================================
//  STATE
// ================================================================
let punches      = 0;
let combo        = 0;
let comboTimer   = null;
let damageLevel  = 0;  // 0-5, increments every 20 punches

const MAX_LEVEL  = 5;
const PER_LEVEL  = 20; // punches to reach next damage level
const MAX_PUNCHES = MAX_LEVEL * PER_LEVEL; // 100

// Damage level descriptors
const LEVEL_INFO = [
  { label: '😊 Untouched',   toast: null },
  { label: '😣 Feeling It',  toast: '👊 First hit lands!' },
  { label: '😤 Getting Bad', toast: '🩸 Blood drawn!' },
  { label: '😵 Wrecked',     toast: '💀 He\'s messed up!' },
  { label: '🤯 Near KO',     toast: '🚨 Almost knocked out!' },
  { label: '💀 KNOCKED OUT', toast: '🏆 FINISH HIM! K.O.!' },
];

// DOM refs
const punchCountEl   = document.getElementById('punch-count');
const comboCountEl   = document.getElementById('combo-count');
const dmgNumEl       = document.getElementById('dmg-num');
const dmgBar         = document.getElementById('dmg-bar');
const dmgPctEl       = document.getElementById('dmg-pct');
const dmgLevelLabel  = document.getElementById('dmg-level-label');
const victimImg      = document.getElementById('victim-img');
const photoFrame     = document.getElementById('photo-area');
const tapHint        = document.getElementById('tap-hint');
const noMsg          = document.getElementById('no-msg');

const overlays = {
  bruise:  document.getElementById('overlay-bruise'),
  blood:   document.getElementById('overlay-blood'),
  bandage: document.getElementById('overlay-bandage'),
  ko:      document.getElementById('overlay-ko'),
  rip:     document.getElementById('overlay-rip'),
};

// ================================================================
//  PAGE NAVIGATION
// ================================================================
function goToPunchPage() {
  const q = document.getElementById('page-question');
  const p = document.getElementById('page-punch');
  q.classList.remove('active');
  setTimeout(() => p.classList.add('active'), 50);
}

function goBack() {
  const q = document.getElementById('page-question');
  const p = document.getElementById('page-punch');
  p.classList.remove('active');
  setTimeout(() => q.classList.add('active'), 50);
}

// NO button — runs away or shows sassy message
const NO_MESSAGES = [
  "Are you SURE? 🤔",
  "Really?? Look at him 😤",
  "Come on, just once 👊",
  "Your loss... 😏",
  "He DEFINITELY troubled you 🙄",
  "Stop lying to yourself 😂",
];
let noClickCount = 0;
function handleNo(btn) {
  noClickCount++;
  const msg = NO_MESSAGES[Math.min(noClickCount - 1, NO_MESSAGES.length - 1)];
  noMsg.textContent = msg;
  noMsg.classList.remove('hidden');
  noMsg.style.animation = 'none';
  void noMsg.offsetWidth;
  noMsg.style.animation = '';

  // Make the NO button drift away after 3 clicks
  if (noClickCount >= 3) {
    btn.style.transition = 'transform 0.3s, opacity 0.3s';
    btn.style.transform = `translate(${(Math.random()-0.5)*60}px, ${(Math.random()-0.5)*40}px) rotate(${(Math.random()-0.5)*20}deg)`;
    btn.style.opacity = '0.3';
  }
}

// ================================================================
//  PUNCH LOGIC
// ================================================================
function punch() {
  if (damageLevel >= MAX_LEVEL) {
    // Already knocked out — just shake
    triggerScreenShake();
    spawnPunchFlash();
    return;
  }

  punches++;
  combo++;

  // Reset combo timer
  clearTimeout(comboTimer);
  comboTimer = setTimeout(() => { combo = 0; updateUI(); }, 2000);

  updateUI();
  spawnPunchFlash();
  triggerScreenShake();
  checkLevelUp();
  showComboPopup();
}

// ================================================================
//  UI UPDATE
// ================================================================
function updateUI() {
  const capped = Math.min(punches, MAX_PUNCHES);
  const pct    = Math.round((capped / MAX_PUNCHES) * 100);

  punchCountEl.textContent = punches;
  comboCountEl.textContent = `x${combo}`;
  dmgNumEl.textContent     = pct;
  dmgBar.style.width       = pct + '%';
  dmgPctEl.textContent     = pct + '%';
  dmgLevelLabel.textContent = LEVEL_INFO[damageLevel].label;

  // Pop animation on numbers
  popEl(punchCountEl);
  if (combo > 1) popEl(comboCountEl);
}

function popEl(el) {
  el.classList.remove('pop');
  void el.offsetWidth;
  el.classList.add('pop');
}

// ================================================================
//  LEVEL-UP SYSTEM
// ================================================================
function checkLevelUp() {
  const newLevel = Math.min(Math.floor(punches / PER_LEVEL), MAX_LEVEL);
  if (newLevel > damageLevel) {
    damageLevel = newLevel;
    applyDamageVisuals();
    const info = LEVEL_INFO[damageLevel];
    if (info.toast) showLevelToast(info.toast);
  }
}

function applyDamageVisuals() {
  // Remove all image filter classes
  victimImg.classList.remove('dmg-1','dmg-2','dmg-3','dmg-4','dmg-5');
  if (damageLevel > 0) victimImg.classList.add(`dmg-${damageLevel}`);

  // Show overlays up to current level
  const keys = Object.keys(overlays);
  keys.forEach((k, i) => {
    if (i < damageLevel) {
      overlays[k].classList.add('visible');
      overlays[k].classList.remove('hidden');
    }
  });
}

// ================================================================
//  PUNCH FLASH (spawned at random position on photo)
// ================================================================
function spawnPunchFlash() {
  const wrapper = document.querySelector('.photo-wrapper');
  const old = wrapper.querySelector('.punch-flash');
  if (old) old.remove();

  const flash = document.createElement('div');
  flash.className = 'punch-flash';

  const emojis = ['💥', '👊', '🤜', '💢', '⚡', '🔥'];
  flash.textContent = emojis[Math.floor(Math.random() * emojis.length)];

  // Random position in upper 2/3 of photo (where the face is)
  const x = 20 + Math.random() * 60; // 20%-80%
  const y = 10 + Math.random() * 55; // 10%-65%
  flash.style.left = x + '%';
  flash.style.top  = y + '%';

  wrapper.appendChild(flash);
  setTimeout(() => flash.remove(), 400);
}

// ================================================================
//  SCREEN SHAKE
// ================================================================
function triggerScreenShake() {
  const el = document.getElementById('page-punch');
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
  setTimeout(() => el.classList.remove('shake'), 350);
}

// ================================================================
//  COMBO POPUP
// ================================================================
const COMBO_THRESHOLDS = [
  { at: 5,  msg: '🔥 COMBO x5!' },
  { at: 10, msg: '⚡ x10 INSANE!' },
  { at: 15, msg: '💀 x15 SAVAGE!' },
  { at: 20, msg: '🏆 x20 GODLIKE!' },
  { at: 30, msg: '☄️ x30 LEGENDARY!' },
];

function showComboPopup() {
  const triggered = COMBO_THRESHOLDS.find(t => combo === t.at);
  if (!triggered) return;

  const old = document.querySelector('.combo-popup');
  if (old) old.remove();

  const popup = document.createElement('div');
  popup.className = 'combo-popup';
  popup.textContent = triggered.msg;
  document.getElementById('page-punch').appendChild(popup);
  setTimeout(() => popup.remove(), 800);
}

// ================================================================
//  LEVEL TOAST
// ================================================================
function showLevelToast(msg) {
  const old = document.querySelector('.level-toast');
  if (old) old.remove();

  const t = document.createElement('div');
  t.className = 'level-toast';
  t.textContent = msg;
  document.getElementById('page-punch').appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

// ================================================================
//  RESET
// ================================================================
function resetPunches() {
  punches = 0;
  combo   = 0;
  damageLevel = 0;
  clearTimeout(comboTimer);

  // Remove overlays
  Object.values(overlays).forEach(el => {
    el.classList.remove('visible');
  });
  victimImg.classList.remove('dmg-1','dmg-2','dmg-3','dmg-4','dmg-5');

  // Remove toasts/popups
  document.querySelectorAll('.level-toast, .combo-popup').forEach(e => e.remove());

  updateUI();
  tapHint.textContent = '👆 TAP TO PUNCH!';
}

// ================================================================
//  TOUCH RIPPLE PREVENTION (stop text selection on rapid tap)
// ================================================================
document.addEventListener('touchstart', e => {
  if (e.touches.length > 1) e.preventDefault();
}, { passive: false });

// Prevent context menu on long press
document.addEventListener('contextmenu', e => e.preventDefault());
