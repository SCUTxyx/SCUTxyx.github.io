/* ✿ Sakura petals + festival particles — lightweight canvas animation ✿ */
(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var canvas = document.createElement('canvas');
  canvas.id = 'sakura-canvas';
  document.body.appendChild(canvas);
  var ctx = canvas.getContext('2d');

  var WIDTH, HEIGHT, petals = [], PETAL_COUNT = 26;
  var COLORS = [
    'rgba(255, 183, 213, %a)',   // sakura pink
    'rgba(247, 143, 179, %a)',   // deep pink
    'rgba(198, 169, 245, %a)',   // lavender
    'rgba(255, 218, 233, %a)'    // pale pink
  ];

  /* festival override: when a festival theme is active, use its particle style */
  var F = window.__festivalTheme || null;
  if (F) {
    PETAL_COUNT = F.particle.count;
    if (F.particle.color) COLORS = [F.particle.color];
  }
  var PKIND = F ? F.particle.kind : 'sakura';
  var CONFETTI_COLORS = ['#f78fb3', '#ffd76e', '#6cc5a3', '#8ec5f2', '#b69df2', '#ff6b6b'];

  function resize() {
    WIDTH = canvas.width = window.innerWidth;
    HEIGHT = canvas.height = window.innerHeight;
  }

  function random(min, max) { return Math.random() * (max - min) + min; }

  function Petal(startAnywhere) {
    this.reset = function (anywhere) {
      this.x = random(0, WIDTH);
      this.y = anywhere ? random(-HEIGHT, 0) : random(-60, -10);
      this.size = random(5, 11);
      if (PKIND === 'confetti') this.size = random(6, 12);
      this.speedY = PKIND === 'snow' ? random(0.9, 2.2) : random(0.6, 1.6);
      if (PKIND === 'moon' || PKIND === 'lantern') this.speedY = random(0.3, 0.8); // floaters drift slower
      this.speedX = PKIND === 'confetti' ? random(-1.4, 1.4) : random(-0.6, 0.6);
      this.rotation = random(0, Math.PI * 2);
      this.spin = PKIND === 'confetti' ? random(-0.08, 0.08) : random(-0.02, 0.02);
      this.swayPhase = random(0, Math.PI * 2);
      this.swaySpeed = random(0.008, 0.02);
      this.swayAmp = random(0.4, 1.2);
      this.opacity = random(0.35, 0.8);
      if (PKIND === 'confetti') {
        var c = CONFETTI_COLORS[Math.floor(random(0, CONFETTI_COLORS.length))];
        // convert hex to rgba with opacity
        var r = parseInt(c.slice(1, 3), 16), g = parseInt(c.slice(3, 5), 16), b = parseInt(c.slice(5, 7), 16);
        this.color = 'rgba(' + r + ',' + g + ',' + b + ',' + this.opacity.toFixed(2) + ')';
      } else {
        this.color = COLORS[Math.floor(random(0, COLORS.length))].replace('%a', this.opacity.toFixed(2));
      }
    };
    this.reset(startAnywhere);
  }

  function drawPetal(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.fillStyle = p.color;
    switch (PKIND) {
      case 'moon':   // glowing full moon
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 1.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        break;
      case 'star':   // five-pointed star
        ctx.beginPath();
        for (var i = 0; i < 5; i++) {
          var a = -Math.PI / 2 + i * Math.PI * 2 / 5;
          ctx.lineTo(Math.cos(a) * p.size, Math.sin(a) * p.size);
          a += Math.PI / 5;
          ctx.lineTo(Math.cos(a) * p.size * 0.45, Math.sin(a) * p.size * 0.45);
        }
        ctx.closePath(); ctx.fill();
        break;
      case 'pumpkin': // little pumpkin
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-p.size * 0.12, -p.size * 1.05, p.size * 0.24, p.size * 0.3);
        break;
      case 'snow':   // soft snowflake dot
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.42, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        break;
      case 'confetti': // rotating confetti rectangle
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size * 0.5, -p.size * 0.28, p.size, p.size * 0.56);
        break;
      case 'lantern': // red lantern
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 0.75, p.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-p.size * 0.3, -p.size * 0.72, p.size * 0.6, p.size * 0.14);
        ctx.fillRect(-p.size * 0.3, p.size * 0.5, p.size * 0.6, p.size * 0.14);
        break;
      case 'heart':  // heart
        var s = p.size / 9;
        ctx.beginPath();
        ctx.moveTo(0, s * 3);
        ctx.bezierCurveTo(-s * 5, -s, -s * 3, -s * 5, 0, -s * 2);
        ctx.bezierCurveTo(s * 3, -s * 5, s * 5, -s, 0, s * 3);
        ctx.fill();
        break;
      default:       // sakura petal (original)
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.bezierCurveTo(p.size, -p.size, p.size, p.size * 0.4, 0, p.size);
        ctx.bezierCurveTo(-p.size, p.size * 0.4, -p.size, -p.size, 0, -p.size);
        ctx.fill();
    }
    ctx.restore();
  }

  function tick() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    for (var i = 0; i < petals.length; i++) {
      var p = petals[i];
      p.swayPhase += p.swaySpeed;
      p.x += p.speedX + Math.sin(p.swayPhase) * p.swayAmp;
      p.y += p.speedY;
      p.rotation += p.spin;
      if (p.y > HEIGHT + 20 || p.x < -30 || p.x > WIDTH + 30) p.reset(false);
      drawPetal(p);
    }
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', resize);
  resize();
  for (var i = 0; i < PETAL_COUNT; i++) petals.push(new Petal(true));
  tick();
})();

/* ✿ Back-to-top button — appears after one screen of scrolling ✿ */
(function () {
  var btn = document.createElement('button');
  btn.id = 'back-to-top';
  btn.title = 'Back to top';
  btn.innerHTML = '🌸';
  btn.style.display = 'none';
  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  document.body.appendChild(btn);

  var toggle = function () {
    btn.style.display = (window.scrollY > 600) ? 'flex' : 'none';
  };
  window.addEventListener('scroll', toggle, { passive: true });
  toggle();
})();

/* 🌙 dark-mode toggle — remembers the choice in localStorage 🌙 */
(function () {
  var btn = document.createElement('button');
  btn.id = 'theme-toggle';
  function icon() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙';
  }
  btn.textContent = icon();
  btn.title = 'Toggle dark mode';
  btn.addEventListener('click', function () {
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (dark) {
      document.documentElement.removeAttribute('data-theme');
      try { localStorage.setItem('theme', 'light'); } catch (e) {}
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      try { localStorage.setItem('theme', 'dark'); } catch (e) {}
    }
    btn.textContent = icon();
  });
  document.body.appendChild(btn);
})();

/* ✿ Owner-only Studio entry — visible only in a browser where the
   GitHub token is stored (i.e. the owner's). Visitors never see it. ✿ */
(function () {
  try {
    if (!localStorage.getItem('gh_token')) return;
  } catch (e) { return; }
  var a = document.createElement('a');
  a.href = '/studio.html';
  a.id = 'studio-link';
  a.textContent = '✍️';
  a.title = 'Private Studio';
  document.body.appendChild(a);
})();
