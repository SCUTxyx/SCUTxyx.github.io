/* ✿ Sakura petals — lightweight canvas animation ✿ */
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
      this.speedY = random(0.6, 1.6);
      this.speedX = random(-0.6, 0.6);
      this.rotation = random(0, Math.PI * 2);
      this.spin = random(-0.02, 0.02);
      this.swayPhase = random(0, Math.PI * 2);
      this.swaySpeed = random(0.008, 0.02);
      this.swayAmp = random(0.4, 1.2);
      this.opacity = random(0.35, 0.8);
      this.color = COLORS[Math.floor(random(0, COLORS.length))].replace('%a', this.opacity.toFixed(2));
    };
    this.reset(startAnywhere);
  }

  function drawPetal(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    // petal shape: two arcs forming a soft teardrop
    ctx.moveTo(0, -p.size);
    ctx.bezierCurveTo(p.size, -p.size, p.size, p.size * 0.4, 0, p.size);
    ctx.bezierCurveTo(-p.size, p.size * 0.4, -p.size, -p.size, 0, -p.size);
    ctx.fill();
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
