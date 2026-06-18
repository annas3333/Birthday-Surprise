/* =========================================================
   Faruha's Birthday — Script
   Handles: screen transitions, ambient effects (hearts /
   sparkles), the runaway button game, the confetti burst,
   and the memories slideshow.
   ========================================================= */

(() => {
  'use strict';

  /* ---------- Shared references ---------- */
  const screens = {
    1: document.getElementById('screen1'),
    2: document.getElementById('screen2'),
    3: document.getElementById('screen3'),
    4: document.getElementById('screen4'),
  };

  const bgMusic = document.getElementById('bgMusic');
  const heartsLayer = document.getElementById('heartsLayer');
  const sparklesLayer = document.getElementById('sparklesLayer');

  /* =========================================================
     AMBIENT EFFECTS: floating hearts + sparkles
     ========================================================= */

  const heartEmojis = ['💖', '💕', '💗', '🩷', '❤️'];

  function spawnHeart() {
    const heart = document.createElement('span');
    heart.className = 'floating-heart';
    heart.textContent = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];

    const left = Math.random() * 100; // vw
    const size = 16 + Math.random() * 18; // px
    const duration = 7 + Math.random() * 6; // seconds
    const drift = (Math.random() * 80 - 40) + 'px';

    heart.style.left = left + 'vw';
    heart.style.fontSize = size + 'px';
    heart.style.animationDuration = duration + 's';
    heart.style.setProperty('--drift', drift);

    heartsLayer.appendChild(heart);
    setTimeout(() => heart.remove(), duration * 1000 + 200);
  }

  function spawnSparkle() {
    const sparkle = document.createElement('span');
    sparkle.className = 'sparkle';
    sparkle.textContent = '✦';

    sparkle.style.left = Math.random() * 100 + 'vw';
    sparkle.style.top = Math.random() * 100 + 'vh';
    const duration = 2 + Math.random() * 2;
    sparkle.style.animationDuration = duration + 's';

    sparklesLayer.appendChild(sparkle);
    setTimeout(() => sparkle.remove(), duration * 1000 + 200);
  }

  // Ambient spawn rate — increases later for the "ending" feel.
  let heartIntervalMs = 900;
  let sparkleIntervalMs = 650;
  let heartTimer = null;
  let sparkleTimer = null;

  function startAmbientLoop() {
    if (heartTimer) clearInterval(heartTimer);
    if (sparkleTimer) clearInterval(sparkleTimer);

    heartTimer = setInterval(spawnHeart, heartIntervalMs);
    sparkleTimer = setInterval(spawnSparkle, sparkleIntervalMs);
  }

  function setAmbientRate(heartMs, sparkleMs) {
    heartIntervalMs = heartMs;
    sparkleIntervalMs = sparkleMs;
    startAmbientLoop();
  }

  // Kick things off immediately so the landing screen already feels alive.
  startAmbientLoop();
  // Seed a few hearts/sparkles right away instead of waiting for the first tick.
  for (let i = 0; i < 5; i++) {
    setTimeout(spawnHeart, i * 250);
    setTimeout(spawnSparkle, i * 180);
  }

  /* =========================================================
     SCREEN TRANSITIONS
     ========================================================= */

  function goToScreen(num) {
    Object.values(screens).forEach((el) => {
      el.setAttribute('data-active', 'false');
    });
    screens[num].setAttribute('data-active', 'true');
  }

  /* =========================================================
     SECTION 1 -> SECTION 2
     ========================================================= */

  const startBtn = document.getElementById('startBtn');

  startBtn.addEventListener('click', () => {
    // Try to start the birthday music. Browsers require a user
    // gesture for audio playback, and this click satisfies that.
    bgMusic.volume = 0.85;
    const playPromise = bgMusic.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        // Autoplay-style restrictions or a missing file shouldn't
        // break the experience — the visuals continue regardless.
      });
    }

    goToScreen(2);
  }, { once: true });

  /* =========================================================
     SECTION 2 — THE RUNAWAY BUTTON GAME
     ========================================================= */

  const questionCard = document.querySelector('.question-card');
  const buttonsRow = document.getElementById('buttonsRow');
  const faruhaBtn = document.getElementById('faruhaBtn');
  const otherBtn = document.getElementById('otherBtn');
  const resultMessage = document.getElementById('resultMessage');
  const coverImg = document.getElementById('coverImg');

  let otherBtnCaught = false; // becomes true only if user manages to click it
  let otherBtnDefeated = false; // true once "Faruha" is correctly chosen
  let fleeing = false;

  // Tracks whether the "other girl" button has been lifted out of
  // normal flow into fixed positioning (needed before we can move it
  // freely around the viewport).
  function ensureFleeingMode() {
    if (fleeing) return;
    fleeing = true;

    const rect = otherBtn.getBoundingClientRect();
    otherBtn.style.left = rect.left + 'px';
    otherBtn.style.top = rect.top + 'px';
    otherBtn.classList.add('is-fleeing');
  }

  function moveOtherBtnAwayFrom(clientX, clientY) {
    if (otherBtnDefeated || otherBtnCaught) return;

    ensureFleeingMode();

    const btnRect = otherBtn.getBoundingClientRect();
    const margin = 20;
    const maxLeft = window.innerWidth - btnRect.width - margin;
    const maxTop = window.innerHeight - btnRect.height - margin;

    // Pick a random spot, but bias it away from the cursor so the
    // button visibly "flees" rather than just teleporting randomly.
    let newLeft, newTop, attempts = 0;
    do {
      newLeft = margin + Math.random() * Math.max(1, maxLeft - margin);
      newTop = margin + Math.random() * Math.max(1, maxTop - margin);
      attempts++;
    } while (
      attempts < 6 &&
      Math.hypot(newLeft - clientX, newTop - clientY) < 180
    );

    otherBtn.style.left = newLeft + 'px';
    otherBtn.style.top = newTop + 'px';
  }

  // Distance (px) within which the cursor "scares" the button.
  const FLEE_RADIUS = 130;

  function handlePointerNearButton(clientX, clientY) {
    if (otherBtnDefeated || otherBtnCaught) return;

    const rect = otherBtn.getBoundingClientRect();
    const btnCenterX = rect.left + rect.width / 2;
    const btnCenterY = rect.top + rect.height / 2;
    const dist = Math.hypot(clientX - btnCenterX, clientY - btnCenterY);

    if (dist < FLEE_RADIUS) {
      moveOtherBtnAwayFrom(clientX, clientY);
    }
  }

  // Desktop: mouse movement scares the button.
  document.addEventListener('mousemove', (e) => {
    handlePointerNearButton(e.clientX, e.clientY);
  });

  // Mobile: a touch near the button should make it flee too, since
  // there's no hover state on touchscreens.
  document.addEventListener('touchstart', (e) => {
    if (!e.touches || !e.touches[0]) return;
    handlePointerNearButton(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  // Occasionally nudge the button on its own while screen 2 is active,
  // so it feels alive even before the cursor gets close.
  setInterval(() => {
    if (screens[2].getAttribute('data-active') !== 'true') return;
    if (otherBtnDefeated || otherBtnCaught || !fleeing) return;
    if (Math.random() < 0.35) {
      const rect = otherBtn.getBoundingClientRect();
      moveOtherBtnAwayFrom(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }
  }, 1400);

  // If the user *does* manage to click it (the required fallback):
  otherBtn.addEventListener('click', () => {
    if (otherBtnDefeated) return;
    otherBtnCaught = true;

    showResultMessage("Nice try… but that's impossible! 😜");

    otherBtn.classList.add('is-hidden');
    faruhaBtn.classList.add('faruha-pulse');
  });

  function showResultMessage(text) {
    resultMessage.textContent = text;
    resultMessage.classList.remove('show');
    // restart the fade-in
    requestAnimationFrame(() => resultMessage.classList.add('show'));
  }

  faruhaBtn.addEventListener('click', () => {
    if (otherBtnDefeated) return;
    otherBtnDefeated = true;

    // Disable further interaction with this screen's buttons.
    faruhaBtn.disabled = true;
    otherBtn.classList.add('is-hidden');
    faruhaBtn.classList.remove('faruha-pulse');

    showResultMessage('Correct! There is only one Faruha. 💖');

    // Zoom the cover image slightly.
    coverImg.classList.add('zoomed');

    // Confetti + heart explosion.
    launchConfetti();
    heartExplosion(questionCard);

    // Move on to the finale after ~2 seconds.
    setTimeout(() => {
      goToScreen(3);
      startSlideshow();
    }, 2000);
  });

  /* ---------- Heart explosion burst (on correct answer) ---------- */

  function heartExplosion(originEl) {
    const rect = originEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const count = 24;

    for (let i = 0; i < count; i++) {
      const heart = document.createElement('span');
      heart.textContent = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
      heart.style.position = 'fixed';
      heart.style.left = centerX + 'px';
      heart.style.top = centerY + 'px';
      heart.style.fontSize = (16 + Math.random() * 20) + 'px';
      heart.style.zIndex = '55';
      heart.style.pointerEvents = 'none';
      heart.style.textShadow = '0 0 12px rgba(255,95,168,0.7)';

      const angle = Math.random() * Math.PI * 2;
      const distance = 120 + Math.random() * 220;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance - 60; // bias upward

      heart.style.transition = 'transform 1.4s cubic-bezier(0.22,1,0.36,1), opacity 1.4s ease-out';
      heart.style.transform = 'translate(0, 0) scale(0.6)';
      heart.style.opacity = '1';

      document.body.appendChild(heart);

      requestAnimationFrame(() => {
        heart.style.transform = `translate(${dx}px, ${dy}px) scale(1.1) rotate(${(Math.random() * 60 - 30)}deg)`;
        heart.style.opacity = '0';
      });

      setTimeout(() => heart.remove(), 1500);
    }
  }

  /* =========================================================
     CONFETTI (canvas-based)
     ========================================================= */

  const canvas = document.getElementById('confettiCanvas');
  const ctx = canvas.getContext('2d');
  let confettiParticles = [];
  let confettiAnimating = false;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const confettiColors = ['#ff5fa8', '#ff9fc9', '#8a4fd1', '#ffe3f0', '#fff3c4', '#d6418f'];

  function launchConfetti() {
    const count = 140;
    confettiParticles = [];

    for (let i = 0; i < count; i++) {
      confettiParticles.push({
        x: canvas.width / 2 + (Math.random() * 200 - 100),
        y: canvas.height * 0.35,
        vx: (Math.random() - 0.5) * 12,
        vy: -(Math.random() * 10 + 6),
        size: 6 + Math.random() * 6,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        gravity: 0.28 + Math.random() * 0.12,
        shape: Math.random() < 0.5 ? 'rect' : 'circle',
        life: 0,
        maxLife: 130 + Math.random() * 40,
      });
    }

    if (!confettiAnimating) {
      confettiAnimating = true;
      requestAnimationFrame(animateConfetti);
    }
  }

  function animateConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let stillAlive = false;

    confettiParticles.forEach((p) => {
      p.life++;
      if (p.life > p.maxLife) return;
      stillAlive = true;

      p.vy += p.gravity * 0.05;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;

      const fadeStart = p.maxLife * 0.75;
      const alpha = p.life > fadeStart
        ? Math.max(0, 1 - (p.life - fadeStart) / (p.maxLife - fadeStart))
        : 1;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;

      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    confettiParticles = confettiParticles.filter((p) => p.life <= p.maxLife);

    if (stillAlive) {
      requestAnimationFrame(animateConfetti);
    } else {
      confettiAnimating = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  /* =========================================================
     SECTION 3 — MEMORIES SLIDESHOW
     ========================================================= */

  const slides = document.querySelectorAll('.slide');
  const finaleCard = document.querySelector('.finale-card');
  let slideIndex = 0;
  let slideTimer = null;
  let slideshowStarted = false;
  let slideshowEnded = false;

  function showSlide(index) {
    slides.forEach((slide, i) => {
      if (i === index) {
        // Restart the Ken Burns animation cleanly by toggling the class.
        slide.classList.remove('is-active');
        // eslint-disable-next-line no-unused-expressions
        void slide.offsetWidth; // force reflow so the animation restarts
        slide.classList.add('is-active');
      } else {
        slide.classList.remove('is-active');
      }
    });
  }

  function startSlideshow() {
    if (slideshowStarted) return;
    slideshowStarted = true;

    slideIndex = 0;
    showSlide(slideIndex);

    slideTimer = setInterval(() => {
      slideIndex++;

      if (slideIndex >= slides.length - 1) {
        // We've reached (or are about to reach) the last image.
        slideIndex = slides.length - 1;
        showSlide(slideIndex);
        clearInterval(slideTimer);
        onSlideshowEnd();
        return;
      }

      showSlide(slideIndex);
    }, 4000);
  }

  /* =========================================================
     ENDING EXPERIENCE
     ========================================================= */

  function onSlideshowEnd() {
    if (slideshowEnded) return;
    slideshowEnded = true;

    // Keep the music playing (it already loops, so nothing to do there).

    // Slowly increase floating hearts + sparkles over time.
    setAmbientRate(550, 420);
    setTimeout(() => setAmbientRate(380, 300), 6000);
    setTimeout(() => setAmbientRate(260, 220), 14000);

    // Soft glow pulse on the finale card.
    finaleCard.classList.add('ending-glow');

    // A gentle one-off sparkle/heart shower for extra warmth.
    for (let i = 0; i < 10; i++) {
      setTimeout(spawnHeart, i * 200);
      setTimeout(spawnSparkle, i * 150);
    }
  }

  /* =========================================================
     SECTION 3 -> SECTION 4 — "SOMETHING SPECIAL" BUTTON
     Builds a realistic SVG bouquet of exactly 20 flowers,
     revealed one by one with soft bloom animations.
     ========================================================= */

  const specialBtn = document.getElementById('specialBtn');
  let bouquetBuilt = false;

  // ── SVG helpers ──────────────────────────────────────────
  const SVG_NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs = {}) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    return node;
  }

  // ── Flower definitions ───────────────────────────────────
  // Each entry: { type, colors, cx, cy, r, rotate }
  // cx/cy are within viewBox 0-380 x 0-480.
  // Flowers fill a fan shape: wide at top (~y 60-220), narrow at bottom (~y 240-290).
  const FLOWER_DATA = [
    // Row 1 — outermost arch (y ~80-120)
    { type:'rose',     petals:5, pc:'#e91e8c', cc:'#ff80ab', cx:105, cy:155, r:28, rot:-30 },
    { type:'daisy',    petals:8, pc:'#f8bbd0', cc:'#fff9c4', cx:148, cy:105, r:24, rot:15  },
    { type:'tulip',    pc:'#ff5722', cc:'#ffccbc',            cx:190, cy: 80, r:26, rot:0   },
    { type:'daisy',    petals:8, pc:'#ce93d8', cc:'#fff9c4', cx:232, cy:105, r:24, rot:-20 },
    { type:'rose',     petals:5, pc:'#f44336', cc:'#ef9a9a', cx:275, cy:155, r:28, rot:25  },
    // Row 2 — middle band (y ~130-190)
    { type:'peony',    petals:12,pc:'#f48fb1', cc:'#fce4ec', cx:128, cy:185, r:30, rot:10  },
    { type:'sunflower',petals:14,pc:'#fdd835', cc:'#795548', cx:168, cy:145, r:26, rot:5   },
    { type:'rose',     petals:5, pc:'#9c27b0', cc:'#e1bee7', cx:190, cy:130, r:28, rot:-5  },
    { type:'sunflower',petals:14,pc:'#ff9800', cc:'#5d4037', cx:212, cy:145, r:26, rot:-8  },
    { type:'peony',    petals:12,pc:'#f06292', cc:'#fce4ec', cx:252, cy:185, r:30, rot:-12 },
    // Row 3 — inner mid (y ~200-240)
    { type:'daisy',    petals:8, pc:'#fff176', cc:'#fbc02d', cx:150, cy:230, r:22, rot:20  },
    { type:'rose',     petals:5, pc:'#ff4081', cc:'#ff80ab', cx:178, cy:205, r:26, rot:-15 },
    { type:'tulip',    pc:'#ab47bc', cc:'#e1bee7',           cx:202, cy:205, r:26, rot:8   },
    { type:'rose',     petals:5, pc:'#e53935', cc:'#ef9a9a', cx:228, cy:230, r:26, rot:18  },
    // Row 4 — dense center front (y ~245-285)
    { type:'peony',    petals:12,pc:'#ec407a', cc:'#fce4ec', cx:165, cy:268, r:28, rot:-8  },
    { type:'rose',     petals:5, pc:'#d81b60', cc:'#f48fb1', cx:190, cy:252, r:30, rot:0   },
    { type:'peony',    petals:12,pc:'#e91e8c', cc:'#fce4ec', cx:215, cy:268, r:28, rot:10  },
    // Row 5 — front fill (y ~285-310)
    { type:'daisy',    petals:8, pc:'#f8bbd0', cc:'#fff9c4', cx:174, cy:298, r:20, rot:30  },
    { type:'tulip',    pc:'#e91e8c', cc:'#f8bbd0',           cx:190, cy:290, r:24, rot:-5  },
    { type:'daisy',    petals:8, pc:'#f3e5f5', cc:'#fdd835', cx:206, cy:298, r:20, rot:-25 },
  ];

  // ── Draw a rose (layered petals spiral) ──────────────────
  function drawRose(g, d) {
    const { cx, cy, r, pc, cc, rot = 0 } = d;
    // Outer petals
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * 360 + rot;
      const rad = angle * Math.PI / 180;
      const px = cx + Math.cos(rad) * r * 0.65;
      const py = cy + Math.sin(rad) * r * 0.65;
      const p = el('ellipse', {
        cx: px, cy: py,
        rx: r * 0.45, ry: r * 0.55,
        fill: pc,
        opacity: '0.88',
        transform: `rotate(${angle + 90},${px},${py})`,
      });
      g.appendChild(p);
    }
    // Inner petals
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * 360 + rot + 36;
      const rad = angle * Math.PI / 180;
      const px = cx + Math.cos(rad) * r * 0.35;
      const py = cy + Math.sin(rad) * r * 0.35;
      const p = el('ellipse', {
        cx: px, cy: py,
        rx: r * 0.3, ry: r * 0.38,
        fill: cc,
        opacity: '0.92',
        transform: `rotate(${angle + 90},${px},${py})`,
      });
      g.appendChild(p);
    }
    // Center
    g.appendChild(el('circle', { cx, cy, r: r * 0.22, fill: '#fff9e7', opacity: '0.95' }));
  }

  // ── Draw a daisy ─────────────────────────────────────────
  function drawDaisy(g, d) {
    const { cx, cy, r, pc, cc, petals = 8, rot = 0 } = d;
    for (let i = 0; i < petals; i++) {
      const angle = (i / petals) * 360 + rot;
      const rad = angle * Math.PI / 180;
      const px = cx + Math.cos(rad) * r * 0.62;
      const py = cy + Math.sin(rad) * r * 0.62;
      g.appendChild(el('ellipse', {
        cx: px, cy: py,
        rx: r * 0.22, ry: r * 0.46,
        fill: pc,
        opacity: '0.9',
        transform: `rotate(${angle + 90},${px},${py})`,
      }));
    }
    g.appendChild(el('circle', { cx, cy, r: r * 0.28, fill: cc, opacity: '0.95' }));
    g.appendChild(el('circle', { cx, cy, r: r * 0.13, fill: '#fff59d', opacity: '1' }));
  }

  // ── Draw a tulip ─────────────────────────────────────────
  function drawTulip(g, d) {
    const { cx, cy, r, pc, cc, rot = 0 } = d;
    // 3 petals — left, right, center
    const petalDefs = [
      { dx: -r * 0.38, rotOff: -22 },
      { dx:  r * 0.38, rotOff:  22 },
      { dx:  0,        rotOff:   0 },
    ];
    petalDefs.forEach(({ dx, rotOff }) => {
      g.appendChild(el('ellipse', {
        cx: cx + dx,
        cy: cy - r * 0.2,
        rx: r * 0.38,
        ry: r * 0.62,
        fill: dx === 0 ? cc : pc,
        opacity: '0.92',
        transform: `rotate(${rotOff + rot},${cx + dx},${cy - r * 0.2})`,
      }));
    });
    // Highlight streak
    g.appendChild(el('ellipse', {
      cx, cy: cy - r * 0.3,
      rx: r * 0.1, ry: r * 0.35,
      fill: 'rgba(255,255,255,0.3)',
      transform: `rotate(${rot},${cx},${cy - r * 0.3})`,
    }));
  }

  // ── Draw a peony (many layered petals) ───────────────────
  function drawPeony(g, d) {
    const { cx, cy, r, pc, cc, petals = 12, rot = 0 } = d;
    // Outer ring
    for (let i = 0; i < petals; i++) {
      const angle = (i / petals) * 360 + rot;
      const rad = angle * Math.PI / 180;
      const px = cx + Math.cos(rad) * r * 0.6;
      const py = cy + Math.sin(rad) * r * 0.6;
      g.appendChild(el('ellipse', {
        cx: px, cy: py,
        rx: r * 0.28, ry: r * 0.42,
        fill: pc,
        opacity: '0.82',
        transform: `rotate(${angle + 90},${px},${py})`,
      }));
    }
    // Inner ring
    const inner = Math.round(petals * 0.67);
    for (let i = 0; i < inner; i++) {
      const angle = (i / inner) * 360 + rot + 15;
      const rad = angle * Math.PI / 180;
      const px = cx + Math.cos(rad) * r * 0.32;
      const py = cy + Math.sin(rad) * r * 0.32;
      g.appendChild(el('ellipse', {
        cx: px, cy: py,
        rx: r * 0.2, ry: r * 0.28,
        fill: cc,
        opacity: '0.9',
        transform: `rotate(${angle + 90},${px},${py})`,
      }));
    }
    // Center
    g.appendChild(el('circle', { cx, cy, r: r * 0.18, fill: '#fff9c4', opacity: '0.95' }));
    g.appendChild(el('circle', { cx, cy, r: r * 0.08, fill: '#fdd835', opacity: '1' }));
  }

  // ── Draw a sunflower ─────────────────────────────────────
  function drawSunflower(g, d) {
    const { cx, cy, r, pc, cc, petals = 14, rot = 0 } = d;
    for (let i = 0; i < petals; i++) {
      const angle = (i / petals) * 360 + rot;
      const rad = angle * Math.PI / 180;
      const px = cx + Math.cos(rad) * r * 0.68;
      const py = cy + Math.sin(rad) * r * 0.68;
      g.appendChild(el('ellipse', {
        cx: px, cy: py,
        rx: r * 0.18, ry: r * 0.4,
        fill: pc,
        opacity: '0.92',
        transform: `rotate(${angle + 90},${px},${py})`,
      }));
    }
    // Disk
    g.appendChild(el('circle', { cx, cy, r: r * 0.36, fill: cc }));
    // Disk texture dots
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const dr = r * 0.18;
      g.appendChild(el('circle', {
        cx: cx + Math.cos(a) * dr,
        cy: cy + Math.sin(a) * dr,
        r: r * 0.06,
        fill: 'rgba(0,0,0,0.3)',
      }));
    }
    g.appendChild(el('circle', { cx, cy, r: r * 0.08, fill: 'rgba(0,0,0,0.4)' }));
  }

  // ── Build stems ──────────────────────────────────────────
  function buildStems(stemsG) {
    // Each flower gets a slightly curved stem down to wrap opening
    const wrapTopY = 310;
    FLOWER_DATA.forEach((d) => {
      const stemEl = el('path', {
        d: `M${d.cx},${d.cy + (d.r || 26) * 0.7} Q${d.cx + (Math.random() * 14 - 7)},${(d.cy + wrapTopY) / 2} ${190},${wrapTopY}`,
        stroke: 'url(#stemGrad)',
        'stroke-width': '3.5',
        'stroke-linecap': 'round',
        fill: 'none',
        opacity: '0.75',
      });
      stemsG.appendChild(stemEl);
    });
  }

  // ── Build leaves ─────────────────────────────────────────
  function buildLeaves(leavesG) {
    const leafPositions = [
      { cx: 155, cy: 280, rx: 22, ry: 10, rot: -40 },
      { cx: 225, cy: 280, rx: 22, ry: 10, rot:  40 },
      { cx: 138, cy: 260, rx: 18, ry:  8, rot: -55 },
      { cx: 242, cy: 260, rx: 18, ry:  8, rot:  55 },
      { cx: 168, cy: 300, rx: 16, ry:  7, rot: -30 },
      { cx: 212, cy: 300, rx: 16, ry:  7, rot:  30 },
    ];
    leafPositions.forEach(({ cx, cy, rx, ry, rot }) => {
      const leaf = el('ellipse', { cx, cy, rx, ry, fill: 'url(#leafGrad)', opacity: '0.85',
        transform: `rotate(${rot},${cx},${cy})` });
      // Midrib
      const midrib = el('line', {
        x1: cx - Math.cos(rot * Math.PI / 180) * rx * 0.8,
        y1: cy - Math.sin(rot * Math.PI / 180) * rx * 0.8,
        x2: cx + Math.cos(rot * Math.PI / 180) * rx * 0.8,
        y2: cy + Math.sin(rot * Math.PI / 180) * rx * 0.8,
        stroke: '#1b5e20', 'stroke-width': '1', opacity: '0.6',
      });
      leavesG.appendChild(leaf);
      leavesG.appendChild(midrib);
    });
  }

  // ── Reveal flowers one by one ────────────────────────────
  function revealFlowers(flowerEls, caption) {
    flowerEls.forEach((g, i) => {
      setTimeout(() => {
        g.classList.add('f-visible');
        spawnSparkle();
        // After bloom, switch to gentle sway
        setTimeout(() => {
          g.classList.remove('f-visible');
          g.style.opacity = '1';
          g.style.transform = 'scale(1) translateY(0)';
          g.classList.add('f-sway');
          // Each flower sways slightly out of phase
          g.style.animationDelay = (i * 0.18) + 's';
          g.style.transformOrigin = `${FLOWER_DATA[i].cx}px ${FLOWER_DATA[i].cy + 30}px`;
        }, 800);
      }, i * 260);
    });

    // Show caption after all flowers are visible
    setTimeout(() => {
      caption.classList.add('caption-visible');
    }, FLOWER_DATA.length * 260 + 800);
  }

  // ── Main build function ───────────────────────────────────
  function buildBouquet() {
    if (bouquetBuilt) return;
    bouquetBuilt = true;

    const svg      = document.getElementById('bouquetSvg');
    const stemsG   = document.getElementById('stemsGroup');
    const leavesG  = document.getElementById('leavesGroup');
    const flowersG = document.getElementById('flowersGroup');
    const caption  = document.getElementById('bouquetCaption');

    // Build static structure (stems, leaves)
    buildStems(stemsG);
    buildLeaves(leavesG);

    // Build each flower as an SVG group with class svg-flower
    const flowerEls = FLOWER_DATA.map((d) => {
      const g = document.createElementNS(SVG_NS, 'g');
      g.classList.add('svg-flower');
      g.setAttribute('filter', 'url(#softGlow)');
      // Set transform-origin for sway animation
      g.style.transformOrigin = `${d.cx}px ${d.cy + 25}px`;

      switch (d.type) {
        case 'rose':      drawRose(g, d);      break;
        case 'daisy':     drawDaisy(g, d);     break;
        case 'tulip':     drawTulip(g, d);     break;
        case 'peony':     drawPeony(g, d);     break;
        case 'sunflower': drawSunflower(g, d); break;
      }

      flowersG.appendChild(g);
      return g;
    });

    // Stagger reveal
    revealFlowers(flowerEls, caption);
  }

  specialBtn.addEventListener('click', () => {
    goToScreen(4);
    buildBouquet();
  }, { once: true });

})();
