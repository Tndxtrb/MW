const nameEl = document.getElementById('display-name');
const initialsEl = document.getElementById('avatar-initials');
const shareBtn = document.getElementById('share-btn');
const copyBtn = document.getElementById('copy-link');
const themeBtn = document.querySelector('.theme-toggle');

function initialsFromName(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() || '')
    .join('');
}

function applyInitials() {
  initialsEl.textContent = initialsFromName(nameEl.textContent.trim());
}

applyInitials();

const THEME_KEY = 'pref-theme';
function setTheme(mode) {
  document.documentElement.classList.toggle('dark', mode === 'dark');
  localStorage.setItem(THEME_KEY, mode);
}
(function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) return setTheme(saved);
  setTheme('dark');
})();

themeBtn.addEventListener('click', () => {
  const isDark = document.documentElement.classList.contains('dark');
  setTheme(isDark ? 'light' : 'dark');
  setTimeout(() => {}, 0);
});

shareBtn.addEventListener('click', async () => {
  const title = document.title || 'Профиль';
  const text = 'Мой сайт‑визитка';
  const url = location.href;
  if (navigator.share) {
    try { await navigator.share({ title, text, url }); } catch {}
  } else {
    await navigator.clipboard.writeText(url);
    flash(copyBtn, 'Ссылка скопирована');
  }
});

copyBtn.addEventListener('click', async (e) => {
  const url = e.currentTarget.dataset.copy || location.href;
  await navigator.clipboard.writeText(url);
  flash(e.currentTarget, 'Скопировано');
});

function flash(el, msg) {
  const original = el.textContent;
  el.textContent = msg;
  el.disabled = true;
  setTimeout(() => { el.textContent = original; el.disabled = false; }, 1200);
}

// If the name changes (manual edit), refresh initials
const nameObserver = new MutationObserver(applyInitials);
nameObserver.observe(nameEl, { childList: true, characterData: true, subtree: true });

const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d', { alpha: true });
let stars = [], meteors = [], rafId = null, dpi = window.devicePixelRatio || 1;
const RMM = window.matchMedia('(prefers-reduced-motion: reduce)');

function resize() {
  const { innerWidth:w, innerHeight:h } = window;
  canvas.width = Math.floor(w * dpi);
  canvas.height = Math.floor(h * dpi);
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
}
window.addEventListener('resize', () => { resize(); initStars(); });

function themeColor() {
  const dark = document.documentElement.classList.contains('dark');
  return {
    sky: 'transparent',
    star: dark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
    glow: dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.25)',
    meteor: dark ? 'rgba(200,220,255,0.9)' : 'rgba(60,60,60,0.9)'
  };
}

function initStars() {
  const count = Math.min(350, Math.floor((canvas.width * canvas.height) / (9000 * dpi)));
  stars = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: (Math.random() * 1.2 + 0.4) * dpi,
    base: Math.random() * 0.5 + 0.2,
    spd: 0.002 + Math.random() * 0.004
  }));
  meteors = [];
}

let t = 0;
function spawnMeteor() {
  const fromEdge = Math.random() < 0.5;
  const x = fromEdge ? -20 * dpi : Math.random() * canvas.width * 0.5;
  meteors.push({ x, y: Math.random() * canvas.height * 0.3, vx: 3*dpi, vy: 1.6*dpi, life: 120 });
}
function tick() {
  const c = themeColor(); t += 16;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // stars
  for (const s of stars) {
    const a = Math.max(0, Math.min(1, s.base + Math.sin(t * s.spd) * 0.25));
    ctx.beginPath(); ctx.fillStyle = c.star; ctx.globalAlpha = a;
    ctx.shadowColor = c.glow; ctx.shadowBlur = 6 * s.r;
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  // meteors
  if (Math.random() < 0.02 && meteors.length < 3) spawnMeteor();
  for (let i = meteors.length - 1; i >= 0; i--) {
    const m = meteors[i]; m.x += m.vx; m.y += m.vy; m.life--;
    ctx.strokeStyle = c.meteor; ctx.lineWidth = 1.2 * dpi; ctx.globalAlpha = Math.min(1, m.life / 60);
    ctx.beginPath(); ctx.moveTo(m.x - 30*dpi, m.y - 16*dpi); ctx.lineTo(m.x, m.y); ctx.stroke();
    ctx.globalAlpha = 0.35; ctx.shadowColor = c.meteor; ctx.shadowBlur = 12 * dpi; ctx.beginPath();
    ctx.arc(m.x, m.y, 1.6 * dpi, 0, Math.PI * 2); ctx.fillStyle = c.meteor; ctx.fill();
    ctx.shadowBlur = 0; ctx.globalAlpha = 1; if (m.life <= 0) meteors.splice(i, 1);
  }
  rafId = requestAnimationFrame(tick);
}

function start() { cancelAnimationFrame(rafId); if (!RMM.matches) rafId = requestAnimationFrame(tick); }
function stop() { cancelAnimationFrame(rafId); }

resize(); initStars(); start();
document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
RMM.addEventListener?.('change', () => (RMM.matches ? stop() : start()));