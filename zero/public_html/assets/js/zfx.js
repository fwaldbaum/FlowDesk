/*
 * zfx: the motion kit shared by the ZERO sites (ZERO, Repeat, Venu). Plain JS, no build, driven by data attributes:
 *   data-split / data-split-words   text that rises letter by letter or word by word when it enters the screen
 *   data-reveal (+ style="--d:.2s") fade, lift and unblur on scroll;   data-blur  focus-in paragraph
 *   data-rotate='["a","b"]'          rotating word;                     data-nav    nav gets .scrolled (and .on-dark over [data-dark])
 *   data-tilt                        3D tilt toward the pointer, sets --rx --ry --gx --gy and .tilting
 *   data-magnet / data-spark         magnetic button / click sparks in --zfx-accent
 *   data-dots                        springy dot grid canvas;          data-velocity="1|-1"  marquee row sped up by scrolling
 *   data-spotlight                   children get --mx --my under the pointer
 *   data-odometer="41"               rolling counter;                   data-count="4"  counts up once
 *   data-swap                        stack of cards; the front one moves to the back every few seconds (click to advance)
 *   data-stack                       scroll stack: [data-stack-card] children pin and shrink as the next one arrives
 *   data-steps                       sticky story: [data-step] items switch [data-shot] and [data-dot] inside [data-stage]
 * Effects in the spirit of React Bits (reactbits.dev), written from scratch. Everything respects reduced motion.
 */
