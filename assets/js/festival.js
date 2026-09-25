/* ============================================================
   🎉 Festival Themes — automatic holiday backgrounds & particles
   Pairs with sakura.js: when a festival is active, its particle
   style replaces the default sakura petals and a tinted gradient
   overlays the page. Light & dark mode both supported.
   ============================================================ */

(function () {
  'use strict';

  /* ---------- festival calendar ----------
     Each theme: name, emoji particle, colors (light/dark gradient tints),
     date test fn(m, d, dow) → true when active. Checked top-down.        */
  var THEMES = [
    {
      id: 'mid-autumn', emoji: '🌕', name: 'Mid-Autumn Festival',
      // Mid-Autumn: 2026-09-25, 2027-09-15 (approx; covers 4 days around)
      dates: [[9, 23], [9, 24], [9, 25], [9, 26], [9, 27]],
      // harvest moon gold + deep indigo night
      colors: { light: ['#2c2a5e', '#5b4a8a', '#b8860b', '#ffd76e'], dark: ['#12102a', '#2a2450', '#8a6a10', '#ffd76e'] },
      particle: { kind: 'moon', color: '#ffd76e', count: 14 }
    },
    {
      id: 'national-day', emoji: '🇨🇳', name: "China's National Day",
      dates: [[9, 29], [9, 30], [10, 1], [10, 2], [10, 3], [10, 4], [10, 5], [10, 6], [10, 7]],
      colors: { light: ['#8b1a1a', '#c0392b', '#e8b84b', '#ffd76e'], dark: ['#2a0a0a', '#4a1212', '#a08424', '#ffd76e'] },
      particle: { kind: 'star', color: '#ffd76e', count: 20 }
    },
    {
      id: 'halloween', emoji: '🎃', name: 'Halloween',
      dates: [[10, 28], [10, 29], [10, 30], [10, 31], [11, 1]],
      colors: { light: ['#2d1b4e', '#6b3fa0', '#ff8c00', '#ffb347'], dark: ['#140a26', '#2d1b4e', '#a05a00', '#ff8c00'] },
      particle: { kind: 'pumpkin', color: '#ff8c00', count: 16 }
    },
    {
      id: 'christmas', emoji: '🎄', name: 'Christmas',
      dates: [[12, 18], [12, 19], [12, 20], [12, 21], [12, 22], [12, 23], [12, 24], [12, 25], [12, 26]],
      colors: { light: ['#1a472a', '#2d6a4f', '#c0392b', '#ffd7dc'], dark: ['#0d2418', '#1a472a', '#a03028', '#ffd7dc'] },
      particle: { kind: 'snow', color: '#ffffff', count: 42 }
    },
    {
      id: 'new-year', emoji: '🎉', name: "New Year's Eve",
      dates: [[12, 29], [12, 30], [12, 31], [1, 1], [1, 2], [1, 3]],
      colors: { light: ['#2d1b4e', '#1a472a', '#b8860b', '#ffe66e'], dark: ['#12102a', '#1a1a3e', '#8a6a10', '#ffe66e'] },
      particle: { kind: 'confetti', color: null, count: 34 }
    },
    {
      id: 'lunar-new-year', emoji: '🧧', name: 'Spring Festival',
      // approx dates for 2026-2028 (Feb 17, Feb 6, Jan 26) — cover a week around
      dates: [[2, 12], [2, 13], [2, 14], [2, 15], [2, 16], [2, 17], [2, 18], [2, 19], [2, 20], [2, 21],
              [2, 4], [2, 5], [2, 6], [2, 7], [2, 8], [2, 9], [2, 10], [2, 11],
              [1, 24], [1, 25], [1, 26], [1, 27], [1, 28], [1, 29], [1, 30], [1, 31]],
      colors: { light: ['#8b1a1a', '#c0392b', '#e8b84b', '#ffd76e'], dark: ['#2a0a0a', '#4a1212', '#a08424', '#ffd76e'] },
      particle: { kind: 'lantern', color: '#ff4d4d', count: 18 }
    },
    {
      id: 'valentines', emoji: '💝', name: "Valentine's Day",
      dates: [[2, 12], [2, 13], [2, 14], [2, 15]],
      colors: { light: ['#ff6b9d', '#ff8fab', '#c44569', '#ffc2d4'], dark: ['#3a1220', '#6b2737', '#a03050', '#ff9ec7'] },
      particle: { kind: 'heart', color: '#ff6b9d', count: 24 }
    }
  ];

  function activeTheme() {
    var now = new Date();
    var m = now.getMonth() + 1, d = now.getDate();
    for (var i = 0; i < THEMES.length; i++) {
      var t = THEMES[i];
      for (var j = 0; j < t.dates.length; j++) {
        if (t.dates[j][0] === m && t.dates[j][1] === d) return t;
      }
    }
    return null;
  }

  window.__festivalTheme = activeTheme();
  if (!window.__festivalTheme) return;

  var T = window.__festivalTheme;
  var isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  /* ---------- apply gradient tint via CSS variables ---------- */
  var cs = isDark ? T.colors.dark : T.colors.light;
  var style = document.createElement('style');
  style.textContent =
    'body { background-image: radial-gradient(circle, rgba(255,255,255,.06) 1.5px, transparent 1.6px),' +
      'radial-gradient(circle at 15% 15%, ' + cs[0] + 'cc 0%, transparent 40%),' +
      'radial-gradient(circle at 85% 10%, ' + cs[1] + 'bb 0%, transparent 42%),' +
      'radial-gradient(circle at 75% 88%, ' + cs[2] + '88 0%, transparent 45%),' +
      'radial-gradient(circle at 18% 88%, ' + cs[3] + '66 0%, transparent 40%),' +
      'linear-gradient(160deg, ' + cs[0] + '22 0%, ' + cs[1] + '33 50%, ' + cs[2] + '22 100%) !important; }' +
    '.masthead, .navbar.is-light, .navbar { background: ' + (isDark ? cs[0] : cs[0] + 'f0') + ' !important; border-bottom-color: ' + cs[3] + '88 !important; }' +
    '.page__footer, .footer { background: ' + (isDark ? cs[0] : cs[0] + 'e0') + ' !important; border-top-color: ' + cs[3] + '88 !important; }' +
    '#festival-banner { position: fixed; top: 12px; right: 14px; z-index: 9998; font-size: 1.6rem; opacity: .85; pointer-events: none; animation: festive-float 3.5s ease-in-out infinite; }' +
    '@keyframes festive-float { 0%,100% { transform: translateY(0) rotate(-4deg); } 50% { transform: translateY(-6px) rotate(4deg); } }';
  document.head.appendChild(style);

  /* ---------- festival emoji banner (top-right) ---------- */
  var banner = document.createElement('div');
  banner.id = 'festival-banner';
  banner.textContent = T.emoji;
  banner.title = T.name;
  document.body.appendChild(banner);
})();
