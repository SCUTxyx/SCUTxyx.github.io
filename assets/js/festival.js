/* ============================================================
   🎉 Festival Themes — automatic holiday backgrounds & particles
   Pairs with sakura.js: when a festival is active, its particle
   style replaces the default sakura petals, the background gets a
   soft festival-tinted wash, and ALL accent colors (headings,
   links, underlines, card borders) shift to the festival palette
   so nothing clashes. Light & dark mode both supported.
   ============================================================ */

(function () {
  'use strict';

  /* ---------- festival calendar ----------
     Each theme: name, emoji particle, per-mode palette:
       base   — page background base color
       hints  — 4 soft radial tints (rgba) painted over the base
       accent — headings / links / underlines
       accent2- gradient partner for underlines & dashes
       line   — card border tint
     date test: [month, day] pairs. Checked top-down.               */
  var THEMES = [
    {
      id: 'mid-autumn', emoji: '🌕', name: 'Mid-Autumn Festival',
      dates: [[9, 23], [9, 24], [9, 25], [9, 26], [9, 27]],
      light: { base: '#f8f3e9', hints: ['rgba(84,74,138,.14)', 'rgba(184,134,11,.14)', 'rgba(255,215,110,.20)', 'rgba(44,42,94,.10)'], accent: '#8a6a2f', accent2: '#b8860b', line: 'rgba(184,134,11,.45)' },
      dark:  { base: '#12102a', hints: ['rgba(90,70,150,.22)', 'rgba(184,134,11,.14)', 'rgba(255,215,110,.10)', 'rgba(44,42,94,.35)'], accent: '#ffd76e', accent2: '#e8b84b', line: 'rgba(255,215,110,.35)' },
      particle: { kind: 'moon', color: '#e8b84b', count: 14 }
    },
    {
      id: 'national-day', emoji: '🇨🇳', name: "China's National Day",
      dates: [[9, 29], [9, 30], [10, 1], [10, 2], [10, 3], [10, 4], [10, 5], [10, 6], [10, 7]],
      light: { base: '#fffaf3', hints: ['rgba(192,57,43,.16)', 'rgba(232,184,75,.22)', 'rgba(255,215,110,.18)', 'rgba(139,26,26,.10)'], accent: '#a02c2c', accent2: '#d4a017', line: 'rgba(160,44,44,.40)' },
      dark:  { base: '#1c1013', hints: ['rgba(140,30,30,.28)', 'rgba(212,160,23,.14)', 'rgba(255,215,110,.10)', 'rgba(60,15,15,.45)'], accent: '#ffd76e', accent2: '#ffb347', line: 'rgba(255,215,110,.35)' },
      particle: { kind: 'star', color: '#e8b84b', count: 20 }
    },
    {
      id: 'halloween', emoji: '🎃', name: 'Halloween',
      dates: [[10, 28], [10, 29], [10, 30], [10, 31], [11, 1]],
      light: { base: '#f7f2fb', hints: ['rgba(106,63,160,.16)', 'rgba(255,140,0,.16)', 'rgba(255,179,71,.18)', 'rgba(45,27,78,.10)'], accent: '#7a3fb0', accent2: '#e8791e', line: 'rgba(122,63,176,.40)' },
      dark:  { base: '#170d26', hints: ['rgba(106,63,160,.30)', 'rgba(255,140,0,.14)', 'rgba(255,179,71,.08)', 'rgba(45,27,78,.40)'], accent: '#ffa050', accent2: '#c68cff', line: 'rgba(255,160,80,.32)' },
      particle: { kind: 'pumpkin', color: '#ff8c00', count: 16 }
    },
    {
      id: 'christmas', emoji: '🎄', name: 'Christmas',
      dates: [[12, 18], [12, 19], [12, 20], [12, 21], [12, 22], [12, 23], [12, 24], [12, 25], [12, 26]],
      light: { base: '#f4faf6', hints: ['rgba(26,107,42,.14)', 'rgba(192,57,43,.12)', 'rgba(255,215,220,.25)', 'rgba(45,106,79,.10)'], accent: '#1a6b45', accent2: '#c0392b', line: 'rgba(26,107,69,.40)' },
      dark:  { base: '#0e2018', hints: ['rgba(26,107,42,.35)', 'rgba(192,57,43,.16)', 'rgba(255,215,220,.08)', 'rgba(14,60,40,.40)'], accent: '#8fe0b8', accent2: '#ff9e9e', line: 'rgba(143,224,184,.30)' },
      particle: { kind: 'snow', color: '#ffffff', count: 42 }
    },
    {
      id: 'new-year', emoji: '🎉', name: "New Year's Eve",
      dates: [[12, 29], [12, 30], [12, 31], [1, 1], [1, 2], [1, 3]],
      light: { base: '#fbf7ec', hints: ['rgba(45,27,78,.14)', 'rgba(184,134,11,.16)', 'rgba(255,230,110,.20)', 'rgba(26,71,42,.10)'], accent: '#9a7a1f', accent2: '#7a5fd0', line: 'rgba(154,122,31,.42)' },
      dark:  { base: '#15102a', hints: ['rgba(90,70,150,.28)', 'rgba(184,134,11,.16)', 'rgba(255,230,110,.10)', 'rgba(26,71,42,.30)'], accent: '#ffe66e', accent2: '#c68cff', line: 'rgba(255,230,110,.32)' },
      particle: { kind: 'confetti', color: null, count: 34 }
    },
    {
      id: 'lunar-new-year', emoji: '🧧', name: 'Spring Festival',
      dates: [[2, 12], [2, 13], [2, 14], [2, 15], [2, 16], [2, 17], [2, 18], [2, 19], [2, 20], [2, 21],
              [2, 4], [2, 5], [2, 6], [2, 7], [2, 8], [2, 9], [2, 10], [2, 11],
              [1, 24], [1, 25], [1, 26], [1, 27], [1, 28], [1, 29], [1, 30], [1, 31]],
      light: { base: '#fff5f0', hints: ['rgba(192,57,43,.18)', 'rgba(232,184,75,.20)', 'rgba(255,215,110,.18)', 'rgba(139,26,26,.10)'], accent: '#a02c2c', accent2: '#d4a017', line: 'rgba(160,44,44,.40)' },
      dark:  { base: '#1c1013', hints: ['rgba(140,30,30,.30)', 'rgba(212,160,23,.16)', 'rgba(255,215,110,.10)', 'rgba(60,15,15,.45)'], accent: '#ffd76e', accent2: '#ff6b6b', line: 'rgba(255,107,107,.35)' },
      particle: { kind: 'lantern', color: '#ff4d4d', count: 18 }
    },
    {
      id: 'valentines', emoji: '💝', name: "Valentine's Day",
      dates: [[2, 12], [2, 13], [2, 14], [2, 15]],
      light: { base: '#fff0f5', hints: ['rgba(255,107,157,.18)', 'rgba(196,69,105,.14)', 'rgba(255,194,212,.22)', 'rgba(122,27,55,.08)'], accent: '#c44569', accent2: '#ff6b9d', line: 'rgba(196,69,105,.40)' },
      dark:  { base: '#241018', hints: ['rgba(196,69,105,.26)', 'rgba(255,107,157,.14)', 'rgba(255,158,199,.10)', 'rgba(58,18,32,.45)'], accent: '#ff9ec7', accent2: '#ff6b9d', line: 'rgba(255,158,199,.32)' },
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

  /* ---------- inject palette CSS (light + dark variants) ---------- */
  function cssFor(mode) {
    var p = T[mode];
    var root = mode === 'dark' ? 'html[data-theme="dark"]' : 'html:not([data-theme="dark"])';
    return (
      root + ' body { background-image:' +
        ' radial-gradient(circle, rgba(255,255,255,.05) 1.5px, transparent 1.6px),' +
        ' radial-gradient(circle at 15% 15%, ' + p.hints[0] + ' 0%, transparent 38%),' +
        ' radial-gradient(circle at 85% 10%, ' + p.hints[1] + ' 0%, transparent 40%),' +
        ' radial-gradient(circle at 78% 86%, ' + p.hints[2] + ' 0%, transparent 42%),' +
        ' radial-gradient(circle at 18% 90%, ' + p.hints[3] + ' 0%, transparent 38%),' +
        ' linear-gradient(160deg, ' + p.base + ' 0%, ' + p.base + ' 100%) !important;' +
        ' background-size: 28px 28px, auto, auto, auto, auto, auto !important; }' +

      /* accents: headings, links, underlines follow the festival palette */
      root + ' h1, ' + root + ' h2, ' + root + ' h3, ' + root + ' h4, ' + root + ' h5, ' + root + ' h6,' +
      root + ' .main-heading, ' + root + ' .author__name, ' + root + ' .skills-title,' +
      root + ' .section-title-mini, ' + root + ' .term-name,' +
      root + ' .blog-hero h1, ' + root + ' .daily-hero h1, ' + root + ' .pub-hero h1,' +
      root + ' .guest-hero h1, ' + root + ' .diary-hero h1,' +
      root + ' .ks-date, ' + root + ' .news-date, ' + root + ' li em,' +
      root + ' .space-card strong, ' + root + ' .space-cta, ' + root + ' .term-group,' +
      root + ' .pub-list-badge, ' + root + ' .status-badge, ' + root + ' .role-badge,' +
      root + ' .glossary-kicker, ' + root + ' .kb-kicker, ' + root + ' .diary-kicker,' +
      root + ' .pub-kicker, ' + root + ' .guest-kicker, ' + root + ' .daily-kicker,' +
      root + ' .featured-tag { color: ' + p.accent + ' !important; }' +

      root + ' a { color: ' + p.accent + ' !important; }' +
      root + ' a:hover { color: ' + p.accent2 + ' !important; }' +

      root + ' h2::after, ' + root + ' .section-title-mini .dash {' +
        ' background: linear-gradient(90deg, ' + p.accent + ', ' + p.accent2 + ' 60%, transparent) !important; }' +

      root + ' .course-tag, ' + root + ' .res-tag, ' + root + ' .res-type {' +
        ' color: ' + p.accent + ' !important; border-color: ' + p.line + ' !important; }' +

      /* card borders tint to the festival line color */
      root + ' .experience-card, ' + root + ' .project-card, ' + root + ' .publication-card,' +
      root + ' .space-card, ' + root + ' .post-card, ' + root + ' .st-card, ' + root + ' .paper-card,' +
      root + ' .skills-card, ' + root + ' .collab-card, ' + root + ' .form-card,' +
      root + ' .channel-card, ' + root + ' .cal-card, ' + root + ' .side-card, ' + root + ' .writer-card,' +
      root + ' .term-card, ' + root + ' .res-card, ' + root + ' .news-box, ' + root + ' .kb-hero,' +
      root + ' .blog-hero, ' + root + ' .daily-hero, ' + root + ' .pub-hero, ' + root + ' .guest-hero, ' + root + ' .diary-hero {' +
        ' border-color: ' + p.line + ' !important; }' +

      /* masthead + footer pick up a translucent festival-tinted surface */
      root + ' .masthead, ' + root + ' .navbar.is-light, ' + root + ' .navbar,' +
      root + ' .page__footer, ' + root + ' .footer {' +
        ' background: ' + p.base + 'e6 !important; border-color: ' + p.line + ' !important; }' +

      root + ' .author__avatar img { box-shadow: 0 0 0 6px ' + p.line + ', 0 0 0 12px ' + p.hints[2] + ', 0 14px 30px rgba(0,0,0,.2) !important; }'
    );
  }

  var style = document.createElement('style');
  style.textContent = cssFor('light') + '\n' + cssFor('dark');
  document.head.appendChild(style);

  /* ---------- festival emoji banner (top-right) ---------- */
  var banner = document.createElement('div');
  banner.id = 'festival-banner';
  banner.textContent = T.emoji;
  banner.title = T.name;
  document.body.appendChild(banner);
})();
