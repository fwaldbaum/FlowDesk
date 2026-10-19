// Halloween page: rate how you behaved (1-100), hold the "fingerprint", then the wheel lands on a prize.
// A higher score makes the rare (low-weight) prizes likelier. After the prize it starts over for the next person.
(() => {
  const cfg = JSON.parse(document.getElementById('hw-config').textContent);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel) => document.querySelector(sel);
  const SVG = 'http://www.w3.org/2000/svg';
  const light = (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.6;
  };
  const dark = (hex) => !light(hex) && [1, 3, 5].every((i) => parseInt(hex.slice(i, i + 2), 16) < 70);

  // ---- Sky: stars and bats ----------------------------------------------------------
  if (cfg.stars) {
    const box = $('.hw-stars');
    for (let i = 0; i < 90; i++) {
      const s = document.createElement('span');
      s.style.left = `${Math.random() * 100}%`;
      s.style.top = `${Math.random() * 70}%`;
      s.style.setProperty('--d', `${2 + Math.random() * 4}s`);
      s.style.setProperty('--delay', `${-Math.random() * 6}s`);
      if (Math.random() < .2) s.style.width = s.style.height = '3px';
      box.appendChild(s);
    }
  }
  if (cfg.bats && !reduced) {
    const box = $('.hw-bats');
    const bat = '<svg viewBox="0 0 64 32" fill="currentColor"><path d="M32 10c2-4 4-6 4-6l1 5c3-1 5 0 5 0s6-7 14-7c-3 3-4 7-3 11 4-2 8-1 11 2-6 0-10 4-11 9-3-3-7-4-11-2 0-4-3-7-6-7l-4 9-4-9c-3 0-6 3-6 7-4-2-8-1-11 2-1-5-5-9-11-9 3-3 7-4 11-2 1-4 0-8-3-11 8 0 14 7 14 7s2-1 5 0l1-5s2 2 4 6z"/></svg>';
    for (let i = 0; i < 6; i++) {
      const b = document.createElement('div');
      b.className = 'bat';
      b.innerHTML = bat;
      b.style.top = `${8 + Math.random() * 45}%`;
      b.style.setProperty('--d', `${14 + Math.random() * 14}s`);
      b.style.setProperty('--delay', `${-Math.random() * 20}s`);
      b.style.setProperty('--s', (0.5 + Math.random() * 0.8).toFixed(2));
      box.appendChild(b);
    }
  }

  // ---- Sound (Web Audio, no files) ---------------------------------------------------
  let audio;
  const ctx = () => {
    if (!cfg.sound) return null;
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    return audio;
  };
  const tone = (freq, dur, type = 'triangle', gain = 0.06) => {
    const a = ctx();
    if (!a) return;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(gain, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
    o.connect(g).connect(a.destination);
    o.start();
    o.stop(a.currentTime + dur);
  };
  const fanfare = () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.35, 'triangle', 0.08), i * 120));

  // ---- Behavior bar ---------------------------------------------------------------------
  // Score 1-100 turns into an exponent on each prize's weight: 1 favors the common prizes even more,
  // ~50 keeps the configured odds, 100 flips them so the rarest prize is the most likely.
  const odds = (score) => {
    const t = (score - 1) / 99;
    const exp = 1 + 4 * (0.5 - t);
    return cfg.items.map((it) => Math.pow(Math.max(1, it.weight || 1), exp));
  };
  const behavior = $('.hw-behavior');
  const scoreInput = $('.behavior-input');
  let score = 50.5;
  const moods = [[20, 'Muy travieso'], [40, 'Algo travieso'], [60, 'Más o menos'], [80, 'Bastante bien'], [100, 'Un angelito']];
  const minWeight = Math.min(...cfg.items.map((it) => Math.max(1, it.weight || 1)));
  const sameWeights = cfg.items.every((it) => Math.max(1, it.weight || 1) === minWeight);
  const paintScore = () => {
    const v = Number(scoreInput.value);
    $('.score-num').textContent = v;
    $('.score-mood').textContent = moods.find(([max]) => v <= max)[1];
    behavior.style.setProperty('--score', v);
    behavior.style.setProperty('--hue', Math.round((v - 1) * 1.2));
    scoreInput.setAttribute('aria-valuetext', `${v} de 100, ${moods.find(([max]) => v <= max)[1]}`);
    if (!sameWeights) {
      const w = odds(v);
      const total = w.reduce((a, b) => a + b, 0);
      const rare = cfg.items.reduce((sum, it, i) => sum + (Math.max(1, it.weight || 1) === minWeight ? w[i] : 0), 0);
      $('.behavior-luck b').textContent = `${Math.round((rare / total) * 100)}%`;
      $('.behavior-luck').hidden = false;
    }
  };
  if (behavior) {
    scoreInput.addEventListener('input', () => {
      paintScore();
      tone(220 + Number(scoreInput.value) * 6, 0.05, 'sine', 0.02);
    });
    paintScore();
    $('.behavior-go').addEventListener('click', () => {
      score = Number(scoreInput.value);
      ctx()?.resume();
      tone(660, 0.15);
      behavior.classList.add('leaving');
      setTimeout(() => {
        behavior.hidden = true;
        behavior.classList.remove('leaving');
        sensorWrap.hidden = false;
        sensor.focus({ preventScroll: true });
      }, 450);
    });
  }

  // ---- Fingerprint sensor ------------------------------------------------------------
  const sensor = $('.hw-sensor');
  const sensorWrap = $('.hw-sensor-wrap');
  const hintText = $('.hint-text');
  const hintCount = $('.hint-count');
  const holdMs = cfg.holdSeconds * 1000;
  let progress = 0;
  let holding = false;
  let last = 0;
  let raf = 0;
  let hum;

  const paint = () => {
    sensor.style.setProperty('--p', progress.toFixed(4));
    const left = Math.ceil((1 - progress) * cfg.holdSeconds);
    hintCount.textContent = holding && progress < 1 ? `${left} s` : '';
  };
  const loop = (now) => {
    const dt = now - last;
    last = now;
    progress = holding ? Math.min(1, progress + dt / holdMs) : Math.max(0, progress - dt / 500);
    paint();
    if (progress >= 1) return accept();
    if (holding || progress > 0) raf = requestAnimationFrame(loop);
  };
  const start = (e) => {
    if (sensor.classList.contains('done')) return;
    e?.preventDefault();
    if (e?.pointerId !== undefined) sensor.setPointerCapture(e.pointerId);
    holding = true;
    sensor.classList.add('holding');
    const a = ctx();
    if (a) {
      a.resume();
      hum = a.createOscillator();
      const g = a.createGain();
      hum.type = 'sine';
      hum.frequency.value = 180;
      hum.frequency.linearRampToValueAtTime(420, a.currentTime + cfg.holdSeconds);
      g.gain.value = 0.025;
      hum.connect(g).connect(a.destination);
      hum.start();
    }
    navigator.vibrate?.(30);
    cancelAnimationFrame(raf);
    last = performance.now();
    raf = requestAnimationFrame(loop);
  };
  const stop = () => {
    if (!holding) return;
    holding = false;
    sensor.classList.remove('holding');
    try { hum?.stop(); } catch {}
    hum = null;
    cancelAnimationFrame(raf);
    last = performance.now();
    raf = requestAnimationFrame(loop);
  };
  const accept = () => {
    holding = false;
    try { hum?.stop(); } catch {}
    sensor.classList.remove('holding');
    sensor.classList.add('done');
    hintText.textContent = cfg.sensorDone;
    hintCount.textContent = '';
    navigator.vibrate?.([40, 60, 40]);
    tone(880, 0.25);
    setTimeout(() => tone(1320, 0.3), 120);
    setTimeout(() => {
      sensorWrap.classList.add('leaving');
      setTimeout(showWheel, 480);
    }, 700);
  };

  sensor.addEventListener('pointerdown', start);
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((t) => sensor.addEventListener(t, stop));
  sensor.addEventListener('contextmenu', (e) => e.preventDefault());
  sensor.addEventListener('keydown', (e) => {
    if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) start(e);
  });
  sensor.addEventListener('keyup', (e) => {
    if (e.key === ' ' || e.key === 'Enter') stop();
  });

  // ---- Wheel ------------------------------------------------------------------------------
  const wheelWrap = $('.hw-wheel-wrap');
  const wheel = $('.wheel');
  const pointer = $('.wheel-pointer');
  const items = cfg.items;
  const slice = 360 / items.length;
  let rotation = 0;

  const el = (tag, attrs) => {
    const n = document.createElementNS(SVG, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    return n;
  };
  const polar = (r, deg) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [r * Math.cos(rad), r * Math.sin(rad)];
  };
  const build = () => {
    wheel.innerHTML = '';
    wheel.appendChild(el('circle', { r: 108, class: 'rim' }));
    const g = el('g', { class: 'disc' });
    items.forEach((item, i) => {
      const a0 = i * slice;
      const a1 = a0 + slice;
      const [x0, y0] = polar(100, a0);
      const [x1, y1] = polar(100, a1);
      const large = slice > 180 ? 1 : 0;
      g.appendChild(el('path', { d: `M0 0L${x0} ${y0}A100 100 0 ${large} 1 ${x1} ${y1}Z`, fill: item.color, class: 'slice', 'data-i': i }));
      // Labels run along the radius, reading outward.
      const mid = a0 + slice / 2;
      const t = el('text', { x: 30, y: 0, transform: `rotate(${mid - 90})`, class: light(item.color) ? 'ink' : '' });
      // Shrink long labels to fit between the hub and the rim (and the slice height when there are many).
      const label = item.label.length > 30 ? `${item.label.slice(0, 29)}…` : item.label;
      const room = Math.min(66 / (label.length * 0.56), (slice / 360) * 2 * Math.PI * 62 * 0.8);
      t.setAttribute('font-size', Math.max(4, Math.min(8, room)).toFixed(2));
      t.textContent = label;
      g.appendChild(t);
      const [px, py] = polar(104, a0);
      g.appendChild(el('circle', { cx: px, cy: py, r: 2.6, class: 'peg' }));
    });
    wheel.appendChild(g);
  };
  build();

  const pick = () => {
    const w = odds(score);
    let r = Math.random() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < items.length; i++) {
      r -= w[i];
      if (r < 0) return i;
    }
    return items.length - 1;
  };
  const ease = (t) => 1 - Math.pow(1 - t, 4);

  const spin = () => {
    const win = pick();
    const jitter = (Math.random() - 0.5) * slice * 0.7;
    const turns = Math.max(2, Math.round(cfg.spinSpeed * cfg.spinSeconds));
    // Slice i sits at angle i*slice clockwise from the top; rotate so its middle ends under the pointer.
    const base = rotation - (rotation % 360);
    const target = base + turns * 360 + (360 - (win * slice + slice / 2 + jitter));
    const from = rotation;
    const dur = reduced ? 600 : cfg.spinSeconds * 1000;
    const t0 = performance.now();
    let lastPeg = Math.floor(from / slice);
    wheel.querySelectorAll('.slice.win').forEach((s) => s.classList.remove('win'));

    const frame = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      rotation = from + (target - from) * ease(t);
      wheel.style.transform = `rotate(${rotation}deg)`;
      const peg = Math.floor(rotation / slice);
      if (peg !== lastPeg) {
        lastPeg = peg;
        pointer.classList.remove('tick');
        void pointer.getBoundingClientRect();
        pointer.classList.add('tick');
        tone(1400 + Math.random() * 200, 0.04, 'square', 0.025);
      }
      if (t < 1) return requestAnimationFrame(frame);
      wheel.querySelector(`.slice[data-i="${win}"]`)?.classList.add('win');
      setTimeout(() => reveal(items[win]), 500);
    };
    requestAnimationFrame(frame);
  };

  const showWheel = () => {
    sensorWrap.hidden = true;
    wheelWrap.hidden = false;
    setTimeout(spin, reduced ? 100 : 900);
  };

  // ---- Result and confetti ------------------------------------------------------------------
  const result = $('.hw-result');
  const canvas = $('.hw-confetti');
  const confetti = (color) => {
    if (reduced) return;
    const c = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    c.scale(dpr, dpr);
    const colors = [color, cfg.items[0]?.color, '#fde68a', '#ffffff', getComputedStyle(document.body).getPropertyValue('--accent').trim()];
    const parts = Array.from({ length: 160 }, () => ({
      x: innerWidth / 2, y: innerHeight / 2,
      vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 16 - 4,
      s: 4 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
      c: colors[Math.floor(Math.random() * colors.length)],
    }));
    const t0 = performance.now();
    const draw = (now) => {
      c.clearRect(0, 0, innerWidth, innerHeight);
      parts.forEach((p) => {
        p.vy += 0.35; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.fillStyle = p.c;
        c.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); c.restore();
      });
      if (now - t0 < 4000) requestAnimationFrame(draw);
      else c.clearRect(0, 0, innerWidth, innerHeight);
    };
    requestAnimationFrame(draw);
  };
  const reveal = (item) => {
    $('.result-prize').textContent = item.label;
    // A very dark slice color wouldn't read on the dark card.
    result.style.setProperty('--prize', dark(item.color) ? 'var(--accent)' : item.color);
    result.hidden = false;
    fanfare();
    confetti(item.color);
    result.querySelector('.replay')?.focus();
    // Without a button the page returns to the start by itself, ready for the next person.
    const next = result.querySelector('.result-next b');
    if (next) {
      let left = 8;
      next.textContent = left;
      const timer = setInterval(() => {
        left -= 1;
        next.textContent = left;
        if (left <= 0) {
          clearInterval(timer);
          restart();
        }
      }, 1000);
    }
  };
  // Next person: back to the behavior bar (or the sensor when the bar is off).
  const restart = () => {
    result.hidden = true;
    wheelWrap.hidden = true;
    sensorWrap.classList.remove('leaving');
    sensor.classList.remove('done', 'holding');
    progress = 0;
    paint();
    hintText.textContent = cfg.sensorHint;
    if (behavior) {
      scoreInput.value = 50;
      paintScore();
      sensorWrap.hidden = true;
      behavior.hidden = false;
      scoreInput.focus({ preventScroll: true });
    } else {
      sensorWrap.hidden = false;
    }
  };
  result.querySelector('.replay')?.addEventListener('click', restart);
})();