(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.add('zfx');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(pointer: fine)').matches;
  const $$ = (sel, scope = document) => [...scope.querySelectorAll(sel)];
  const css = (name, fallback) => getComputedStyle(root).getPropertyValue(name).trim() || fallback;
  const rgb = (hex) => {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.replace(/./g, '$&$&') : h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(',');
  };
  const accent = rgb(css('--zfx-accent', '#2563EB'));
  const dot = rgb(css('--zfx-dot', '#0B1B3F'));
  const escape = (s) => s.replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));

  // ---- Split text --------------------------------------------------------------------------------------
  $$('[data-split]').forEach((el) => {
    let i = 0;
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map((w) => `<span class="zfx-word">${[...w].map((c) => `<span class="zfx-mask"><span class="zfx-ch" style="--i:${i++}">${escape(c)}</span></span>`).join('')}</span>`).join(' ');
    el.setAttribute('aria-label', words.join(' '));
  });
  $$('[data-split-words]').forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map((w, i) => `<span class="zfx-mask"><span class="zfx-ch" style="--i:${i * 3}">${escape(w)}</span></span>`).join(' ');
    el.setAttribute('aria-label', words.join(' '));
  });
  // Consecutive split lines inside one heading start one after another.
  $$('[data-split-group]').forEach((group) => {
    let base = 0;
    $$('[data-split], [data-split-words]', group).forEach((el) => {
      el.style.setProperty('--base', `${base}ms`);
      base += el.querySelectorAll('.zfx-ch').length * 26 + 90;
    });
  });

  // ---- Reveal on scroll ------------------------------------------------------------------------------------
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    io.unobserve(e.target);
  }), { threshold: 0.16, rootMargin: '0px 0px -6% 0px' });
  $$('[data-stagger]').forEach((group) => [...group.children].forEach((el, i) => {
    if (!el.hasAttribute('data-reveal')) el.setAttribute('data-reveal', '');
    el.style.setProperty('--d', `${(i % Number(group.dataset.stagger || 3)) * 0.09}s`);
  }));
  $$('[data-reveal], [data-split], [data-split-words], [data-blur], [data-draw]').forEach((el) => io.observe(el));

  // ---- Rotating word ----------------------------------------------------------------------------------------
  $$('[data-rotate]').forEach((rot) => {
    if (reduce) return;
    const words = JSON.parse(rot.dataset.rotate);
    let n = 0;
    const measure = (text) => {
      const probe = document.createElement('span');
      probe.textContent = text;
      probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap';
      rot.appendChild(probe);
      const w = probe.getBoundingClientRect().width;
      probe.remove();
      return w;
    };
    rot.style.width = measure(words[0]) + 'px';
    setInterval(() => {
      if (document.hidden) return;
      n = (n + 1) % words.length;
      const old = rot.querySelector('span:not(.out)');
      old.className = 'out';
      const next = document.createElement('span');
      next.className = 'in';
      next.textContent = words[n];
      rot.appendChild(next);
      rot.style.width = measure(words[n]) + 'px';
      setTimeout(() => old.remove(), 600);
    }, Number(rot.dataset.every || 2400));
  });

  // ---- Nav ------------------------------------------------------------------------------------------------------
  const nav = document.querySelector('[data-nav]');
  if (nav) {
    const darks = $$('[data-dark]');
    const onScroll = () => {
      nav.classList.toggle('scrolled', window.scrollY > 24);
      nav.classList.toggle('on-dark', darks.some((d) => { const r = d.getBoundingClientRect(); return r.top < 60 && r.bottom > 60; }));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ---- Tilt -------------------------------------------------------------------------------------------------------
  if (fine && !reduce) {
    $$('[data-tilt]').forEach((card) => {
      const area = card.closest('[data-tilt-area]') || card.parentElement;
      const max = Number(card.dataset.tilt || 10);
      area.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.classList.add('tilting');
        card.style.setProperty('--ry', `${x * max}deg`);
        card.style.setProperty('--rx', `${-y * max * 0.8}deg`);
        card.style.setProperty('--gx', `${(x + 0.5) * 100}%`);
        card.style.setProperty('--gy', `${(y + 0.5) * 100}%`);
      });
      area.addEventListener('pointerleave', () => {
        card.classList.remove('tilting');
        card.style.setProperty('--ry', '0deg');
        card.style.setProperty('--rx', '0deg');
      });
    });
  }

  // ---- Magnet -------------------------------------------------------------------------------------------------------
  if (fine && !reduce) {
    $$('[data-magnet]').forEach((btn) => {
      const base = getComputedStyle(btn).transition;
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        btn.style.transition = `transform .15s linear${base ? ', ' + base : ''}`;
        btn.style.transform = `translate(${(e.clientX - (r.left + r.width / 2)) * 0.22}px, ${(e.clientY - (r.top + r.height / 2)) * 0.3}px)`;
      });
      btn.addEventListener('pointerleave', () => {
        btn.style.transition = `transform .6s cubic-bezier(.2,.8,.2,1)${base ? ', ' + base : ''}`;
        btn.style.transform = '';
      });
    });
  }

  // ---- Click sparks -------------------------------------------------------------------------------------------------
  if (!reduce) {
    let canvas = null;
    let ctx = null;
    let sparks = [];
    const draw = (t) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      sparks = sparks.filter((s) => t - s.t0 < 520);
      for (const s of sparks) {
        const p = (t - s.t0) / 520;
        const ease = 1 - Math.pow(1 - p, 3);
        const d = ease * 34;
        const len = 12 * (1 - ease);
        ctx.strokeStyle = `rgba(${accent}, ${1 - p})`;
        ctx.lineWidth = 2.2 * devicePixelRatio;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo((s.x + Math.cos(s.a) * d) * devicePixelRatio, (s.y + Math.sin(s.a) * d) * devicePixelRatio);
        ctx.lineTo((s.x + Math.cos(s.a) * (d + len)) * devicePixelRatio, (s.y + Math.sin(s.a) * (d + len)) * devicePixelRatio);
        ctx.stroke();
      }
      if (sparks.length) requestAnimationFrame(draw);
    };
    document.addEventListener('pointerdown', (e) => {
      if (!e.target.closest('[data-spark]')) return;
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.className = 'zfx-spark';
        document.body.appendChild(canvas);
        ctx = canvas.getContext('2d');
      }
      canvas.width = innerWidth * devicePixelRatio;
      canvas.height = innerHeight * devicePixelRatio;
      const t0 = performance.now();
      const start = !sparks.length;
      for (let k = 0; k < 9; k++) sparks.push({ x: e.clientX, y: e.clientY, a: (Math.PI * 2 * k) / 9, t0 });
      if (start) requestAnimationFrame(draw);
    });
  }

  // ---- Dot grid ------------------------------------------------------------------------------------------------------
  $$('[data-dots]').forEach((canvas) => {
    if (reduce) return;
    const ctx = canvas.getContext('2d');
    const gap = Number(canvas.dataset.dots || 26);
    const idle = Number(canvas.dataset.dotsAlpha || 0.16);
    let dots = [];
    let w = 0;
    let h = 0;
    let pointer = { x: -9999, y: -9999 };
    let visible = true;
    const build = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = w * devicePixelRatio;
      canvas.height = h * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      dots = [];
      for (let y = gap / 2; y < h; y += gap) for (let x = gap / 2; x < w; x += gap) dots.push({ x, y, ox: x, oy: y, vx: 0, vy: 0 });
    };
    const frame = () => {
      if (visible) {
        ctx.clearRect(0, 0, w, h);
        for (const d of dots) {
          const dx = d.x - pointer.x;
          const dy = d.y - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 130 && dist > 0.1) {
            const f = (1 - dist / 130) * 2.4;
            d.vx += (dx / dist) * f;
            d.vy += (dy / dist) * f;
          }
          d.vx += (d.ox - d.x) * 0.06;
          d.vy += (d.oy - d.y) * 0.06;
          d.vx *= 0.82;
          d.vy *= 0.82;
          d.x += d.vx;
          d.y += d.vy;
          const near = Math.max(0, 1 - dist / 170);
          ctx.fillStyle = near > 0.02 ? `rgba(${accent}, ${0.25 + near * 0.6})` : `rgba(${dot}, ${idle})`;
          ctx.beginPath();
          ctx.arc(d.x, d.y, 1.4 + near * 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      requestAnimationFrame(frame);
    };
    build();
    new ResizeObserver(build).observe(canvas);
    const area = canvas.parentElement;
    area.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
    });
    area.addEventListener('pointerleave', () => { pointer = { x: -9999, y: -9999 }; });
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(area);
    requestAnimationFrame(frame);
  });

  // ---- Velocity marquee -------------------------------------------------------------------------------------------------
  const rows = $$('[data-velocity]').map((row) => ({ track: row.firstElementChild, dir: Number(row.dataset.velocity), speed: Number(row.dataset.speed || 60), x: 0 }));
  if (rows.length && !reduce) {
    let lastY = window.scrollY;
    let boost = 0;
    let last = performance.now();
    const tick = (t) => {
      const dt = Math.min(64, t - last) / 1000;
      last = t;
      const y = window.scrollY;
      boost += (Math.abs(y - lastY) * 0.9 - boost) * 0.12;
      lastY = y;
      for (const r of rows) {
        const half = r.track.scrollWidth / 2;
        r.x -= r.dir * (r.speed + boost * 24) * dt;
        if (r.x <= -half) r.x += half;
        if (r.x > 0) r.x -= half;
        r.track.style.transform = `translate3d(${r.x}px, 0, 0)`;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // ---- Sticky story ---------------------------------------------------------------------------------------------------------
  $$('[data-steps]').forEach((wrap) => {
    const steps = $$('[data-step]', wrap);
    const show = (n) => {
      steps.forEach((s) => s.classList.toggle('on', Number(s.dataset.step) === n));
      $$('[data-shot]', wrap).forEach((img) => img.classList.toggle('on', Number(img.dataset.shot) === n));
      $$('[data-dot]', wrap).forEach((d) => d.classList.toggle('on', Number(d.dataset.dot) === n));
    };
    const sio = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) show(Number(e.target.dataset.step)); }), { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach((s) => sio.observe(s));
    show(0);
  });

  // ---- Spotlight ---------------------------------------------------------------------------------------------------------------
  if (fine) {
    $$('[data-spotlight]').forEach((box) => box.addEventListener('pointermove', (e) => {
      for (const card of box.children) {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      }
    }));
  }

  // ---- Odometer and count up ---------------------------------------------------------------------------------------------------
  $$('[data-odometer]').forEach((el) => {
    let n = Number(el.dataset.odometer);
    const render = (value) => {
      const digits = String(value).split('');
      while (el.children.length < digits.length) {
        const col = document.createElement('span');
        col.className = 'zfx-digit';
        col.innerHTML = '0123456789'.split('').map((d) => `<b>${d}</b>`).join('');
        el.appendChild(col);
      }
      [...el.children].forEach((col, i) => { col.style.transform = `translateY(${-Number(digits[i]) * 10}%)`; });
    };
    render(n);
    if (reduce) return;
    let timer = null;
    new IntersectionObserver(([e]) => {
      clearInterval(timer);
      if (e.isIntersecting) timer = setInterval(() => { n = n >= 99 ? 12 : n + 1; render(n); }, Number(el.dataset.every || 2200));
    }).observe(el);
  });
  $$('[data-count]').forEach((el) => {
    const target = Number(el.dataset.count);
    if (reduce) { el.textContent = target; return; }
    el.textContent = '0';
    new IntersectionObserver(([e], obs) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      const t0 = performance.now();
      const step = (t) => {
        const p = Math.min(1, (t - t0) / 1200);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }).observe(el);
  });

  // ---- Card swap: the front card goes to the back of the stack ------------------------------------------------------------------
  $$('[data-swap]').forEach((stack) => {
    const cards = [...stack.children];
    let order = cards.map((_, i) => i);
    const place = () => {
      order.forEach((idx, pos) => {
        const c = cards[idx];
        c.style.setProperty('--pos', pos);
        c.style.zIndex = String(cards.length - pos);
        c.classList.toggle('front', pos === 0);
      });
      // Labels marked data-chip="x" follow the front card's data-app="x".
      const app = cards[order[0]].dataset.app;
      if (app) $$('[data-chip]').forEach((chip) => chip.classList.toggle('on', chip.dataset.chip === app));
    };
    const next = () => {
      const front = cards[order[0]];
      front.classList.add('leaving');
      setTimeout(() => {
        front.classList.remove('leaving');
        order = [...order.slice(1), order[0]];
        place();
        stack.dispatchEvent(new CustomEvent('zfx:swap', { detail: order[0] }));
      }, reduce ? 0 : 420);
    };
    place();
    stack.addEventListener('click', next);
    if (!reduce) {
      let timer = setInterval(() => { if (!document.hidden) next(); }, Number(stack.dataset.swap || 4200));
      stack.addEventListener('pointerenter', () => clearInterval(timer));
      stack.addEventListener('pointerleave', () => { timer = setInterval(() => { if (!document.hidden) next(); }, Number(stack.dataset.swap || 4200)); });
    }
  });

  // ---- Scroll stack: pinned cards shrink as the next one slides over them -----------------------------------------------------
  $$('[data-stack]').forEach((wrap) => {
    const cards = $$('[data-stack-card]', wrap);
    if (reduce || !cards.length) return;
    const update = () => {
      cards.forEach((card, i) => {
        const next = cards[i + 1];
        if (!next) return;
        const r = next.getBoundingClientRect();
        const top = parseFloat(getComputedStyle(card).top) || 0;
        const p = Math.min(1, Math.max(0, 1 - (r.top - top) / window.innerHeight));
        card.style.setProperty('--stack', p.toFixed(3));
      });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  });
})();
