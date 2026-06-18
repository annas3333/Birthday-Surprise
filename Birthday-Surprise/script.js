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

})();
